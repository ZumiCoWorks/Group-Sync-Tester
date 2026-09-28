import { Router, Response } from 'express';
import { supabase } from '../index';
import { ApiError, logAuditEvent } from '../db';
import { AuthRequest, requireRole, verifyToken } from '../middleware';
import { canRunContinuumAction, isContinuumGrantActive, type ContinuumGrant } from '../services/continuum-access';

const router = Router();
const staffRoles = ['tutor_junior', 'tutor_senior', 'lecturer', 'adhoc', 'ops_venue_admin', 'admin'];

router.use(verifyToken, requireRole(staffRoles));

function message(error: unknown) {
  if (!error) return null;
  if (typeof error === 'object' && error && 'message' in error) return String(error.message);
  return 'Source unavailable';
}

function createSessionCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function requireContinuumAdmin(req: AuthRequest) {
  if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Unauthorized');
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'ADMIN_REQUIRED', 'Continuum workspace configuration requires an administrator');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function canRunWorkspaceAction(req: AuthRequest, workspaceId: string, serviceId: string, capabilityKey: string) {
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;
  const { data, error } = await supabase
    .from('continuum_access_grants')
    .select('id, user_id, workspace_id, capabilities, starts_at, expires_at, revoked_at, service_id')
    .eq('user_id', req.user.id)
    .eq('workspace_id', workspaceId);

  if (error) return false;
  return canRunContinuumAction(req.user.role, (data || []) as ContinuumGrant[], workspaceId, serviceId, capabilityKey);
}

/**
 * GET /api/continuum/overview
 * Read-only aggregation of records already owned by Schedule, Group Sync and WorkSuite.
 * No workspace relationship is inferred when no explicit mapping exists.
 */
