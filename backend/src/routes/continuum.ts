import { Router, Request, Response } from 'express';
import { supabase } from '../index';

const router = Router();

router.post('/bootstrap', async (_req: Request, res: Response) => {
  try {
    const { data: institution, error: institutionError } = await supabase
      .from('continuum_institutions')
      .upsert({ name: 'AFDA', short_name: 'AFDA', timezone: 'Africa/Johannesburg' }, { onConflict: 'name' })
      .select()
      .single();
    if (institutionError || !institution) return sendError(res, institutionError || new Error('Institution unavailable'));

    const { data: period, error: periodError } = await supabase
      .from('continuum_periods')
      .upsert({ institution_id: institution.id, name: 'Term 3', academic_year: 2026, starts_on: '2026-07-20', ends_on: '2026-09-25', status: 'active' }, { onConflict: 'institution_id,name,academic_year' })
      .select()
      .single();
    if (periodError || !period) return sendError(res, periodError || new Error('Academic period unavailable'));

    const { data: workspace, error: workspaceError } = await supabase
      .from('continuum_workspaces')
      .upsert({ institution_id: institution.id, active_period_id: period.id, name: 'BCom', code: 'BCOM', programme_label: 'Bachelor of Commerce in Business Innovation', status: 'active' }, { onConflict: 'institution_id,code' })
      .select()
      .single();
    if (workspaceError || !workspace) return sendError(res, workspaceError || new Error('Workspace unavailable'));

    const serviceSeed = [
      { name: 'Schedule', service_type: 'booking', base_url: process.env.CONTINUUM_SCHEDULE_URL || 'http://localhost:3001', owner: 'Slot Booking' },
      { name: 'Group Sync', service_type: 'groups', base_url: process.env.CONTINUUM_GROUPS_URL || 'http://localhost:3002', owner: 'Group Sync' },
      { name: 'Spaces', service_type: 'venues', base_url: process.env.CONTINUUM_SPACES_URL || 'http://localhost:3004', owner: 'Venue Booking' },
    ];
    const { data: services, error: servicesError } = await supabase.from('continuum_services').upsert(serviceSeed, { onConflict: 'name' }).select();
    if (servicesError) return sendError(res, servicesError);
    if (services?.length) await supabase.from('continuum_workspace_services').upsert(services.map((service) => ({ workspace_id: workspace.id, service_id: service.id, enabled: true })));

    return res.json({ success: true, data: { institution, period, workspace, services: services || [] } });
  } catch (error) {
    return sendError(res, error);
  }
});

function sendError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected database error';
  return res.status(500).json({ success: false, error: { code: 'CONTINUUM_ERROR', message } });
}

router.get('/workspaces/:workspaceId/activities', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('continuum_activities')
      .select('*, continuum_activity_services(service_id, external_record_id, handoff_status, continuum_services(name, base_url))')
      .eq('workspace_id', req.params.workspaceId)
      .order('starts_on', { ascending: true });
    if (error) return sendError(res, error);
    return res.json({ success: true, data: data || [] });
  } catch (error) {
    return sendError(res, error);
  }
});

router.post('/workspaces/:workspaceId/activities', async (req: Request, res: Response) => {
  const { title, course, starts_on, owner_email, service_ids = [] } = req.body as {
    title?: string; course?: string; starts_on?: string; owner_email?: string; service_ids?: string[];
  };

  if (!title?.trim() || !course?.trim() || !starts_on || !owner_email?.trim()) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'title, course, starts_on, and owner_email are required' } });
  }

  try {
    const { data: activity, error } = await supabase
      .from('continuum_activities')
      .insert({ workspace_id: req.params.workspaceId, title: title.trim(), course: course.trim(), starts_on, owner_email: owner_email.trim() })
      .select()
      .single();
    if (error || !activity) return sendError(res, error || new Error('Activity was not created'));

    if (service_ids.length > 0) {
      const { error: serviceError } = await supabase.from('continuum_activity_services').insert(service_ids.map((service_id) => ({ activity_id: activity.id, service_id, handoff_status: 'ready' })));
      if (serviceError) return sendError(res, serviceError);
    }

    return res.status(201).json({ success: true, data: activity });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get('/services', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('continuum_services').select('*').order('name');
    if (error) return sendError(res, error);
    return res.json({ success: true, data: data || [] });
  } catch (error) {
    return sendError(res, error);
  }
});

export default router;
