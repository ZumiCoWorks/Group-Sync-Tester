import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { supabase } from '../index';
import { parseRosterExcel } from '../services/xlsx-parser';
import { generateGroups } from '../services/grouping-algo';
import { ApiError } from '../db';
import pino from 'pino';

const logger = pino();
const router = Router();

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
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * POST /api/group-sync/session
 * Create a new grouping session
 */
router.post('/session', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, host_id } = req.body;

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
        host_id: host_id || null,
        status: 'lobby',
        groups: [],
        roster: []
      })
      .select()
      .single();

    if (error || !session) {
      logger.error(error, 'Error creating sync session');
      throw new ApiError(500, 'DB_ERROR', 'Failed to create sync session');
    }

    return res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/group-sync/session/:code
 * Retrieve session details + active participants
 */
router.get('/session/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const normalizedCode = code.trim().toUpperCase();

    const { data: session, error: sessionError } = await supabase
      .from('sync_sessions')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (sessionError || !session) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
    }

    const { data: participants, error: participantsError } = await supabase
      .from('sync_participants')
      .select('*')
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
 * POST /api/group-sync/session/:code/join
 * Student joins the session. Matches their student number (or name) against the uploaded roster.
 */
router.post('/session/:code/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const { name, avatar, student_number } = req.body;
    const normalizedCode = code.trim().toUpperCase();

    if (!name || !avatar) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Name and avatar are required');
    }

    const { data: session, error: sessionError } = await supabase
      .from('sync_sessions')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (sessionError || !session) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
    }

    if (session.status === 'ended') {
      throw new ApiError(403, 'SESSION_CLOSED', 'This session has already ended');
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
        discipline = matched.discipline;
        currentPlacement = matched.currentPlacement;
      }
    }

    // Insert participant
    const { data: participant, error: joinError } = await supabase
      .from('sync_participants')
      .insert({
        session_id: session.id,
        name,
        avatar,
        student_number: student_number || null,
        discipline: discipline || null,
        current_placement: currentPlacement || null
      })
      .select()
      .single();

    if (joinError || !participant) {
      logger.error(joinError, 'Error joining session');
      throw new ApiError(500, 'DB_ERROR', 'Failed to join grouping session');
    }

    return res.status(200).json({
      success: true,
      data: participant
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/group-sync/session/:code/group
 * Run the smart grouping algorithm and update session groups
 */
router.post('/session/:code/group', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const { groupCount, useDisciplines, avoidSamePlacements, requiredDisciplines } = req.body;
    const normalizedCode = code.trim().toUpperCase();

    const targetGroupCount = Number(groupCount);
    if (isNaN(targetGroupCount) || targetGroupCount <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'groupCount must be a positive number');
    }

    const { data: session, error: sessionError } = await supabase
      .from('sync_sessions')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (sessionError || !session) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
    }

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
      return {
        ...p,
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
router.post('/session/:code/end', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const normalizedCode = code.trim().toUpperCase();

    const { data: session, error: sessionError } = await supabase
      .from('sync_sessions')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (sessionError || !session) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
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
router.post('/session/:code/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    const normalizedCode = code.trim().toUpperCase();

    if (!file) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Roster file is required');
    }

    const { data: session, error: sessionError } = await supabase
      .from('sync_sessions')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (sessionError || !session) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
    }

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
router.post('/session/:code/reset', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const normalizedCode = code.trim().toUpperCase();

    const { data: session, error: sessionError } = await supabase
      .from('sync_sessions')
      .select('id')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (sessionError || !session) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
    }

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

    return res.status(200).json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/group-sync/session/:code/populate
 * Pre-populate session lobby with participants from the uploaded roster (for testing/demo)
 */
router.post('/session/:code/populate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const normalizedCode = code.trim().toUpperCase();

    const { data: session, error: sessionError } = await supabase
      .from('sync_sessions')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (sessionError || !session) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
    }

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
      discipline: student.discipline || null,
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