router.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Unauthorized');

    const profileResult = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role_v2, department')
      .eq('id', req.user.id)
      .maybeSingle();

    let grantQuery = supabase
      .from('continuum_access_grants')
      .select('id, user_id, workspace_id, service_id, capabilities, starts_at, expires_at, reason, granted_by_user_id, revoked_at, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (req.user.role !== 'admin') grantQuery = grantQuery.eq('user_id', req.user.id);

    const [batchResult, sessionResult, requestResult, institutionResult, periodResult, workspaceResult, serviceResult, enabledServiceResult, workflowResult, linkResult, grantResult] = await Promise.all([
      supabase
        .from('batches')
        .select('id, title, description, status, date_range_start, date_range_end, booking_count, total_slots, updated_at, venue:venues(name)')
        .order('updated_at', { ascending: false })
        .limit(12),
      supabase
        .from('sync_sessions')
        .select('id, code, name, status, groups, created_at, updated_at, ended_at')
        .order('updated_at', { ascending: false })
        .limit(12),
      supabase
        .from('venue_booking_requests')
        .select('id, status, request_reason, start_time, end_time, created_at, venue:venues(name)')
        .eq('requested_by_user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('continuum_institutions')
        .select('id, name, short_name, timezone, created_at, updated_at')
        .order('name', { ascending: true }),
      supabase
        .from('continuum_periods')
        .select('id, institution_id, name, academic_year, starts_on, ends_on, status, created_at, updated_at')
        .order('starts_on', { ascending: false }),
      supabase
        .from('continuum_workspaces')
        .select('id, institution_id, active_period_id, name, code, programme_label, status, description, configuration, created_at, updated_at')
        .order('name', { ascending: true }),
      supabase
        .from('continuum_services')
        .select('id, name, service_type, base_url, return_url, owner, status, created_at, updated_at')
        .order('name', { ascending: true }),
      supabase
        .from('continuum_workspace_services')
        .select('workspace_id, service_id, enabled, configuration, enabled_at, created_at, updated_at')
        .order('created_at', { ascending: true }),
      supabase
        .from('continuum_workflow_runs')
        .select('id, workspace_id, activity_id, service_id, action_key, status, input_snapshot, result_snapshot, source_table, source_record_id, error_code, error_message, created_at, completed_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('continuum_record_links')
        .select('id, workspace_id, activity_id, service_id, source_table, source_record_id, record_type, relationship, created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      grantQuery,
    ]);

    const sessions = sessionResult.data || [];
    let participantCounts: Record<string, number> = {};
    let participantError: unknown = null;

    if (sessions.length) {
      const participantResult = await supabase
        .from('sync_participants')
        .select('session_id')
        .in('session_id', sessions.map((session) => session.id));
      participantError = participantResult.error;
      participantCounts = (participantResult.data || []).reduce<Record<string, number>>((counts, participant) => {
        counts[participant.session_id] = (counts[participant.session_id] || 0) + 1;
        return counts;
      }, {});
    }

    const allGrants = (grantResult.data || []) as Array<ContinuumGrant & { reason: string; granted_by_user_id: string; created_at: string }>;
    const activeOwnGrants = allGrants.filter((grant) => grant.user_id === req.user!.id && isContinuumGrantActive(grant));
    const isAdmin = req.user.role === 'admin';
    const allowedWorkspaceIds = new Set(activeOwnGrants.map((grant) => grant.workspace_id));
    const allLinks = linkResult.data || [];
    const links = isAdmin ? allLinks : allLinks.filter((link) => allowedWorkspaceIds.has(link.workspace_id));
    const workspaceFor = (sourceTable: string, sourceRecordId: string) =>
      links.find((link) => link.source_table === sourceTable && link.source_record_id === sourceRecordId)?.workspace_id || null;
    const sourceVisible = (sourceTable: string, sourceRecordId: string) => isAdmin || links.some((link) => link.source_table === sourceTable && link.source_record_id === sourceRecordId);
    const allWorkspaces = workspaceResult.data || [];
    const workspaces = isAdmin ? allWorkspaces : allWorkspaces.filter((workspace) => allowedWorkspaceIds.has(workspace.id));
    const visiblePeriodIds = new Set(workspaces.map((workspace) => workspace.active_period_id).filter(Boolean));
    const periods = isAdmin ? (periodResult.data || []) : (periodResult.data || []).filter((period) => visiblePeriodIds.has(period.id));
    const visibleInstitutionIds = new Set(workspaces.map((workspace) => workspace.institution_id));
    const institutions = isAdmin ? (institutionResult.data || []) : (institutionResult.data || []).filter((institution) => visibleInstitutionIds.has(institution.id));
    const enabledServices = isAdmin ? (enabledServiceResult.data || []) : (enabledServiceResult.data || []).filter((item) => allowedWorkspaceIds.has(item.workspace_id));
    const workflowRuns = isAdmin ? (workflowResult.data || []) : (workflowResult.data || []).filter((run) => allowedWorkspaceIds.has(run.workspace_id));
    const orchestrationError = institutionResult.error || periodResult.error || workspaceResult.error || serviceResult.error || enabledServiceResult.error || workflowResult.error || linkResult.error || grantResult.error;
    const bcomWorkspace = workspaces.find((workspace) => workspace.code?.toUpperCase() === 'BCOM');

    let grantUsers: Array<{ id: string; email: string | null; first_name: string | null; last_name: string | null; role_v2: string | null }> = [];
    if (isAdmin && allGrants.length) {
      const { data } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role_v2')
        .in('id', Array.from(new Set(allGrants.map((grant) => grant.user_id))));
      grantUsers = data || [];
    }

    return res.json({
      success: true,
      data: {
        profile: profileResult.data || {
          id: req.user.id,
          email: req.user.email || null,
          first_name: null,
          last_name: null,
          role_v2: req.user.role,
          department: null,
        },
        schedule: batchResult.error ? [] : (batchResult.data || []).filter((batch) => sourceVisible('batches', batch.id)).map((batch) => ({
          ...batch,
          continuum_workspace_id: workspaceFor('batches', batch.id),
        })),
        group_sync: sessionResult.error ? [] : sessions.filter((session) => sourceVisible('sync_sessions', session.id)).map((session) => ({
          ...session,
          participant_count: participantCounts[session.id] || 0,
          group_count: Array.isArray(session.groups) ? session.groups.length : 0,
          continuum_workspace_id: workspaceFor('sync_sessions', session.id),
        })),
        spaces: requestResult.error ? [] : (requestResult.data || []).map((request) => ({
          ...request,
          continuum_workspace_id: workspaceFor('venue_booking_requests', request.id),
        })),
        sources: {
          schedule: { available: !batchResult.error, error: message(batchResult.error) },
          group_sync: { available: !sessionResult.error && !participantError, error: message(sessionResult.error || participantError) },
          spaces: { available: !requestResult.error, error: message(requestResult.error) },
        },
        orchestration: {
          available: !orchestrationError,
          error: message(orchestrationError),
          institutions,
          periods,
          workspaces,
          services: serviceResult.data || [],
          enabled_services: enabledServices,
          workflow_runs: workflowRuns,
          record_links: links,
          access_grants: allGrants.map((grant) => ({
            ...grant,
            user: grantUsers.find((user) => user.id === grant.user_id) || null,
            active: isContinuumGrantActive(grant),
          })),
          effective_access: {
            is_admin: isAdmin,
            grants: activeOwnGrants,
          },
        },
        mapping: {
          bcom: bcomWorkspace ? (bcomWorkspace.status === 'archived' ? 'archived' : 'configured') : 'not_configured',
          workspace_id: bcomWorkspace?.id || null,
          explanation: bcomWorkspace
            ? 'BCom is explicitly configured. Only source records with an additive Continuum link belong to this workspace.'
            : 'Live records are shown by their owning service. No BCom mapping is inferred without an approved relationship.',
        },
        refreshed_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: { code: error.code || 'OVERVIEW_FAILED', message: error.message || 'Continuum overview could not be loaded' },
    });
  }
});

/**
 * POST /api/continuum/workspaces
 * Creates explicit school-workspace setup; it does not create an academic model.
 */
router.post('/workspaces', async (req: AuthRequest, res: Response) => {
  try {
    requireContinuumAdmin(req);
    const institutionName = typeof req.body.institution_name === 'string' ? req.body.institution_name.trim() : '';
    const institutionShortName = typeof req.body.institution_short_name === 'string' ? req.body.institution_short_name.trim() : '';
    const timezone = typeof req.body.timezone === 'string' ? req.body.timezone.trim() : 'Africa/Johannesburg';
    const periodName = typeof req.body.period_name === 'string' ? req.body.period_name.trim() : '';
    const academicYear = Number(req.body.academic_year);
    const startsOn = typeof req.body.starts_on === 'string' ? req.body.starts_on : '';
    const endsOn = typeof req.body.ends_on === 'string' ? req.body.ends_on : '';
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const schoolCode = typeof req.body.school_code === 'string' ? req.body.school_code.trim().toUpperCase() : '';
    const programmeLabel = typeof req.body.programme_label === 'string' ? req.body.programme_label.trim() : null;
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : null;

    if (institutionName.length < 2 || institutionName.length > 160 || institutionShortName.length < 2 || institutionShortName.length > 40) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Institution name and short name are required');
    }
    if (periodName.length < 2 || periodName.length > 80 || !Number.isInteger(academicYear) || academicYear < 2000 || academicYear > 2200) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'A valid academic period name and year are required');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(endsOn) || startsOn > endsOn) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Valid academic period start and end dates are required');
    }
    if (name.length < 2 || name.length > 160) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Workspace name must be between 2 and 160 characters');
    }
    if (!/^[A-Z0-9-]{2,30}$/.test(schoolCode)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'School code must use 2–30 uppercase letters, numbers or hyphens');
    }
    if (programmeLabel && programmeLabel.length > 200) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Programme label must be 200 characters or fewer');
    }
    if (description && description.length > 500) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Description must be 500 characters or fewer');
    }

    const { data: institution, error: institutionError } = await supabase
      .from('continuum_institutions')
      .upsert({ name: institutionName, short_name: institutionShortName, timezone }, { onConflict: 'name' })
      .select('id, name, short_name, timezone, created_at, updated_at')
      .single();
    if (institutionError || !institution) {
      throw new ApiError(500, 'INSTITUTION_SETUP_FAILED', institutionError?.message || 'Institution context could not be configured');
    }

    const { data: period, error: periodError } = await supabase
      .from('continuum_periods')
      .upsert({ institution_id: institution.id, name: periodName, academic_year: academicYear, starts_on: startsOn, ends_on: endsOn, status: 'active' }, { onConflict: 'institution_id,name,academic_year' })
      .select('id, institution_id, name, academic_year, starts_on, ends_on, status, created_at, updated_at')
      .single();
    if (periodError || !period) {
      throw new ApiError(500, 'PERIOD_SETUP_FAILED', periodError?.message || 'Academic period could not be configured');
    }

    const configuration = { setup_source: 'continuum_console' };
    const { data: workspace, error } = await supabase
      .from('continuum_workspaces')
      .insert({
        institution_id: institution.id,
        active_period_id: period.id,
        name,
        code: schoolCode,
        programme_label: programmeLabel || null,
        status: 'active',
        description: description || null,
        configuration,
        created_by_user_id: req.user!.id,
      })
      .select('id, institution_id, active_period_id, name, code, programme_label, status, description, configuration, created_at, updated_at')
      .single();

    if (error || !workspace) {
      if (error?.code === '23505') throw new ApiError(409, 'WORKSPACE_EXISTS', 'A workspace with this key already exists');
      throw new ApiError(500, 'WORKSPACE_CREATE_FAILED', error?.message || 'Workspace could not be created');
    }

    await logAuditEvent(
      'continuum_workspace_created',
      'continuum_workspace',
      workspace.id,
      { institution_id: institution.id, period_id: period.id, workspace_code: workspace.code, configuration },
      req.user!.id
    );

    return res.status(201).json({ success: true, data: { institution, period, workspace } });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: { code: error.code || 'WORKSPACE_CREATE_FAILED', message: error.message || 'Workspace could not be created' },
    });
  }
});

