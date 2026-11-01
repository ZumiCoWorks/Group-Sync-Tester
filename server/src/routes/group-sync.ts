import { Router, Request, Response, NextFunction } from 'express';
import { randomInt } from 'crypto';
import multer from 'multer';
import { supabase } from '../index';
import { parseRosterExcel } from '../services/xlsx-parser';
import { generateGroups } from '../services/grouping-algo';
import { ApiError, logAuditEvent } from '../db';
import { AuthRequest, requireRole, verifyToken } from '../middleware';
import {
  canManageGroupSyncSession,
  isPopulateEnabled,
  projectParticipant,
  projectParticipantSession,
  projectPublicSession,
  type GroupSyncParticipantRecord,
  type GroupSyncSessionRecord,
} from '../services/group-sync-access';
import pino from 'pino';

const logger = pino();
const router = Router();
const staffRoles = ['tutor_junior', 'tutor_senior', 'lecturer', 'adhoc', 'admin'];
const sessionFields = 'id, code, name, host_id, status, groups, roster, created_at, updated_at, ended_at';
const participantFields = 'id, session_id, name, avatar, student_number, discipline, current_placement, joined_at';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Generate a unique 6-character alphanumeric session code (excluding confusing characters)
 */
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 1, 0, I, O
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(randomInt(chars.length));
  }
  return code;
}

function normalizeSessionCode(code: string) {
  return code.trim().toUpperCase();
}

async function loadSessionByCode(code: string) {
  const { data, error } = await supabase
    .from('sync_sessions')
    .select(sessionFields)
    .eq('code', normalizeSessionCode(code))
    .maybeSingle();

  if (error || !data) {
    throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
  }

  return data as GroupSyncSessionRecord;
}

function requireSessionHost(req: Request, session: GroupSyncSessionRecord) {
  const user = (req as AuthRequest).user;
  if (!canManageGroupSyncSession(user, session)) {
    throw new ApiError(403, 'HOST_REQUIRED', 'You do not have permission to manage this session');
  }
}

function requireOpenSession(session: GroupSyncSessionRecord) {
  if (session.status === 'ended') {
    throw new ApiError(409, 'SESSION_CLOSED', 'This session has already ended');
  }
}

async function auditHostAction(req: Request, action: string, sessionId: string, details: Record<string, unknown> = {}) {
  const user = (req as AuthRequest).user;
  if (user) await logAuditEvent(action, 'sync_session', sessionId, details, user.id);
}

/**
 * POST /api/group-sync/session
 * Create a new grouping session
 */
router.post('/session', verifyToken, requireRole(staffRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (name.length > 120) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Session name must be 120 characters or fewer');
    }

    let code = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      code = generateSessionCode();
      const { data, error } = await supabase
        .from('sync_sessions')
        .select('id')
        .eq('code', code)
        .maybeSingle();

      if (!error && !data) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new ApiError(500, 'SERVER_ERROR', 'Failed to generate unique session code');
    }

    const { data: session, error } = await supabase
      .from('sync_sessions')
      .insert({
        code,
        name: name || 'Group Sync Session',
        host_id: authReq.user!.id,
        status: 'lobby',
        groups: [],
        roster: []
      })
      .select(sessionFields)
      .single();

    if (error || !session) {
      logger.error(error, 'Error creating sync session');
      throw new ApiError(500, 'DB_ERROR', 'Failed to create sync session');
    }

    await auditHostAction(req, 'group_sync_session_created', session.id, { source: 'direct_group_sync' });

    return res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/group-sync/session/:code/host
 * Retrieve the full host view after authentication and ownership verification.
 */
