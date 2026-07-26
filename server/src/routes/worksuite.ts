import { Router, Request, Response } from 'express';
import { supabase } from '../index';
import { ApiError, logAuditEvent } from '../db';
import { AuthRequest, requireRole, verifyToken } from '../middleware';

const router = Router();

// Endpoint to fetch visible venues based on user's department
router.get('/venues', verifyToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) throw new ApiError(401, 'Unauthorized');
    
    // In POC, reading department from public.users mapping
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('department, role_v2')
      .eq('id', authReq.user.id)
      .single();

    if (userErr || !user) throw new ApiError(401, 'User metadata not found');

    const department = user.department;
    const role = user.role_v2;

    let query = supabase.from('venues').select('*');

    // Filter venues logic
    if (role !== 'admin') {
      if (department) {
        query = query.or(`visibility.eq.shared,owning_department.eq.${department}`);
      } else {
        query = query.eq('visibility', 'shared');
      }
    }

    const { data: venues, error: venuesErr } = await query;
    if (venuesErr) throw new ApiError(500, 'Error fetching venues', venuesErr);

    res.json({ success: true, data: venues });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message, details: error.details }
    });
  }
});

// Endpoint to submit a venue request
router.post('/requests', verifyToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) throw new ApiError(401, 'Unauthorized');

    const { venue_id, start_time, end_time, request_reason } = req.body;
    if (!venue_id || !start_time || !end_time) {
      throw new ApiError(400, 'Missing required fields');
    }

    // Get user details
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('department, role_v2')
      .eq('id', authReq.user.id)
      .single();

    if (userErr || !user) throw new ApiError(401, 'User not found');

    const requester_department = user.department;

    // Check sys_config for rules (notice_period, lockout_time etc.)
    // Note: To keep POC simple, we just insert the request directly.
    // In production, you'd add JS validation here.

    const { data: request, error: reqErr } = await supabase
      .from('venue_booking_requests')
      .insert([{
        venue_id,
        start_time,
        end_time,
        request_reason,
        requester_department,
        requested_by_user_id: authReq.user.id,
        status: 'pending'
      }])
      .select()
      .single();

    if (reqErr) {
      // Check for exclusion constraint violation
      if (reqErr.code === '23P01') {
        throw new ApiError(409, 'The venue is no longer available for the selected slot.');
      }
      throw new ApiError(500, 'Error creating request', reqErr);
    }

    // Fire webhook asynchronously (do not block)
    fireTeamsWebhook(venue_id, 'New venue request submitted', request);

    res.json({ success: true, data: request });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message, details: error.details }
    });
  }
});

// Endpoint to list pending requests for approvals
router.get('/requests', verifyToken, requireRole(['ops_venue_admin', 'admin']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('department, role_v2')
      .eq('id', authReq.user?.id)
      .single();

    if (userErr || !user) throw new ApiError(401, 'User not found');

    // Query pending requests for venues owned by this user's department
    let query = supabase
      .from('venue_booking_requests')
      .select('*, venues!inner(name, owning_department)')
      .eq('status', 'pending');

    if (user.role_v2 !== 'admin' && user.department) {
      query = query.eq('venues.owning_department', user.department);
    }

    const { data: requests, error: reqErr } = await query;
    if (reqErr) throw new ApiError(500, 'Error fetching requests', reqErr);

    res.json({ success: true, data: requests });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message, details: error.details }
    });
  }
});

// Endpoint to approve a request
router.post('/requests/:id/approve', verifyToken, requireRole(['ops_venue_admin', 'admin']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const requestId = req.params.id;

    // We rely on RLS/application logic to secure this update. In a real app, verify department ownership.
    const { data: request, error: reqErr } = await supabase
      .from('venue_booking_requests')
      .update({ status: 'approved', responded_at: new Date().toISOString(), responded_by_user_id: authReq.user?.id })
      .eq('id', requestId)
      .select()
      .single();

    if (reqErr) {
      if (reqErr.code === '23P01') throw new ApiError(409, 'Conflict: The slot was just booked by another approved request.');
      throw new ApiError(500, 'Error approving request', reqErr);
    }

    await logAuditEvent(authReq.user!.id, 'APPROVE_VENUE_REQUEST', 'venue_booking_requests', { request_id: requestId });
    fireTeamsWebhookForRequester(request.requester_department, 'Venue request approved', request);

    res.json({ success: true, data: request });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message, details: error.details }
    });
  }
});

// Endpoint to decline a request
router.post('/requests/:id/decline', verifyToken, requireRole(['ops_venue_admin', 'admin']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const requestId = req.params.id;
    const { decline_reason } = req.body;

    const { data: request, error: reqErr } = await supabase
      .from('venue_booking_requests')
      .update({ status: 'declined', decline_reason, responded_at: new Date().toISOString(), responded_by_user_id: authReq.user?.id })
      .eq('id', requestId)
      .select()
      .single();

    if (reqErr) throw new ApiError(500, 'Error declining request', reqErr);

    await logAuditEvent(authReq.user!.id, 'DECLINE_VENUE_REQUEST', 'venue_booking_requests', { request_id: requestId });
    fireTeamsWebhookForRequester(request.requester_department, 'Venue request declined', request);

    res.json({ success: true, data: request });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message, details: error.details }
    });
  }
});

// Mock helper to fire webhooks
async function fireTeamsWebhook(venueId: string, title: string, payload: any) {
  try {
    const { data: venue } = await supabase.from('venues').select('owning_department').eq('id', venueId).single();
    if (venue?.owning_department) {
      fireTeamsWebhookForRequester(venue.owning_department, title, payload);
    }
  } catch (e) {
    console.error('Failed to resolve venue for webhook:', e);
  }
}

async function fireTeamsWebhookForRequester(department: string, title: string, payload: any) {
  try {
    const { data: webhook } = await supabase.from('teams_webhooks').select('webhook_url').eq('department', department).single();
    if (webhook?.webhook_url) {
      console.log(`[Webhook -> ${department}] ${title}:`, payload);
      // fetch(webhook.webhook_url, { method: 'POST', body: JSON.stringify({...}) });
    }
  } catch (e) {
    console.error('Failed to trigger webhook for department:', department);
  }
}

export default router;