/**
 * POST /api/continuum/workspaces/:workspaceId/services
 * Records which existing service is enabled for a workspace.
 */
router.post('/workspaces/:workspaceId/services', async (req: AuthRequest, res: Response) => {
  try {
    requireContinuumAdmin(req);
    const workspaceId = req.params.workspaceId;
    const serviceId = typeof req.body.service_id === 'string' ? req.body.service_id.trim() : '';
    const enabled = req.body.enabled !== false;
    const configuration = isRecord(req.body.configuration) ? req.body.configuration : {};

    if (!workspaceId || !/^[0-9a-f-]{36}$/i.test(workspaceId)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'A valid workspace ID is required');
    }
    if (!/^[0-9a-f-]{36}$/i.test(serviceId)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'A valid service ID is required');
    }

    const { data: workspaceService, error } = await supabase
      .from('continuum_workspace_services')
      .upsert({
        workspace_id: workspaceId,
        service_id: serviceId,
        enabled,
        configuration,
        enabled_by_user_id: enabled ? req.user!.id : null,
        enabled_at: enabled ? new Date().toISOString() : null,
      }, { onConflict: 'workspace_id,service_id' })
      .select('workspace_id, service_id, enabled, configuration, enabled_at, created_at, updated_at')
      .single();

    if (error || !workspaceService) {
      throw new ApiError(500, 'SERVICE_ENABLE_FAILED', error?.message || 'Workspace service could not be updated');
    }

    await logAuditEvent(
      'continuum_workspace_service_updated',
      'continuum_workspace',
      workspaceId,
      { service_id: serviceId, enabled, configuration },
      req.user!.id
    );

    return res.json({ success: true, data: workspaceService });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: { code: error.code || 'SERVICE_ENABLE_FAILED', message: error.message || 'Workspace service could not be updated' },
    });
  }
});

