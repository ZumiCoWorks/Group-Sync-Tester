import { Router, Request, Response } from 'express';
import { verifyToken, requireRole, AuthRequest } from '../middleware';
import { createBatch, getBatchById, getSlotsByBatchId, listBatches, publishBatch, updateBatch, ApiError } from '../db';

const router = Router();

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

    // Check if batch is published or still in draft
    if (batch.status !== 'published' && batch.status !== 'pending_venue_approval') {
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
 * GET /api/batches/:batchId/slots
 * Fetch all slots for a batch (public endpoint)
 */
router.get('/:batchId/slots', async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    // Verify batch exists and is published
    const batch = await getBatchById(batchId);
    if (!batch || batch.status !== 'published') {
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
 * POST /api/batches (authenticated, staff/lecturer only)
 * Create a new batch
 */
router.post('/', verifyToken, requireRole(['staff', 'lecturer', 'admin']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

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

    const batch = await createBatch(userId, {
      title,
      description,
      venue_id: venueId || null,
      date_range_start: dateRangeStart,
      date_range_end: dateRangeEnd,
      slot_duration_minutes: Number(slotDurationMinutes),
      per_slot_capacity: perSlotCapacity ? Number(perSlotCapacity) : 1,
      batch_capacity: batchCapacity !== undefined && batchCapacity !== null ? Number(batchCapacity) : null,
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

export default router;
