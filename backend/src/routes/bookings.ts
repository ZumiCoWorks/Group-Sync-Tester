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
import { supabase } from '../index';

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
 * POST /api/bookings/lookup
 * Look up a booking by student number (public endpoint - no auth required)
 */
router.post('/lookup', async (req: Request, res: Response) => {
  try {
    const { student_id_external } = req.body;

    if (!student_id_external) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide your student number to look up a booking',
        },
      });
    }

    // Prefer the most recent booking for this student number
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, batch_id, confirmation_number, student_name, student_email, student_id_external, status, booked_at, slot:slots(id, start_time, end_time)')
      .ilike('student_id_external', student_id_external.trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found',
        },
      });
    }

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
 * POST /api/bookings/cancel
 * Public student self-service cancellation by student number.
 */
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const { bookingId, student_id_external } = req.body;

    if (!bookingId || !student_id_external) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'bookingId and student number are required to cancel a booking',
        },
      });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, confirmation_number, student_email, student_id_external, status')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found',
        },
      });
    }

    const studentNumberMatches = (booking.student_id_external || '').toLowerCase() === student_id_external.trim().toLowerCase();

    if (!studentNumberMatches) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'The booking details did not match',
        },
      });
    }

    const cancelled = await cancelBooking(bookingId);

    return res.json({
      success: true,
      data: cancelled,
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