/**
 * POST /api/continuum/workspaces/:workspaceId/access-grants
 * Gives an existing staff identity time-bound authority inside one workspace.
 */
router.post('/workspaces/:workspaceId/access-grants', async (req: AuthRequest, res: Response) => {
  try {
    requireContinuumAdmin(req);
    const workspaceId = req.params.workspaceId;
    const userEmail = typeof req.body.user_email === 'string' ? req.body.user_email.trim().toLowerCase() : '';
    const serviceId = typeof req.body.service_id === 'string' && req.body.service_id.trim() ? req.body.service_id.trim() : null;
    const capabilities: string[] = Array.isArray(req.body.capabilities)
      ? Array.from(new Set(req.body.capabilities.filter((item: unknown): item is string => typeof item === 'string')))
      : [];
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    const expiresAt = typeof req.body.expires_at === 'string' && req.body.expires_at ? req.body.expires_at : null;
    const allowedCapabilities = new Set(['group_sync_manage', 'orchestrate_workflows']);

    if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) throw new ApiError(400, 'VALIDATION_ERROR', 'A valid workspace ID is required');
    if (!/^\S+@\S+\.\S+$/.test(userEmail)) throw new ApiError(400, 'VALIDATION_ERROR', 'Enter the existing staff member email address');
    if (serviceId && !/^[0-9a-f-]{36}$/i.test(serviceId)) throw new ApiError(400, 'VALIDATION_ERROR', 'A valid service ID is required');
    if (!capabilities.length || capabilities.some((capability) => !allowedCapabilities.has(capability))) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Select a supported scoped capability');
    }
    if (reason.length < 5 || reason.length > 300) throw new ApiError(400, 'VALIDATION_ERROR', 'Provide a reason between 5 and 300 characters');
    if (expiresAt && (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now())) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Grant expiry must be a valid future date and time');
    }

    const [{ data: workspace, error: workspaceError }, { data: targetUser, error: userError }] = await Promise.all([
      supabase.from('continuum_workspaces').select('id, name').eq('id', workspaceId).maybeSingle(),
      supabase.from('users').select('id, email, first_name, last_name, role_v2').ilike('email', userEmail).maybeSingle(),
    ]);
    if (workspaceError || !workspace) throw new ApiError(404, 'WORKSPACE_NOT_FOUND', 'The selected workspace does not exist');
    if (userError || !targetUser) throw new ApiError(404, 'USER_NOT_FOUND', 'No canonical staff profile uses that email address');
    if (!staffRoles.includes(targetUser.role_v2) || targetUser.role_v2 === 'admin') {
      throw new ApiError(409, 'ROLE_NOT_ELIGIBLE', 'Scoped grants are for non-admin staff identities only');
    }
    if (serviceId) {
      const { data: enabledService, error: serviceError } = await supabase
        .from('continuum_workspace_services')
        .select('enabled')
        .eq('workspace_id', workspaceId)
        .eq('service_id', serviceId)
        .maybeSingle();
      if (serviceError || !enabledService?.enabled) throw new ApiError(409, 'SERVICE_NOT_ENABLED', 'Enable the selected service for this workspace before granting access');
    }

    const startsAt = new Date().toISOString();
    const { data: grant, error } = await supabase
      .from('continuum_access_grants')
      .insert({
        user_id: targetUser.id,
        workspace_id: workspaceId,
        service_id: serviceId,
        capabilities,
        starts_at: startsAt,
        expires_at: expiresAt,
        reason,
        granted_by_user_id: req.user!.id,
      })
      .select('id, user_id, workspace_id, service_id, capabilities, starts_at, expires_at, reason, granted_by_user_id, revoked_at, created_at')
      .single();
    if (error || !grant) throw new ApiError(500, 'ACCESS_GRANT_FAILED', error?.message || 'Scoped access could not be granted');

    await logAuditEvent(
      'continuum_access_granted',
      'continuum_access_grant',
      grant.id,
      { workspace_id: workspaceId, service_id: serviceId, capabilities, target_user_id: targetUser.id, expires_at: expiresAt, reason },
      req.user!.id
    );

    return res.status(201).json({ success: true, data: { ...grant, user: targetUser, active: true } });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: { code: error.code || 'ACCESS_GRANT_FAILED', message: error.message || 'Scoped access could not be granted' },
    });
  }
});

