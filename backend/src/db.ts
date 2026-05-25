/**
 * Database utilities for Supabase
 */
import { supabase } from './index';
import pino from 'pino';
import { randomUUID } from 'crypto';

const logger = pino();

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}

export interface BatchSlotInput {
  start_time: string;
  end_time: string;
  capacity?: number;
}

export interface CreateBatchInput {
  title: string;
  description?: string;
  venue_id?: string | null;
  date_range_start: string;
  date_range_end: string;
  slot_duration_minutes: number;
  per_slot_capacity?: number;
  batch_capacity?: number | null;
  lunch_break_start?: string;
  lunch_break_end?: string;
  slots?: BatchSlotInput[];
}

export interface BookingRecord {
  id: string;
  slot_id: string;
  batch_id: string;
  student_name: string;
  student_email: string;
  student_id_external?: string | null;
  status: 'confirmed' | 'waitlisted' | 'cancelled' | 'attended';
  confirmation_number: string;
  booked_at: string;
  created_at: string;
  updated_at: string;
  marked_attended_at?: string | null;
  slot?: {
    id: string;
    start_time: string;
    end_time: string;
    capacity: number;
    booking_count: number;
  } | null;
}

export interface ImportJobRecord {
  id: string;
  batch_id: string;
  created_by_user_id: string;
  total_rows: number;
  success_count: number;
  error_count: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  errors: Array<{ rowNumber: number; first_name?: string; last_name?: string; email?: string; error: string }>;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

/**
 * Fetch batch by ID
 */
export async function getBatchById(batchId: string) {
  const { data, error } = await supabase
    .from('batches')
    .select(
      `
      *,
      created_by_user:users(id, email, first_name, last_name, role),
      venue:venues(*),
      slots:slots(*)
    `
    )
    .eq('id', batchId)
    .single();

  if (error) {
    logger.error(error, 'Error fetching batch');
    throw new ApiError(500, 'DB_ERROR', 'Failed to fetch batch');
  }

  return data;
}

/**
 * Fetch slots by batch ID
 */
export async function getSlotsByBatchId(batchId: string) {
  const { data, error } = await supabase
    .from('slots')
    .select('*')
    .eq('batch_id', batchId)
    .order('start_time', { ascending: true });

  if (error) {
    logger.error(error, 'Error fetching slots');
    throw new ApiError(500, 'DB_ERROR', 'Failed to fetch slots');
  }

  return data;
}

/**
 * Fetch bookings by batch ID.
 */
export async function listBookingsByBatch(batchId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      slot:slots(id, start_time, end_time, capacity, booking_count)
    `
    )
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error(error, 'Error listing bookings');
    throw new ApiError(500, 'DB_ERROR', 'Failed to list bookings');
  }

  return (data || []) as BookingRecord[];
}

/**
 * Create an import job record.
 */
export async function createImportJob(input: {
  batch_id: string;
  created_by_user_id: string;
  total_rows: number;
  status: ImportJobRecord['status'];
  success_count?: number;
  error_count?: number;
  errors?: ImportJobRecord['errors'];
  started_at?: string | null;
  completed_at?: string | null;
}) {
  const { data, error } = await supabase
    .from('import_jobs')
    .insert({
      batch_id: input.batch_id,
      created_by_user_id: input.created_by_user_id,
      total_rows: input.total_rows,
      success_count: input.success_count ?? 0,
      error_count: input.error_count ?? 0,
      status: input.status,
      errors: input.errors ?? [],
      started_at: input.started_at ?? null,
      completed_at: input.completed_at ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    logger.error(error, 'Error creating import job');
    throw new ApiError(500, 'DB_ERROR', 'Failed to create import job');
  }

  return data as ImportJobRecord;
}

/**
 * Update an import job record.
 */
export async function updateImportJob(
  jobId: string,
  input: Partial<Pick<ImportJobRecord, 'success_count' | 'error_count' | 'status' | 'errors' | 'completed_at'>>
) {
  const { data, error } = await supabase
    .from('import_jobs')
    .update(input)
    .eq('id', jobId)
    .select()
    .single();

  if (error || !data) {
    logger.error(error, 'Error updating import job');
    throw new ApiError(500, 'DB_ERROR', 'Failed to update import job');
  }

  return data as ImportJobRecord;
}

/**
 * List batches for the staff dashboard.
 */
export async function listBatches(status?: string) {
  let query = supabase
    .from('batches')
    .select(
      `
      id,
      title,
      description,
      status,
      booking_count,
      total_slots,
      slot_duration_minutes,
      per_slot_capacity,
      published_at,
      created_at,
      updated_at,
      venue:venues(id, name, capacity),
      created_by_user:users(id, email, first_name, last_name, role)
    `
    )
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    logger.error(error, 'Error listing batches');
    throw new ApiError(500, 'DB_ERROR', 'Failed to list batches');
  }

  return data || [];
}

const DEFAULT_DAY_START = '09:00';
const DEFAULT_DAY_END = '17:00';
const DEFAULT_LUNCH_START = '13:00';
const DEFAULT_LUNCH_END = '14:00';

function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return NaN;
  }
  return hours * 60 + minutes;
}

function setTimeOnDate(sourceDate: Date, time: string) {
  const [hours, minutes] = time.split(':').map((part) => Number(part));
  const nextDate = new Date(sourceDate);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate;
}

function generateSlotsWithLunchBreak(
  batchId: string,
  dateRangeStart: string,
  dateRangeEnd: string,
  slotDurationMinutes: number,
  capacity: number,
  lunchStart = DEFAULT_LUNCH_START,
  lunchEnd = DEFAULT_LUNCH_END
) {
  const slotsToInsert: Array<{
    batch_id: string;
    start_time: string;
    end_time: string;
    capacity: number;
    booking_count: number;
  }> = [];

  const startDate = new Date(dateRangeStart);
  const endDate = new Date(dateRangeEnd);
  const lunchStartMinutes = parseTimeToMinutes(lunchStart);
  const lunchEndMinutes = parseTimeToMinutes(lunchEnd);
  const normalizedLunchEnd = Number.isFinite(lunchEndMinutes) ? lunchEnd : DEFAULT_LUNCH_END;
  const normalizedLunchStartMinutes = Number.isFinite(lunchStartMinutes) ? lunchStartMinutes : parseTimeToMinutes(DEFAULT_LUNCH_START);
  const normalizedLunchEndMinutes = Number.isFinite(lunchEndMinutes) ? lunchEndMinutes : parseTimeToMinutes(DEFAULT_LUNCH_END);

  for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
    let cursor = setTimeOnDate(currentDate, DEFAULT_DAY_START);
    const dayEnd = setTimeOnDate(currentDate, DEFAULT_DAY_END);

    while (cursor < dayEnd) {
      const cursorMinutes = cursor.getHours() * 60 + cursor.getMinutes();

      if (cursorMinutes >= normalizedLunchStartMinutes && cursorMinutes < normalizedLunchEndMinutes) {
        cursor = setTimeOnDate(cursor, normalizedLunchEnd);
        continue;
      }

      const slotEnd = new Date(cursor);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDurationMinutes);
      const slotEndMinutes = slotEnd.getHours() * 60 + slotEnd.getMinutes();

      if (cursorMinutes < normalizedLunchStartMinutes && slotEndMinutes > normalizedLunchStartMinutes) {
        cursor = setTimeOnDate(cursor, normalizedLunchEnd);
        continue;
      }

      if (slotEnd > dayEnd) {
        break;
      }

      slotsToInsert.push({
        batch_id: batchId,
        start_time: cursor.toISOString(),
        end_time: slotEnd.toISOString(),
        capacity,
        booking_count: 0,
      });

      cursor = slotEnd;
    }
  }

  return slotsToInsert;
}

/**
 * Create a batch and optionally seed slots in the same call.
 */
export async function createBatch(createdByUserId: string, input: CreateBatchInput) {
  const slotCapacity = input.per_slot_capacity ?? 1;
  const publicViewToken = randomUUID().replace(/-/g, '');
  const { data: batch, error: batchError } = await supabase
    .from('batches')
    .insert({
      title: input.title,
      description: input.description || null,
      created_by_user_id: createdByUserId,
      status: 'draft',
      venue_id: input.venue_id ?? null,
      date_range_start: input.date_range_start,
      date_range_end: input.date_range_end,
      slot_duration_minutes: input.slot_duration_minutes,
      per_slot_capacity: slotCapacity,
      batch_capacity: input.batch_capacity ?? null,
      public_view_token: publicViewToken,
      booking_count: 0,
      total_slots: 0,
    })
    .select()
    .single();

  if (batchError || !batch) {
    logger.error(batchError, 'Error creating batch');
    throw new ApiError(500, 'DB_ERROR', 'Failed to create batch');
  }

  const slotsToInsert = input.slots && input.slots.length > 0
    ? input.slots.map((slot) => ({
        batch_id: batch.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        capacity: slotCapacity,
        booking_count: 0,
      }))
    : generateSlotsWithLunchBreak(
        batch.id,
        input.date_range_start,
        input.date_range_end,
        input.slot_duration_minutes,
        slotCapacity,
        input.lunch_break_start,
        input.lunch_break_end
      );

  if (slotsToInsert.length > 0) {
    const { error: slotsError } = await supabase.from('slots').insert(slotsToInsert);

    if (slotsError) {
      logger.error(slotsError, 'Error creating batch slots');
      throw new ApiError(500, 'DB_ERROR', 'Failed to create batch slots');
    }

    const { error: updateBatchError } = await supabase
      .from('batches')
      .update({ total_slots: slotsToInsert.length })
      .eq('id', batch.id);

    if (updateBatchError) {
      logger.error(updateBatchError, 'Error updating batch slot count');
    }
  }

  await logAuditEvent('batch_created', 'batch', batch.id, {
    title: input.title,
    venue_id: input.venue_id || null,
  }, createdByUserId);

  return batch;
}

/**
 * Update an existing batch.
 */
export async function updateBatch(batchId: string, input: Partial<CreateBatchInput>) {
  const updatePayload: Record<string, any> = {};

  if (input.title !== undefined) updatePayload.title = input.title;
  if (input.description !== undefined) updatePayload.description = input.description;
  if (input.venue_id !== undefined) updatePayload.venue_id = input.venue_id;
  if (input.date_range_start !== undefined) updatePayload.date_range_start = input.date_range_start;
  if (input.date_range_end !== undefined) updatePayload.date_range_end = input.date_range_end;
  if (input.slot_duration_minutes !== undefined) updatePayload.slot_duration_minutes = input.slot_duration_minutes;
  if (input.per_slot_capacity !== undefined) updatePayload.per_slot_capacity = input.per_slot_capacity;
  if (input.batch_capacity !== undefined) updatePayload.batch_capacity = input.batch_capacity;

  const { data: existingBatch, error: fetchError } = await supabase
    .from('batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (fetchError || !existingBatch) {
    throw new ApiError(404, 'BATCH_NOT_FOUND', 'Batch not found');
  }

  const { data: batch, error } = await supabase
    .from('batches')
    .update(updatePayload)
    .eq('id', batchId)
    .select()
    .single();

  if (error || !batch) {
    logger.error(error, 'Error updating batch');
    throw new ApiError(500, 'DB_ERROR', 'Failed to update batch');
  }

  await logAuditEvent('batch_edited', 'batch', batchId, {
    before: existingBatch,
    after: batch,
  });

  return batch;
}

/**
 * Publish a batch.
 */
export async function publishBatch(batchId: string, userId?: string) {
  const { data: batch, error: fetchError } = await supabase
    .from('batches')
    .select('id, status')
    .eq('id', batchId)
    .single();

  if (fetchError || !batch) {
    throw new ApiError(404, 'BATCH_NOT_FOUND', 'Batch not found');
  }

  if (batch.status === 'published') {
    return batch;
  }

  const { data: updatedBatch, error: updateError } = await supabase
    .from('batches')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', batchId)
    .select()
    .single();

  if (updateError || !updatedBatch) {
    logger.error(updateError, 'Error publishing batch');
    throw new ApiError(500, 'DB_ERROR', 'Failed to publish batch');
  }

  await logAuditEvent('batch_published', 'batch', batchId, {
    previous_status: batch.status,
    new_status: 'published',
  }, userId);

  return updatedBatch;
}

/**
 * Close (archive) a published batch so no new bookings can be created.
 */
export async function closeBatch(batchId: string, userId?: string) {
  const { data: batch, error: fetchError } = await supabase
    .from('batches')
    .select('id, status')
    .eq('id', batchId)
    .single();

  if (fetchError || !batch) {
    throw new ApiError(404, 'BATCH_NOT_FOUND', 'Batch not found');
  }

  if (batch.status === 'closed' || batch.status === 'archived') {
    return batch;
  }

  const { data: updatedBatch, error: updateError } = await supabase
    .from('batches')
    .update({ status: 'closed' })
    .eq('id', batchId)
    .select()
    .single();

  if (updateError || !updatedBatch) {
    logger.error(updateError, 'Error closing batch');
    throw new ApiError(500, 'DB_ERROR', 'Failed to close batch');
  }

  await logAuditEvent('batch_closed', 'batch', batchId, { previous_status: batch.status, new_status: 'closed' }, userId);

  return updatedBatch;
}

/**
 * Mark a booking as cancelled and decrement aggregate counters when needed.
 */
export async function cancelBooking(bookingId: string, userId?: string) {
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, batch_id, slot_id, status')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  }

  if (booking.status === 'cancelled') {
    return booking;
  }

  if (booking.status === 'attended') {
    throw new ApiError(409, 'BOOKING_ALREADY_ATTENDED', 'Attended bookings cannot be cancelled');
  }

  const { data: slot, error: slotFetchError } = await supabase
    .from('slots')
    .select('booking_count')
    .eq('id', booking.slot_id)
    .single();

  if (slotFetchError || !slot) {
    throw new ApiError(500, 'DB_ERROR', 'Failed to load booking slot');
  }

  const { data: batch, error: batchFetchError } = await supabase
    .from('batches')
    .select('booking_count')
    .eq('id', booking.batch_id)
    .single();

  if (batchFetchError || !batch) {
    throw new ApiError(500, 'DB_ERROR', 'Failed to load booking batch');
  }

  const { data: updatedBooking, error: bookingUpdateError } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      marked_attended_at: null,
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (bookingUpdateError || !updatedBooking) {
    logger.error(bookingUpdateError, 'Error cancelling booking');
    throw new ApiError(500, 'DB_ERROR', 'Failed to cancel booking');
  }

  const { error: slotUpdateError } = await supabase
    .from('slots')
    .update({ booking_count: Math.max(0, (slot.booking_count || 0) - 1) })
    .eq('id', booking.slot_id);

  if (slotUpdateError) {
    logger.error(slotUpdateError, 'Error decrementing slot booking count');
  }

  const { error: batchUpdateError } = await supabase
    .from('batches')
    .update({ booking_count: Math.max(0, (batch.booking_count || 0) - 1) })
    .eq('id', booking.batch_id);

  if (batchUpdateError) {
    logger.error(batchUpdateError, 'Error decrementing batch booking count');
  }

  await logAuditEvent(
    'booking_cancelled',
    'booking',
    bookingId,
    {
      previous_status: booking.status,
      new_status: 'cancelled',
    },
    userId
  );

  return updatedBooking;
}

/**
 * Mark a booking as attended.
 */
export async function markBookingAttended(bookingId: string, userId?: string) {
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status, marked_attended_at')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  }

  if (booking.status === 'cancelled') {
    throw new ApiError(409, 'BOOKING_CANCELLED', 'Cancelled bookings cannot be marked attended');
  }

  if (booking.status === 'attended') {
    return booking;
  }

  const { data: updatedBooking, error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'attended',
      marked_attended_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (updateError || !updatedBooking) {
    logger.error(updateError, 'Error marking booking attended');
    throw new ApiError(500, 'DB_ERROR', 'Failed to update booking status');
  }

  await logAuditEvent(
    'booking_attended',
    'booking',
    bookingId,
    {
      previous_status: booking.status,
      new_status: 'attended',
    },
    userId
  );

  return updatedBooking;
}

/**
 * Create booking (atomic: check capacity and reserve in one transaction)
 */
export async function createBooking(
  slotId: string,
  studentName: string,
  studentEmail: string,
  studentIdExternal?: string
) {
  try {
    // Fetch current slot to check capacity
    const { data: slotData, error: slotError } = await supabase
      .from('slots')
      .select('*, batch:batches(batch_capacity, booking_count, status)')
      .eq('id', slotId)
      .single();

    if (slotError || !slotData) {
      throw new ApiError(404, 'SLOT_NOT_FOUND', 'Slot not found');
    }

    // Enforce slot capacity (respect slot.capacity for legacy or configured batches)
    const slotCapacity = (slotData.capacity as number) ?? 1;
    if ((slotData.booking_count || 0) >= slotCapacity) {
      throw new ApiError(409, 'SLOT_FULL', 'This slot is at capacity');
    }

    // Prevent the same student from booking multiple slots in the same batch
    const { data: existingBookings, error: existingBookingsError } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('batch_id', slotData.batch_id)
      .ilike('student_email', studentEmail.toLowerCase())
      .neq('status', 'cancelled');

    if (existingBookingsError) {
      logger.error(existingBookingsError, 'Error checking existing bookings for student');
    }

    if (existingBookings && existingBookings.length > 0) {
      throw new ApiError(409, 'STUDENT_ALREADY_BOOKED', 'Student already has a booking for this batch');
    }

    // Check batch status (only allow bookings when published)
    if (!slotData.batch || slotData.batch.status !== 'published') {
      throw new ApiError(403, 'BATCH_NOT_OPEN', 'Bookings for this batch are closed');
    }

    // Check batch capacity
    if (slotData.batch.batch_capacity && slotData.batch.booking_count >= slotData.batch.batch_capacity) {
      throw new ApiError(409, 'BATCH_FULL', 'This batch is at capacity');
    }

    // Create booking
    const confirmationNumber = generateConfirmationNumber();
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        slot_id: slotId,
        batch_id: slotData.batch_id,
        student_name: studentName,
        student_email: studentEmail,
        student_id_external: studentIdExternal,
        status: 'confirmed',
        confirmation_number: confirmationNumber,
        booked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (bookingError) {
      logger.error(bookingError, 'Error creating booking');
      throw new ApiError(500, 'DB_ERROR', 'Failed to create booking');
    }

    // Increment slot booking count
    const { error: updateSlotError } = await supabase
      .from('slots')
      .update({ booking_count: slotData.booking_count + 1 })
      .eq('id', slotId);

    if (updateSlotError) {
      logger.error(updateSlotError, 'Error updating slot count');
      // Rollback booking
      await supabase.from('bookings').delete().eq('id', booking.id);
      throw new ApiError(500, 'DB_ERROR', 'Failed to reserve slot');
    }

    // Increment batch booking count
    const { error: updateBatchError } = await supabase
      .from('batches')
      .update({ booking_count: slotData.batch.booking_count + 1 })
      .eq('id', slotData.batch_id);

    if (updateBatchError) {
      logger.error(updateBatchError, 'Error updating batch count');
    }

    // Log audit event
    await logAuditEvent('booking_confirmed', 'booking', booking.id, {
      slot_id: slotId,
      student_email: studentEmail,
    });

    return booking;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(error, 'Unexpected error in createBooking');
    throw new ApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }
}

/**
 * Log audit event
 */
export async function logAuditEvent(
  action: string,
  resourceType: string,
  resourceId: string,
  details: Record<string, any>,
  userId?: string
) {
  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId || null,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
    created_at: new Date().toISOString(),
  });

  if (error) {
    logger.error(error, 'Error logging audit event');
  }
}

/**
 * Fetch audit logs for a batch
 */
export interface AuditLogRecord {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any> | null;
  created_at: string;
}

export async function listAuditLogsByBatch(
  batchId: string,
  action?: string
): Promise<AuditLogRecord[]> {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .eq('resource_id', batchId)
    .order('created_at', { ascending: false });

  if (action) {
    query = query.eq('action', action);
  }

  const { data, error } = await query;

  if (error) {
    throw new ApiError(500, 'DB_ERROR', 'Failed to fetch audit logs', {
      originalError: error.message,
    });
  }

  return (data || []) as AuditLogRecord[];
}

/**
 * Generate unique confirmation number
 */
export function generateConfirmationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${timestamp}${random}`;
}
