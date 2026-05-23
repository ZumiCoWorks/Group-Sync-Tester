import express, { Router, Request, Response } from 'express';
import {
  createBooking,
  listBookingsByBatch,
  cancelBooking,
  markBookingAttended,
  ApiError,
  logAuditEvent,
} from '../db';
import { verifyToken, requireRole, AuthRequest } from '../middleware';

const router = Router();

/**
 * POST /api/bookings
 * Create a booking for a slot (public endpoint - no auth required for students)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { slotId, studentName, studentEmail, studentIdExternal } = req.body;

    // Validation
    if (!slotId || !studentName || !studentEmail) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: slotId, studentName, studentEmail',
        },
      });
    }

    if (!studentEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email address',
        },
      });
    }

    const booking = await createBooking(slotId, studentName, studentEmail, studentIdExternal);

    res.status(201).json({
      success: true,
      data: booking,
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
 * GET /api/bookings?batchId=X (authenticated, staff/lecturer/ops only)
 * List all bookings for a batch
 */
router.get('/', verifyToken, requireRole(['staff', 'lecturer', 'admin', 'ops']), async (req: Request, res: Response) => {
  try {
    const batchId = typeof req.query.batchId === 'string' ? req.query.batchId : undefined;

    if (!batchId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'batchId query parameter is required',
        },
      });
    }

    const bookings = await listBookingsByBatch(batchId);

    return res.json({
      success: true,
      data: bookings,
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
 * DELETE /api/bookings/:bookingId (authenticated, staff/lecturer only)
 * Cancel a booking
 */
router.delete('/:bookingId', verifyToken, requireRole(['staff', 'lecturer', 'admin', 'ops']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { bookingId } = req.params;

    const booking = await cancelBooking(bookingId, userId);

    return res.json({
      success: true,
      data: booking,
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
 * PUT /api/bookings/:bookingId (authenticated, staff/lecturer only)
 * Update booking status (mark attended, reassign, etc.)
 */
router.put('/:bookingId', verifyToken, requireRole(['staff', 'lecturer', 'admin', 'ops']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { bookingId } = req.params;
    const { status } = req.body;

    if (status !== 'attended') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'status must be attended',
        },
      });
    }

    const booking = await markBookingAttended(bookingId, userId);

    return res.json({
      success: true,
      data: booking,
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