/**
 * POST /api/continuum/access-grants/:grantId/revoke
 * Revokes a scoped grant without deleting its audit history.
 */
router.post('/access-grants/:grantId/revoke', async (req: AuthRequest, res: Response) => {
  try {
    requireContinuumAdmin(req);
    const grantId = req.params.grantId;
    if (!/^[0-9a-f-]{36}$/i.test(grantId)) throw new ApiError(400, 'VALIDATION_ERROR', 'A valid grant ID is required');

    const revokedAt = new Date().toISOString();
    const { data: grant, error } = await supabase
      .from('continuum_access_grants')
      .update({ revoked_at: revokedAt })
      .eq('id', grantId)
      .is('revoked_at', null)
      .select('id, user_id, workspace_id, service_id, capabilities, starts_at, expires_at, reason, granted_by_user_id, revoked_at, created_at')
      .maybeSingle();
    if (error) throw new ApiError(500, 'ACCESS_REVOKE_FAILED', error.message);
    if (!grant) throw new ApiError(404, 'ACTIVE_GRANT_NOT_FOUND', 'No active scoped grant was found');

    await logAuditEvent(
      'continuum_access_revoked',
      'continuum_access_grant',
      grant.id,
      { workspace_id: grant.workspace_id, service_id: grant.service_id, target_user_id: grant.user_id, revoked_at: revokedAt },
      req.user!.id
    );

    return res.json({ success: true, data: grant });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: { code: error.code || 'ACCESS_REVOKE_FAILED', message: error.message || 'Scoped access could not be revoked' },
    });
  }
});

/**
 * POST /api/continuum/group-sync/sessions
 * A governed write-through to the existing Group Sync source table.
 */
