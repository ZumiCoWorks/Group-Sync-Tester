import { Router, Request, Response } from 'express';
import { verifyToken, requireRole, AuthRequest } from '../middleware';
import { createBatch, getBatchById, getSlotsByBatchId, listBatches, listBookingsByBatch, publishBatch, updateBatch, closeBatch, ApiError } from '../db';
import { supabase } from '../index';

const router = Router();

async function ensureStaffIdentity(userId: string, email: string) {
  const staffRecord = {
    id: userId,
    email,
    first_name: 'Staff',
    last_name: 'Member',
    role: 'staff',
  };

  const { error: userError } = await supabase
    .from('users')
    .upsert(staffRecord, { onConflict: 'id' });

  if (userError) {
    throw userError;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: userId, email, role: 'staff' }, { onConflict: 'id' });

  if (profileError) {
    logger.error(profileError, 'Error ensuring profiles row');
  }
}

const logger = console;

/**
 * GET /api/batches
 * List batches for the staff dashboard.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const batches = await listBatches(status);

    return res.json({
      success: true,
      data: batches,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * GET /api/batches/:batchId
 * Fetch a single batch by ID (public endpoint)
 */
router.get('/:batchId', async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    const batch = await getBatchById(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BATCH_NOT_FOUND',
          message: 'Batch not found or is no longer available',
        },
      });
    }

    // Allow published, pending approval, or closed/archived batches to be returned.
    // Frontend can show appropriate messaging for closed/archived batches.
    if (
      batch.status !== 'published' &&
      batch.status !== 'pending_venue_approval' &&
      batch.status !== 'closed' &&
      batch.status !== 'archived'
    ) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BATCH_NOT_AVAILABLE',
          message: 'This batch is no longer available',
        },
      });
    }

    res.json({
      success: true,
      data: batch,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * GET /api/batches/internal/:batchId
 * Fetch a single batch by ID for authenticated staff users, including drafts.
 */
router.get('/internal/:batchId', verifyToken, requireRole(['staff', 'lecturer', 'admin']), async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const batch = await getBatchById(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BATCH_NOT_FOUND',
          message: 'Batch not found',
        },
      });
    }

    return res.json({
      success: true,
      data: batch,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * GET /api/batches/:batchId/slots
 * Fetch all slots for a batch (public endpoint)
 */
router.get('/:batchId/slots', async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    // Verify batch exists and is available for public roster viewing.
    const batch = await getBatchById(batchId);
    if (!batch || (batch.status !== 'published' && batch.status !== 'closed' && batch.status !== 'archived')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BATCH_NOT_FOUND',
          message: 'Batch not found',
        },
      });
    }

    const slots = await getSlotsByBatchId(batchId);

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * GET /api/batches/:batchId/roster?token=...
 * Public lecturer roster link with tokenized access.
 */
