import { Router, Request, Response } from 'express';
import { supabase } from '../index';
import { ApiError, logAuditEvent } from '../db';
import { AuthRequest, requireRole, verifyToken } from '../middleware';

const router = Router();

function normalizeFacilities(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function requestRole(req: Request) {
  const authReq = req as AuthRequest;
  return authReq.user?.role || 'student';
}

router.get('/', verifyToken, requireRole(['staff', 'lecturer', 'admin', 'ops']), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('id, name, address, capacity, facilities, contact_email, contact_phone, ops_owner_id, created_at, updated_at')
      .order('name', { ascending: true });

    if (error) {
      throw new ApiError(500, 'DB_ERROR', 'Failed to list venues');
    }

    return res.json({ success: true, data: data || [] });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }

    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
});

router.get('/requests', verifyToken, requireRole(['staff', 'lecturer', 'admin', 'ops']), async (req: Request, res: Response) => {
  try {
    let query = supabase
      .from('venue_booking_requests')
      .select(
        'id, batch_id, venue_id, requested_by_user_id, status, decline_reason, request_notes, suggested_alternatives, created_at, responded_at, responded_by_user_id, updated_at, batch:batches(id, title, status, venue_id), venue:venues(id, name, capacity), requested_by_user:users(id, email, first_name, last_name, role)'
      )
      .order('created_at', { ascending: false });

    const role = requestRole(req);
    if (role === 'staff' || role === 'lecturer') {
      const authReq = req as AuthRequest;
      query = query.eq('requested_by_user_id', authReq.user?.id);
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiError(500, 'DB_ERROR', 'Failed to list venue requests');
    }

    return res.json({ success: true, data: data || [] });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }

    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
});

router.post('/requests', verifyToken, requireRole(['staff', 'lecturer', 'admin', 'ops']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { batchId, venueId, requestNotes } = req.body || {};

    if (!batchId || !venueId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'batchId and venueId are required' } });
    }

    const { data: batch, error: batchError } = await supabase.from('batches').select('id, title, status, venue_id').eq('id', batchId).single();
    const { data: venue, error: venueError } = await supabase.from('venues').select('id, name, capacity').eq('id', venueId).single();

    if (batchError || !batch) {
      return res.status(404).json({ success: false, error: { code: 'BATCH_NOT_FOUND', message: 'Batch not found' } });
    }

    if (venueError || !venue) {
      return res.status(404).json({ success: false, error: { code: 'VENUE_NOT_FOUND', message: 'Venue not found' } });
    }

    const { data, error } = await supabase
      .from('venue_booking_requests')
      .insert({
        batch_id: batchId,
        venue_id: venueId,
        requested_by_user_id: authReq.user?.id,
        status: 'pending',
        request_notes: requestNotes ? String(requestNotes).trim() : null,
      })
      .select('id, batch_id, venue_id, requested_by_user_id, status, decline_reason, request_notes, created_at, updated_at')
      .single();

    if (error || !data) {
      throw new ApiError(500, 'DB_ERROR', 'Failed to create venue request');
    }

    await supabase.from('batches').update({ status: 'pending_venue_approval' }).eq('id', batchId);
    await logAuditEvent('batch_edited', 'batch', batchId, { action: 'venue_requested', venue_id: venueId, request_id: data.id }, authReq.user?.id);

    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }

    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
});

router.post('/requests/:requestId/approve', verifyToken, requireRole(['ops', 'admin']), async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const authReq = req as AuthRequest;

    const { data: request, error: requestError } = await supabase.from('venue_booking_requests').select('id, batch_id, venue_id, status').eq('id', requestId).single();

    if (requestError || !request) {
      return res.status(404).json({ success: false, error: { code: 'REQUEST_NOT_FOUND', message: 'Venue request not found' } });
    }

    const { error: requestUpdateError } = await supabase
      .from('venue_booking_requests')
      .update({ status: 'approved', responded_at: new Date().toISOString(), responded_by_user_id: authReq.user?.id })
      .eq('id', requestId);

    if (requestUpdateError) {
      throw new ApiError(500, 'DB_ERROR', 'Failed to approve venue request');
    }

    const { error: batchUpdateError } = await supabase
      .from('batches')
      .update({ venue_id: request.venue_id, status: 'draft' })
      .eq('id', request.batch_id);

    if (batchUpdateError) {
      throw new ApiError(500, 'DB_ERROR', 'Failed to assign venue to batch');
    }

    await logAuditEvent('venue_approved', 'venue', request.venue_id, { request_id: requestId, batch_id: request.batch_id }, authReq.user?.id);

    return res.json({ success: true, data: { requestId, batchId: request.batch_id, venueId: request.venue_id } });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }

    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
});