router.post('/group-sync/sessions', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Unauthorized');
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const workspaceId = typeof req.body.workspace_id === 'string' ? req.body.workspace_id.trim() : '';
    if (name.length < 3 || name.length > 120) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Session name must be between 3 and 120 characters');
    }
    if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) {
      throw new ApiError(400, 'WORKSPACE_REQUIRED', 'Select a configured workspace before creating a Group Sync session');
    }

    const { data: groupService, error: groupServiceError } = await supabase
      .from('continuum_services')
      .select('id, name, service_type')
      .eq('service_type', 'groups')
      .maybeSingle();
    if (groupServiceError || !groupService) {
      throw new ApiError(500, 'SERVICE_REGISTRY_MISSING', groupServiceError?.message || 'Group Sync is missing from the Continuum service registry');
    }

    const { data: workspaceService, error: workspaceServiceError } = await supabase
      .from('continuum_workspace_services')
      .select('enabled')
      .eq('workspace_id', workspaceId)
      .eq('service_id', groupService.id)
      .maybeSingle();
    if (workspaceServiceError) throw new ApiError(500, 'WORKSPACE_LOOKUP_FAILED', workspaceServiceError.message);
    if (!workspaceService?.enabled) {
      throw new ApiError(409, 'SERVICE_NOT_ENABLED', 'Enable Group Sync for this workspace before creating a session');
    }
    if (!(await canRunWorkspaceAction(req, workspaceId, groupService.id, 'group_sync'))) {
      throw new ApiError(403, 'CAPABILITY_REQUIRED', 'You do not have Group Sync management access for this workspace');
    }

    const { data: workflowRun, error: workflowError } = await supabase
      .from('continuum_workflow_runs')
      .insert({
        workspace_id: workspaceId,
        service_id: groupService.id,
        action_key: 'create_session',
        status: 'in_progress',
        input_snapshot: { name },
        initiated_by_user_id: req.user.id,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (workflowError || !workflowRun) {
      throw new ApiError(500, 'WORKFLOW_START_FAILED', workflowError?.message || 'Continuum could not record the submitted input');
    }

    let code = '';
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = createSessionCode();
      const { data, error } = await supabase.from('sync_sessions').select('id').eq('code', candidate).maybeSingle();
      if (!error && !data) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      await supabase.from('continuum_workflow_runs').update({ status: 'failed', error_code: 'CODE_GENERATION_FAILED', error_message: 'Could not allocate a unique Group Sync code', completed_at: new Date().toISOString() }).eq('id', workflowRun.id);
      throw new ApiError(500, 'CODE_GENERATION_FAILED', 'Could not allocate a unique Group Sync code');
    }

    const { data: session, error } = await supabase
      .from('sync_sessions')
      .insert({ name, code, host_id: req.user.id, status: 'lobby', groups: [], roster: [] })
      .select('id, code, name, status, groups, created_at, updated_at, ended_at')
      .single();

    if (error || !session) {
      await supabase.from('continuum_workflow_runs').update({ status: 'failed', error_code: 'GROUP_SYNC_CREATE_FAILED', error_message: error?.message || 'Group Sync session could not be created', completed_at: new Date().toISOString() }).eq('id', workflowRun.id);
      throw new ApiError(500, 'GROUP_SYNC_CREATE_FAILED', error?.message || 'Group Sync session could not be created');
    }

    const { error: linkError } = await supabase.from('continuum_record_links').insert({
      workspace_id: workspaceId,
      service_id: groupService.id,
      source_table: 'sync_sessions',
      source_record_id: session.id,
      record_type: 'group_sync_session',
      relationship: 'primary',
      linked_by_user_id: req.user.id,
    });
    if (linkError) {
      await supabase.from('continuum_workflow_runs').update({ status: 'failed', source_table: 'sync_sessions', source_record_id: session.id, result_snapshot: { session_code: session.code, session_status: session.status }, error_code: 'RECORD_LINK_FAILED', error_message: linkError.message, completed_at: new Date().toISOString() }).eq('id', workflowRun.id);
      throw new ApiError(500, 'RECORD_LINK_FAILED', 'The Group Sync session was created, but Continuum could not record its workspace relationship');
    }

    const completedAt = new Date().toISOString();
    const { error: completionError } = await supabase.from('continuum_workflow_runs').update({
      status: 'succeeded',
      source_table: 'sync_sessions',
      source_record_id: session.id,
      result_snapshot: { session_code: session.code, session_status: session.status },
      completed_at: completedAt,
      error_code: null,
      error_message: null,
    }).eq('id', workflowRun.id);
    if (completionError) {
      throw new ApiError(500, 'WORKFLOW_COMPLETE_FAILED', 'The source session was created, but Continuum could not finalise its workflow record');
    }

    await logAuditEvent(
      'continuum_group_sync_session_created',
      'sync_session',
      session.id,
      { source: 'continuum', workspace_id: workspaceId, workflow_run_id: workflowRun.id, session_code: session.code, session_name: session.name },
      req.user.id
    );

    return res.status(201).json({
      success: true,
      data: { ...session, participant_count: 0, group_count: 0, continuum_workspace_id: workspaceId, workflow_run_id: workflowRun.id },
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: { code: error.code || 'GROUP_SYNC_CREATE_FAILED', message: error.message || 'Group Sync session could not be created' },
    });
  }
});

/**
 * POST /api/continuum/group-sync/sessions/:sessionId/link
 * Explicitly brings an existing Group Sync session into a Continuum workspace.
 * The source session stays owned by Group Sync; Continuum stores only the link.
 */
