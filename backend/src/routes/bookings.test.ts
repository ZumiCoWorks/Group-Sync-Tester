import express from 'express';
import request from 'supertest';
import bookingsRouter from './bookings';
import { createBooking, ApiError } from '../db';

jest.mock('../db', () => ({
  createBooking: jest.fn(),
  getSlotsByBatchId: jest.fn(),
  logAuditEvent: jest.fn(),
  ApiError: class ApiError extends Error {
    statusCode: number;
    code: string;
    details?: Record<string, unknown>;

    constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown>) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
      this.details = details;
    }
  },
}));

describe('bookings route', () => {
  const app = express();

  beforeAll(() => {
    app.use(express.json());
    app.use('/api/bookings', bookingsRouter);
  });

  beforeEach(() => {
    jest.mocked(createBooking).mockReset();
  });

  it('returns validation error when required fields are missing', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .send({ studentName: 'Ada Lovelace', studentEmail: 'ada@example.edu' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: slotId, studentName, studentEmail',
      },
    });
  });

  it('returns validation error for invalid email', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .send({
        slotId: 'slot-1',
        studentName: 'Ada Lovelace',
        studentEmail: 'invalid-email',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toBe('Invalid email address');
  });

  it('creates a booking when the payload is valid', async () => {
    jest.mocked(createBooking).mockResolvedValue({
      id: 'booking-1',
      slot_id: 'slot-1',
      batch_id: 'batch-1',
      student_name: 'Ada Lovelace',
      student_email: 'ada@example.edu',
      confirmation_number: 'CONF123',
    } as any);

    const response = await request(app)
      .post('/api/bookings')
      .send({
        slotId: 'slot-1',
        studentName: 'Ada Lovelace',
        studentEmail: 'ada@example.edu',
        studentIdExternal: 'STU-001',
      });

    expect(createBooking).toHaveBeenCalledWith('slot-1', 'Ada Lovelace', 'ada@example.edu', 'STU-001');
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe('booking-1');
  });

  it('returns ApiError details from createBooking', async () => {
    jest.mocked(createBooking).mockRejectedValue(new ApiError(409, 'SLOT_FULL', 'This slot is at capacity'));

    const response = await request(app)
      .post('/api/bookings')
      .send({
        slotId: 'slot-1',
        studentName: 'Ada Lovelace',
        studentEmail: 'ada@example.edu',
      });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'SLOT_FULL',
        message: 'This slot is at capacity',
      },
    });
  });
});