router.get('/session/:code/host', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await loadSessionByCode(req.params.code);
    requireSessionHost(req, session);

    const { data: participants, error: participantsError } = await supabase
      .from('sync_participants')
      .select(participantFields)
      .eq('session_id', session.id)
      .order('joined_at', { ascending: true });

    if (participantsError) {
      logger.error(participantsError, 'Error loading participants');
      throw new ApiError(500, 'DB_ERROR', 'Failed to load session participants');
    }

    return res.status(200).json({
      success: true,
      data: {
        session,
        participants: participants || []
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/group-sync/session/:code
 * Return public discovery fields, or a participant-scoped view when a valid
 * participant capability is supplied.
 */
router.get('/session/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await loadSessionByCode(req.params.code);
    const participantId = req.header('x-group-sync-participant')?.trim() || '';

    if (!participantId) {
      return res.status(200).json({
        success: true,
        data: { session: projectPublicSession(session), participants: [] },
      });
    }

    const { data: participant, error } = await supabase
      .from('sync_participants')
      .select(participantFields)
      .eq('id', participantId)
      .eq('session_id', session.id)
      .maybeSingle();

    if (error || !participant) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
    }

    const participantRecord = participant as GroupSyncParticipantRecord;
    return res.status(200).json({
      success: true,
      data: {
        session: projectParticipantSession(session, participantRecord),
        participants: [projectParticipant(participantRecord)],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/group-sync/session/:code/join
 * Student joins the session. Matches their student number (or name) against the uploaded roster.
 */
router.post('/session/:code/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const { name, avatar, student_number } = req.body;
    const normalizedCode = normalizeSessionCode(code);

    if (typeof name !== 'string' || typeof avatar !== 'string' || !name.trim() || !avatar.trim()) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Name and avatar are required');
    }

    if (name.trim().length > 120 || avatar.trim().length > 50) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Participant details exceed the allowed length');
    }

    const { data: session, error: sessionError } = await supabase
      .from('sync_sessions')
      .select('id, code, status, roster')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (sessionError || !session) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
    }

    if (session.status === 'ended') {
      throw new ApiError(403, 'SESSION_CLOSED', 'This session has already ended');
    }

    const normalizedStudentNumber = typeof student_number === 'string' ? student_number.trim() : '';
    if (normalizedStudentNumber) {
      const { data: existingParticipant, error: existingError } = await supabase
        .from('sync_participants')
        .select(participantFields)
        .eq('session_id', session.id)
        .eq('student_number', normalizedStudentNumber)
        .maybeSingle();

      if (existingError) {
        logger.error(existingError, 'Error checking existing participant');
        throw new ApiError(500, 'DB_ERROR', 'Failed to join grouping session');
      }

      if (existingParticipant) {
        return res.status(200).json({
          success: true,
          data: projectParticipant(existingParticipant as GroupSyncParticipantRecord),
        });
      }
    }

    // Try to match student in the roster
    let discipline: string | undefined;
    let currentPlacement: string | undefined;
    const roster = (session.roster || []) as any[];

    if (roster.length > 0) {
      let matched: any = null;

      if (student_number) {
        matched = roster.find(
          s => s.studentNumber && String(s.studentNumber).trim().toLowerCase() === String(student_number).trim().toLowerCase()
        );
      }

      if (!matched) {
        matched = roster.find(
          s => s.name && String(s.name).trim().toLowerCase() === String(name).trim().toLowerCase()
        );
      }

      if (matched) {
        const disciplines = Array.isArray(matched.disciplines) ? matched.disciplines.filter(Boolean) : [];
        discipline = disciplines.length > 0 ? disciplines.join(' | ') : matched.discipline;
        currentPlacement = matched.currentPlacement;
      }
    }

    // Insert participant
    const { data: participant, error: joinError } = await supabase
      .from('sync_participants')
      .insert({
        session_id: session.id,
        name: name.trim(),
        avatar: avatar.trim(),
        student_number: normalizedStudentNumber || null,
        discipline: discipline || null,
        current_placement: currentPlacement || null
      })
      .select(participantFields)
      .single();

    if (joinError || !participant) {
      logger.error(joinError, 'Error joining session');
      throw new ApiError(500, 'DB_ERROR', 'Failed to join grouping session');
    }

    return res.status(200).json({
      success: true,
      data: projectParticipant(participant as GroupSyncParticipantRecord)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/group-sync/session/:code/group
 * Run the smart grouping algorithm and update session groups
 */
router.post('/session/:code/group', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const { groupCount, useDisciplines, avoidSamePlacements, requiredDisciplines } = req.body;
    const normalizedCode = normalizeSessionCode(code);

    const targetGroupCount = Number(groupCount);
    if (isNaN(targetGroupCount) || targetGroupCount <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'groupCount must be a positive number');
    }

    const session = await loadSessionByCode(normalizedCode);
    requireSessionHost(req, session);
    requireOpenSession(session);

    // Load current active participants
    const { data: participants, error: participantsError } = await supabase
      .from('sync_participants')
      .select('*')
      .eq('session_id', session.id);

    if (participantsError || !participants) {
      logger.error(participantsError, 'Error fetching participants for grouping');
      throw new ApiError(500, 'DB_ERROR', 'Failed to load participants');
    }

    if (participants.length === 0) {
      throw new ApiError(400, 'NO_PARTICIPANTS', 'Cannot group empty lobby');
    }

    // Attach performance rating from the session roster in-memory
    const roster = (session.roster || []) as any[];
    const participantsWithPerf = participants.map((p: any) => {
      let matched: any = null;
      if (p.student_number) {
        matched = roster.find(
          s => s.studentNumber && String(s.studentNumber).trim().toLowerCase() === String(p.student_number).trim().toLowerCase()
        );
      }
      if (!matched) {
        matched = roster.find(
          s => s.name && String(s.name).trim().toLowerCase() === String(p.name).trim().toLowerCase()
        );
      }
      const disciplines = Array.isArray(matched?.disciplines)
        ? matched.disciplines.filter((discipline: unknown): discipline is string => typeof discipline === 'string' && !!discipline.trim())
        : String(p.discipline || '').split(/[|;\n]+/).map((discipline: string) => discipline.trim()).filter(Boolean);
      return {
        ...p,
        discipline: disciplines.join(' | ') || p.discipline,
        disciplines,
        performance: matched?.performance || null
      };
    });

    // Generate groups
    const groups = generateGroups(participantsWithPerf as any[], {
      groupCount: targetGroupCount,
      useDisciplines: !!useDisciplines,
      avoidSamePlacements: !!avoidSamePlacements,
      requiredDisciplines: Array.isArray(requiredDisciplines) ? requiredDisciplines : []
    });

    // Save groups to session
    const { data: updatedSession, error: updateError } = await supabase
      .from('sync_sessions')
      .update({
        groups,
        status: 'grouped',
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id)
      .select()
      .single();

    if (updateError || !updatedSession) {
      logger.error(updateError, 'Error updating groups on session');
      throw new ApiError(500, 'DB_ERROR', 'Failed to save generated groups');
    }

    await auditHostAction(req, 'group_sync_groups_generated', session.id, { group_count: groups.length });

    return res.status(200).json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/group-sync/session/:code/end
 * End/Archive session
 */
router.post('/session/:code/end', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const session = await loadSessionByCode(code);
    requireSessionHost(req, session);

    if (session.status === 'ended') {
      return res.status(200).json({ success: true, data: session });
    }

    const { data: updatedSession, error: updateError } = await supabase
      .from('sync_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id)
      .select()
      .single();

    if (updateError || !updatedSession) {
      logger.error(updateError, 'Error ending session');
      throw new ApiError(500, 'DB_ERROR', 'Failed to end session');
    }

    await auditHostAction(req, 'group_sync_session_ended', session.id);

    return res.status(200).json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/group-sync/session/:code/upload
 * Upload roster containing Class List + Current Placements
 */
router.post('/session/:code/upload', verifyToken, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    const normalizedCode = normalizeSessionCode(code);

    if (!file) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Roster file is required');
    }

    const session = await loadSessionByCode(normalizedCode);
    requireSessionHost(req, session);
    requireOpenSession(session);

    // Parse the uploaded roster Excel file
    const parseResult = parseRosterExcel(file.buffer);
    if (!parseResult.success) {
      throw new ApiError(400, 'PARSING_ERROR', parseResult.error || 'Failed to parse roster file');
    }

    // Update session roster
    const { data: updatedSession, error: updateError } = await supabase
      .from('sync_sessions')
      .update({
        roster: parseResult.students,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id)
      .select()
      .single();

    if (updateError || !updatedSession) {
      logger.error(updateError, 'Error saving roster to session');
      throw new ApiError(500, 'DB_ERROR', 'Failed to save parsed roster to session');
    }

    await auditHostAction(req, 'group_sync_roster_uploaded', session.id, { student_count: parseResult.students.length });

    return res.status(200).json({
      success: true,
      data: {
        session: updatedSession,
        summary: parseResult.summary,
        studentsCount: parseResult.students.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/group-sync/session/:code/reset
 * Reset session back to lobby (clears groups)
 */
router.post('/session/:code/reset', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const session = await loadSessionByCode(code);
    requireSessionHost(req, session);
    requireOpenSession(session);

    const { data: updatedSession, error: updateError } = await supabase
      .from('sync_sessions')
      .update({
        status: 'lobby',
        groups: [],
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id)
      .select()
      .single();

    if (updateError || !updatedSession) {
      logger.error(updateError, 'Error resetting session');
      throw new ApiError(500, 'DB_ERROR', 'Failed to reset session');
    }

    await auditHostAction(req, 'group_sync_session_reset', session.id);

    return res.status(200).json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/group-sync/session/:code
 * Update host-controlled presentation fields without exposing direct table writes.
 */
router.patch('/session/:code', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await loadSessionByCode(req.params.code);
    requireSessionHost(req, session);
    requireOpenSession(session);

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (req.body?.name !== undefined) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim() || req.body.name.trim().length > 120) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Session name must be between 1 and 120 characters');
      }
      payload.name = req.body.name.trim();
    }

    if (req.body?.groups !== undefined) {
      if (!Array.isArray(req.body.groups) || req.body.groups.length > 100 || JSON.stringify(req.body.groups).length > 1_000_000) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Groups payload is invalid or too large');
      }
      payload.groups = req.body.groups;
    }

    if (payload.name === undefined && payload.groups === undefined) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'A session name or groups payload is required');
    }

    const { data, error } = await supabase
      .from('sync_sessions')
      .update(payload)
      .eq('id', session.id)
      .select(sessionFields)
      .single();

    if (error || !data) {
      logger.error(error, 'Error updating sync session');
      throw new ApiError(500, 'DB_ERROR', 'Failed to update sync session');
    }

    await auditHostAction(req, 'group_sync_session_updated', session.id, {
      name_changed: payload.name !== undefined,
      groups_changed: payload.groups !== undefined,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/group-sync/session/:code/participants/:participantId
 * Remove a participant after host ownership verification.
 */
router.delete('/session/:code/participants/:participantId', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await loadSessionByCode(req.params.code);
    requireSessionHost(req, session);
    requireOpenSession(session);

    const { data: participant, error: participantError } = await supabase
      .from('sync_participants')
      .select(participantFields)
      .eq('id', req.params.participantId)
      .eq('session_id', session.id)
      .maybeSingle();

    if (participantError || !participant) {
      throw new ApiError(404, 'PARTICIPANT_NOT_FOUND', 'Participant not found');
    }

    const participantRecord = participant as GroupSyncParticipantRecord;
    const participantNumber = participantRecord.student_number?.trim().toLowerCase();
    const participantName = participantRecord.name.trim().toLowerCase();
    const groups = Array.isArray(session.groups) ? session.groups as Array<{ id?: string; members?: Array<{ name?: string; student_number?: string }> }> : [];
    const updatedGroups = groups.map((group) => ({
      ...group,
      members: (group.members || []).filter((member) => {
        const memberNumber = member.student_number?.trim().toLowerCase();
        return !((participantNumber && memberNumber === participantNumber) || member.name?.trim().toLowerCase() === participantName);
      }),
    }));

    const { error: deleteError } = await supabase
      .from('sync_participants')
      .delete()
      .eq('id', participantRecord.id)
      .eq('session_id', session.id);

    if (deleteError) {
      logger.error(deleteError, 'Error removing sync participant');
      throw new ApiError(500, 'DB_ERROR', 'Failed to remove participant');
    }

    if (JSON.stringify(updatedGroups) !== JSON.stringify(groups)) {
      const { error: groupUpdateError } = await supabase
        .from('sync_sessions')
        .update({ groups: updatedGroups, updated_at: new Date().toISOString() })
        .eq('id', session.id);
      if (groupUpdateError) logger.error(groupUpdateError, 'Participant removed but group cleanup failed');
    }

    await auditHostAction(req, 'group_sync_participant_removed', session.id, { participant_id: participantRecord.id });

    return res.status(200).json({ success: true, data: { participant_id: participantRecord.id } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/group-sync/session/:code/populate
 * Pre-populate session lobby with participants from the uploaded roster (for testing/demo)
 */
router.post('/session/:code/populate', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isPopulateEnabled(process.env.NODE_ENV, process.env.GROUP_SYNC_ENABLE_DEMO_POPULATE)) {
      throw new ApiError(404, 'NOT_FOUND', 'Route not found');
    }

    const { code } = req.params;
    const session = await loadSessionByCode(code);
    requireSessionHost(req, session);
    requireOpenSession(session);

    const roster = (session.roster || []) as any[];
    if (roster.length === 0) {
      throw new ApiError(400, 'NO_ROSTER', 'No roster uploaded for this session yet');
    }

    const MOCK_AVATARS = ['⚡', '💎', '🔥', '🪐', '🧬', '💻', '🎓', '⚖️', '🏹', '🛡️', '🧪', '🔭', '🎨', '🎭', '🎪', '🎯', '🎲', '🎸', '🎺', '🎻'];
    
    // Construct bulk insert array
    const participantsToInsert = roster.map((student, index) => ({
      session_id: session.id,
      name: student.name,
      avatar: MOCK_AVATARS[index % MOCK_AVATARS.length],
      student_number: student.studentNumber || null,
      discipline: Array.isArray(student.disciplines) && student.disciplines.length > 0
        ? student.disciplines.join(' | ')
        : student.discipline || null,
      current_placement: student.currentPlacement || null
    }));

    // Clear existing participants first to avoid duplication
    const { error: deleteError } = await supabase
      .from('sync_participants')
      .delete()
      .eq('session_id', session.id);

    if (deleteError) {
      logger.error(deleteError, 'Error clearing old participants for populate');
    }

    const { data: insertedParticipants, error: insertError } = await supabase
      .from('sync_participants')
      .insert(participantsToInsert)
      .select();

    if (insertError || !insertedParticipants) {
      logger.error(insertError, 'Error pre-populating participants');
      throw new ApiError(500, 'DB_ERROR', 'Failed to pre-populate session lobby');
    }

    await auditHostAction(req, 'group_sync_demo_populated', session.id, { participant_count: insertedParticipants.length });

    return res.status(200).json({
      success: true,
      data: {
        session,
        insertedCount: insertedParticipants.length
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