router.post('/group-sync/sessions/:sessionId/link', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Unauthorized');
    const sessionId = req.params.sessionId;
    const workspaceId = typeof req.body.workspace_id === 'string' ? req.body.workspace_id.trim() : '';
    if (!/^[0-9a-f-]{36}$/i.test(sessionId) || !/^[0-9a-f-]{36}$/i.test(workspaceId)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'A valid Group Sync session and workspace are required');
    }

    const [{ data: groupService, error: serviceError }, { data: sourceSession, error: sessionError }] = await Promise.all([
      supabase.from('continuum_services').select('id').eq('service_type', 'groups').maybeSingle(),
      supabase.from('sync_sessions').select('id, code, name, status, groups').eq('id', sessionId).maybeSingle(),
    ]);
    if (serviceError || !groupService) throw new ApiError(500, 'SERVICE_REGISTRY_MISSING', serviceError?.message || 'Group Sync is missing from the service registry');
    if (sessionError || !sourceSession) throw new ApiError(404, 'SESSION_NOT_FOUND', 'The selected Group Sync session no longer exists');

    const { data: workspaceService, error: workspaceServiceError } = await supabase
      .from('continuum_workspace_services')
      .select('enabled')
      .eq('workspace_id', workspaceId)
      .eq('service_id', groupService.id)
      .maybeSingle();
    if (workspaceServiceError) throw new ApiError(500, 'WORKSPACE_LOOKUP_FAILED', workspaceServiceError.message);
    if (!workspaceService?.enabled) throw new ApiError(409, 'SERVICE_NOT_ENABLED', 'Enable Group Sync for this workspace before importing a session');
    if (!(await canRunWorkspaceAction(req, workspaceId, groupService.id, 'group_sync'))) {
      throw new ApiError(403, 'CAPABILITY_REQUIRED', 'You do not have Group Sync management access for this workspace');
    }

    const { data: existingLink, error: existingError } = await supabase
      .from('continuum_record_links')
      .select('id, workspace_id, service_id, source_table, source_record_id, record_type, relationship, created_at')
      .eq('source_table', 'sync_sessions')
      .eq('source_record_id', sessionId)
      .limit(1)
      .maybeSingle();
    if (existingError) throw new ApiError(500, 'RECORD_LINK_LOOKUP_FAILED', existingError.message);
    if (existingLink && existingLink.workspace_id !== workspaceId) {
      throw new ApiError(409, 'SESSION_ALREADY_LINKED', 'This Group Sync session already belongs to another Continuum workspace');
    }
    if (existingLink) return res.json({ success: true, data: existingLink });

    const { data: link, error: linkError } = await supabase
      .from('continuum_record_links')
      .insert({
        workspace_id: workspaceId,
        service_id: groupService.id,
        source_table: 'sync_sessions',
        source_record_id: sessionId,
        record_type: 'group_sync_session',
        relationship: 'primary',
        linked_by_user_id: req.user.id,
      })
      .select('id, workspace_id, service_id, source_table, source_record_id, record_type, relationship, created_at')
      .single();
    if (linkError || !link) throw new ApiError(500, 'RECORD_LINK_FAILED', linkError?.message || 'Continuum could not link the Group Sync session');

    const now = new Date().toISOString();
    await supabase.from('continuum_workflow_runs').insert({
      workspace_id: workspaceId,
      service_id: groupService.id,
      action_key: 'import_existing_session',
      status: 'succeeded',
      input_snapshot: { session_id: sessionId },
      result_snapshot: {
        session_code: sourceSession.code,
        session_status: sourceSession.status,
        group_count: Array.isArray(sourceSession.groups) ? sourceSession.groups.length : 0,
      },
      source_table: 'sync_sessions',
      source_record_id: sessionId,
      initiated_by_user_id: req.user.id,
      started_at: now,
      completed_at: now,
    });

    await logAuditEvent(
      'continuum_group_sync_session_linked',
      'sync_session',
      sessionId,
      { source: 'group_sync', workspace_id: workspaceId, session_code: sourceSession.code, session_name: sourceSession.name },
      req.user.id
    );

    return res.status(201).json({ success: true, data: link });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: { code: error.code || 'RECORD_LINK_FAILED', message: error.message || 'The Group Sync session could not be linked' },
    });
  }
});

/**
 * POST /api/continuum/schedule/batches/:batchId/link
 * Completes a handoff performed in Slot Booking without moving batch ownership.
 */