router.get('/:batchId/roster', async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';

    if (!token) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'TOKEN_REQUIRED',
          message: 'A roster access token is required',
        },
      });
    }

    const batch = await getBatchById(batchId);

    // Allow roster access using the public token even when a batch has been closed
    if (!batch || (batch.status !== 'published' && batch.status !== 'closed') || !batch.public_view_token || batch.public_view_token !== token) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROSTER_NOT_FOUND',
          message: 'Roster not available',
        },
      });
    }

    const bookings = (await listBookingsByBatch(batchId)).filter((booking) => booking.status !== 'cancelled');
    const slots = await getSlotsByBatchId(batchId);

    return res.json({
      success: true,
      data: {
        batch: {
          id: batch.id,
          title: batch.title,
          status: batch.status,
          booking_count: batch.booking_count,
          total_slots: batch.total_slots,
        },
        slots,
        bookings,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * GET /api/batches/:batchId/bookings-public
 * Public endpoint to fetch bookings for a batch (for student roster view)
 * Only returns data for published batches
 */
router.get('/:batchId/bookings-public', async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    const batch = await getBatchById(batchId);

    if (!batch || batch.status !== 'published') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BATCH_NOT_FOUND',
          message: 'Batch not found or not available',
        },
      });
    }

    const bookings = await listBookingsByBatch(batchId);

    return res.json({
      success: true,
      data: bookings.filter((b) => b.status === 'confirmed'),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * POST /api/batches (authenticated, staff/lecturer only)
 * Create a new batch
 */
router.post('/', verifyToken, requireRole(['staff', 'lecturer', 'admin']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const userEmail = authReq.user?.email || 'staff@afda.co.za';

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User must be authenticated',
        },
      });
    }

    const {
      title,
      description,
      venueId,
      dateRangeStart,
      dateRangeEnd,
      slotDurationMinutes,
      perSlotCapacity,
      batchCapacity,
      dayStartTime,
      dayEndTime,
      lunchBreakStart,
      lunchBreakEnd,
      slots,
    } = req.body;

    if (!title || !dateRangeStart || !dateRangeEnd || !slotDurationMinutes) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'title, dateRangeStart, dateRangeEnd, and slotDurationMinutes are required',
        },
      });
    }

    try {
      await ensureStaffIdentity(userId, userEmail);
    } catch (profileErr) {
      logger.error(profileErr, 'Failed to bootstrap staff identity');
      return res.status(500).json({
        success: false,
        error: {
          code: 'USER_BOOTSTRAP_FAILED',
          message: 'Unable to prepare staff account for batch creation',
        },
      });
    }

    const batch = await createBatch(userId, {
      title,
      description,
      venue_id: venueId || null,
      date_range_start: dateRangeStart,
      date_range_end: dateRangeEnd,
      slot_duration_minutes: Number(slotDurationMinutes),
      per_slot_capacity: perSlotCapacity ? Number(perSlotCapacity) : 1,
      batch_capacity: batchCapacity !== undefined && batchCapacity !== null ? Number(batchCapacity) : null,
      lunch_break_start: typeof lunchBreakStart === 'string' && lunchBreakStart.trim() ? lunchBreakStart.trim() : undefined,
      lunch_break_end: typeof lunchBreakEnd === 'string' && lunchBreakEnd.trim() ? lunchBreakEnd.trim() : undefined,
      day_start_time: typeof dayStartTime === 'string' && dayStartTime.trim() ? dayStartTime.trim() : undefined,
      day_end_time: typeof dayEndTime === 'string' && dayEndTime.trim() ? dayEndTime.trim() : undefined,
      slots: Array.isArray(slots) ? slots : undefined,
    });

    return res.status(201).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * PUT /api/batches/:batchId (authenticated, staff/lecturer only)
 * Update an existing batch
 */
router.put('/:batchId', verifyToken, requireRole(['staff', 'lecturer', 'admin']), async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const {
      title,
      description,
      venueId,
      dateRangeStart,
      dateRangeEnd,
      slotDurationMinutes,
      perSlotCapacity,
      batchCapacity,
      lunchBreakStart,
      lunchBreakEnd,
      dayStartTime,
      dayEndTime,
    } = req.body;

    const batch = await updateBatch(batchId, {
      title,
      description,
      venue_id: venueId,
      date_range_start: dateRangeStart,
      date_range_end: dateRangeEnd,
      slot_duration_minutes: slotDurationMinutes !== undefined ? Number(slotDurationMinutes) : undefined,
      per_slot_capacity: perSlotCapacity !== undefined ? Number(perSlotCapacity) : undefined,
      batch_capacity: batchCapacity !== undefined && batchCapacity !== null ? Number(batchCapacity) : undefined,
      lunch_break_start: typeof lunchBreakStart === 'string' && lunchBreakStart.trim() ? lunchBreakStart.trim() : undefined,
      lunch_break_end: typeof lunchBreakEnd === 'string' && lunchBreakEnd.trim() ? lunchBreakEnd.trim() : undefined,
      day_start_time: typeof dayStartTime === 'string' && dayStartTime.trim() ? dayStartTime.trim() : undefined,
      day_end_time: typeof dayEndTime === 'string' && dayEndTime.trim() ? dayEndTime.trim() : undefined,
    });

    return res.json({
      success: true,
      data: batch,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * POST /api/batches/:batchId/publish (authenticated, staff/lecturer only)
 * Publish a batch
 */
router.post('/:batchId/publish', verifyToken, requireRole(['staff', 'lecturer', 'admin']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const { batchId } = req.params;

    const batch = await publishBatch(batchId, userId);

    return res.json({
      success: true,
      data: batch,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * POST /api/batches/:batchId/close
 * Close (archive) a published batch so no new bookings can be made.
 */
router.post('/:batchId/close', verifyToken, requireRole(['staff', 'lecturer', 'admin']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { batchId } = req.params;

    const batch = await closeBatch(batchId, userId);

    return res.json({ success: true, data: batch });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
});

export default router;