router.post('/requests/:requestId/decline', verifyToken, requireRole(['ops', 'admin']), async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { declineReason } = req.body || {};
    const authReq = req as AuthRequest;

    const { data: request, error: requestError } = await supabase.from('venue_booking_requests').select('id, batch_id, venue_id, status').eq('id', requestId).single();

    if (requestError || !request) {
      return res.status(404).json({ success: false, error: { code: 'REQUEST_NOT_FOUND', message: 'Venue request not found' } });
    }

    const { error: updateError } = await supabase
      .from('venue_booking_requests')
      .update({
        status: 'declined',
        decline_reason: declineReason ? String(declineReason).trim() : 'Declined by Ops',
        responded_at: new Date().toISOString(),
        responded_by_user_id: authReq.user?.id,
      })
      .eq('id', requestId);

    if (updateError) {
      throw new ApiError(500, 'DB_ERROR', 'Failed to decline venue request');
    }

    await logAuditEvent('venue_declined', 'venue', request.venue_id, { request_id: requestId, batch_id: request.batch_id, decline_reason: declineReason || null }, authReq.user?.id);

    return res.json({ success: true, data: { requestId, batchId: request.batch_id, venueId: request.venue_id } });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }

    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
});

router.get('/:venueId', verifyToken, requireRole(['staff', 'lecturer', 'admin', 'ops']), async (req: Request, res: Response) => {
  try {
    const { venueId } = req.params;
    const { data, error } = await supabase
      .from('venues')
      .select('id, name, address, capacity, facilities, contact_email, contact_phone, ops_owner_id, created_at, updated_at, venue_availability(*), blackout_windows(*)')
      .eq('id', venueId)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: { code: 'VENUE_NOT_FOUND', message: 'Venue not found' } });
    }

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }

    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
});

router.post('/', verifyToken, requireRole(['ops', 'admin']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { name, address, capacity, facilities, contact_email, contact_phone } = req.body || {};

    if (!name || !capacity) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name and capacity are required' } });
    }

    const { data, error } = await supabase
      .from('venues')
      .insert({
        name: String(name).trim(),
        address: address ? String(address).trim() : null,
        capacity: Number(capacity),
        facilities: normalizeFacilities(facilities),
        contact_email: contact_email ? String(contact_email).trim() : null,
        contact_phone: contact_phone ? String(contact_phone).trim() : null,
        ops_owner_id: authReq.user?.id || null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new ApiError(500, 'DB_ERROR', 'Failed to create venue');
    }

    await logAuditEvent('data_exported', 'venue', data.id, { action: 'venue_created', venue_name: data.name }, authReq.user?.id);

    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }

    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
});

router.put('/:venueId', verifyToken, requireRole(['ops', 'admin']), async (req: Request, res: Response) => {
  try {
    const { venueId } = req.params;
    const { name, address, capacity, facilities, contact_email, contact_phone } = req.body || {};
    const payload: Record<string, any> = {};

    if (name !== undefined) payload.name = String(name).trim();
    if (address !== undefined) payload.address = address ? String(address).trim() : null;
    if (capacity !== undefined) payload.capacity = Number(capacity);
    if (facilities !== undefined) payload.facilities = normalizeFacilities(facilities);
    if (contact_email !== undefined) payload.contact_email = contact_email ? String(contact_email).trim() : null;
    if (contact_phone !== undefined) payload.contact_phone = contact_phone ? String(contact_phone).trim() : null;

    const { data, error } = await supabase.from('venues').update(payload).eq('id', venueId).select().single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: { code: 'VENUE_NOT_FOUND', message: 'Venue not found' } });
    }

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }

    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
});

export default router;