router.post('/schedule/batches/:batchId/link', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Unauthorized');
    const batchId = req.params.batchId;
    const workspaceId = typeof req.body.workspace_id === 'string' ? req.body.workspace_id.trim() : '';
    const sourceSessionId = typeof req.body.source_session_id === 'string' ? req.body.source_session_id.trim() : '';
    if (!/^[0-9a-f-]{36}$/i.test(batchId) || !/^[0-9a-f-]{36}$/i.test(workspaceId)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'A valid Schedule batch and workspace are required');
    }

    const [{ data: scheduleService, error: serviceError }, { data: batch, error: batchError }] = await Promise.all([
      supabase.from('continuum_services').select('id').eq('service_type', 'schedule').maybeSingle(),
      supabase.from('batches').select('id, title, total_slots, status').eq('id', batchId).maybeSingle(),
    ]);
    if (serviceError || !scheduleService) throw new ApiError(500, 'SERVICE_REGISTRY_MISSING', serviceError?.message || 'Schedule is missing from the service registry');
    if (batchError || !batch) throw new ApiError(404, 'BATCH_NOT_FOUND', 'The Schedule batch no longer exists');

    const { data: workspaceService, error: workspaceServiceError } = await supabase
      .from('continuum_workspace_services')
      .select('enabled')
      .eq('workspace_id', workspaceId)
      .eq('service_id', scheduleService.id)
      .maybeSingle();
    if (workspaceServiceError) throw new ApiError(500, 'WORKSPACE_LOOKUP_FAILED', workspaceServiceError.message);
    if (!workspaceService?.enabled) throw new ApiError(409, 'SERVICE_NOT_ENABLED', 'Enable Schedule for this workspace before linking a batch');
    if (!(await canRunWorkspaceAction(req, workspaceId, scheduleService.id, 'schedule'))) {
      throw new ApiError(403, 'CAPABILITY_REQUIRED', 'You do not have orchestration access for this workspace');
    }

    if (sourceSessionId) {
      if (!/^[0-9a-f-]{36}$/i.test(sourceSessionId)) throw new ApiError(400, 'VALIDATION_ERROR', 'The source Group Sync session ID is invalid');
      const { data: sourceLink, error: sourceError } = await supabase
        .from('continuum_record_links')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('source_table', 'sync_sessions')
        .eq('source_record_id', sourceSessionId)
        .maybeSingle();
      if (sourceError || !sourceLink) throw new ApiError(409, 'SOURCE_NOT_LINKED', 'The Group Sync source must belong to this workspace before the Schedule handoff can be completed');
    }

    const { data: existing, error: existingError } = await supabase
      .from('continuum_record_links')
      .select('id, workspace_id, service_id, source_table, source_record_id, record_type, relationship, created_at')
      .eq('workspace_id', workspaceId)
      .eq('source_table', 'batches')
      .eq('source_record_id', batchId)
      .maybeSingle();
    if (existingError) throw new ApiError(500, 'RECORD_LINK_LOOKUP_FAILED', existingError.message);
    if (existing) return res.json({ success: true, data: existing });

    const { data: link, error: linkError } = await supabase.from('continuum_record_links').insert({
      workspace_id: workspaceId,
      service_id: scheduleService.id,
      source_table: 'batches',
      source_record_id: batchId,
      record_type: 'schedule_batch',
      relationship: 'related',
      linked_by_user_id: req.user.id,
    }).select('id, workspace_id, service_id, source_table, source_record_id, record_type, relationship, created_at').single();
    if (linkError || !link) throw new ApiError(500, 'RECORD_LINK_FAILED', linkError?.message || 'Continuum could not link the Schedule batch');

    const now = new Date().toISOString();
    await supabase.from('continuum_workflow_runs').insert({
      workspace_id: workspaceId,
      service_id: scheduleService.id,
      action_key: 'handoff_to_schedule',
      status: 'succeeded',
      input_snapshot: { source_session_id: sourceSessionId || null },
      result_snapshot: { batch_id: batch.id, batch_title: batch.title, total_slots: batch.total_slots, status: batch.status },
      source_table: 'batches',
      source_record_id: batch.id,
      initiated_by_user_id: req.user.id,
      started_at: now,
      completed_at: now,
    });

    await logAuditEvent('continuum_schedule_batch_linked', 'batch', batch.id, {
      source: 'slot_booking', workspace_id: workspaceId, source_session_id: sourceSessionId || null, total_slots: batch.total_slots,
    }, req.user.id);

    return res.status(201).json({ success: true, data: link });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: { code: error.code || 'RECORD_LINK_FAILED', message: error.message || 'The Schedule batch could not be linked' },
    });
  }
});

export default router;
