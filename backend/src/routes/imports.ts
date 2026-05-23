import { Router, Request, Response } from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { verifyToken, requireRole, AuthRequest } from '../middleware';
import {
  ApiError,
  createBooking,
  createImportJob,
  getBatchById,
  listBookingsByBatch,
  logAuditEvent,
  updateImportJob,
} from '../db';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

type ImportErrorRow = {
  rowNumber: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  error: string;
};

type ImportResult = {
  jobId: string;
  batchId: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  status: 'completed' | 'failed';
  errors: ImportErrorRow[];
  errorReportCsv: string;
};

type SlotAvailability = {
  id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  occupied: number;
};

type BatchSlotRecord = {
  id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booking_count: number | null;
};

const requiredHeaders = ['first_name', 'last_name', 'email'] as const;

const normalizeHeader = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, '_');

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const escapeCsvValue = (value: string | number | boolean | null | undefined) => {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

const toCsv = (rows: (string | number | boolean | null | undefined)[][]) =>
  rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(',')).join('\n');

const buildErrorCsv = (errors: ImportErrorRow[]) =>
  toCsv([
    ['row_number', 'first_name', 'last_name', 'email', 'error'],
    ...errors.map((error) => [error.rowNumber, error.first_name || '', error.last_name || '', error.email || '', error.error]),
  ]);

router.post('/', verifyToken, requireRole(['staff', 'lecturer', 'admin']), (req: Request, res: Response) => {
  upload.single('file')(req, res, async (uploadError) => {
    let importJobId: string | null = null;
    let successCount = 0;
    let errors: ImportErrorRow[] = [];

    try {
      if (uploadError) {
        const message = uploadError instanceof Error ? uploadError.message : 'Unable to read uploaded file.';
        return res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message,
          },
        });
      }

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

      const batchId = typeof req.body?.batchId === 'string' ? req.body.batchId : '';
      const file = (req as Request & { file?: Express.Multer.File }).file;

      if (!batchId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'batchId is required',
          },
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'An .xlsx file is required',
          },
        });
      }

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

      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = sheetName ? workbook.Sheets[sheetName] : undefined;

      if (!worksheet) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE',
            message: 'The workbook does not contain any sheets',
          },
        });
      }

      const rawRows = xlsx.utils.sheet_to_json<Array<string | number | boolean | null>>(worksheet, {
        header: 1,
        defval: '',
      }) as Array<Array<string | number | boolean | null>>;

      if (rawRows.length < 2) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'The XLSX file must contain a header row and at least one participant row',
          },
        });
      }

      const headerIndex = new Map<string, number>();
      rawRows[0].forEach((header, index) => {
        headerIndex.set(normalizeHeader(header), index);
      });

      const missingHeaders = requiredHeaders.filter((header) => headerIndex.get(header) === undefined);
      if (missingHeaders.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Missing required columns: ${missingHeaders.join(', ')}`,
          },
        });
      }

      const existingBookings = await listBookingsByBatch(batchId);
      const existingEmails = new Set(
        existingBookings
          .filter((booking) => booking.status !== 'cancelled')
          .map((booking) => booking.student_email.trim().toLowerCase())
      );

      const slotPool: SlotAvailability[] = ((batch.slots || []) as BatchSlotRecord[])
        .slice()
        .sort((left: BatchSlotRecord, right: BatchSlotRecord) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime())
        .map((slot: BatchSlotRecord) => ({
          id: slot.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          capacity: slot.capacity || 1,
          occupied: slot.booking_count || 0,
        }));

      if (slotPool.length === 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'NO_SLOTS',
            message: 'This batch has no slots available for import',
          },
        });
      }

      const importJob = await createImportJob({
        batch_id: batchId,
        created_by_user_id: userId,
        total_rows: rawRows.length - 1,
        status: 'in_progress',
        success_count: 0,
        error_count: 0,
        errors: [],
        started_at: new Date().toISOString(),
      });

      importJobId = importJob.id;
      const seenEmails = new Set<string>();

      for (let rowIndex = 1; rowIndex < rawRows.length; rowIndex += 1) {
        const rowNumber = rowIndex + 1;
        const row = rawRows[rowIndex];

        if (row.every((cell) => String(cell ?? '').trim() === '')) {
          continue;
        }

        const firstName = String(row[headerIndex.get('first_name') as number] ?? '').trim();
        const lastName = String(row[headerIndex.get('last_name') as number] ?? '').trim();
        const email = String(row[headerIndex.get('email') as number] ?? '').trim().toLowerCase();

        const rowErrors: string[] = [];

        if (!firstName) rowErrors.push('first_name is required');
        if (!lastName) rowErrors.push('last_name is required');
        if (!email) rowErrors.push('email is required');
        if (email && !validateEmail(email)) rowErrors.push('email is invalid');
        if (email && seenEmails.has(email)) rowErrors.push('email appears more than once in the file');
        if (email && existingEmails.has(email)) rowErrors.push('email already has a booking in this batch');

        const nextSlot = slotPool.find((slot) => slot.occupied < slot.capacity);
        if (!nextSlot) {
          rowErrors.push('no available slots remain in this batch');
        }

        if (email) {
          seenEmails.add(email);
        }

        if (rowErrors.length > 0 || !nextSlot) {
          errors.push({
            rowNumber,
            first_name: firstName,
            last_name: lastName,
            email,
            error: rowErrors.join('; '),
          });
          continue;
        }

        try {
          await createBooking(nextSlot.id, `${firstName} ${lastName}`.trim(), email);
          nextSlot.occupied += 1;
          existingEmails.add(email);
          successCount += 1;
        } catch (bookingError) {
          const message = bookingError instanceof ApiError ? bookingError.message : 'Failed to create booking';
          errors.push({
            rowNumber,
            first_name: firstName,
            last_name: lastName,
            email,
            error: message,
          });
        }
      }

      const finalStatus = successCount > 0 ? 'completed' : 'failed';
      const completedAt = new Date().toISOString();
      const updatedJob = await updateImportJob(importJobId, {
        success_count: successCount,
        error_count: errors.length,
        status: finalStatus,
        errors,
        completed_at: completedAt,
      });

      await logAuditEvent(
        'batch_import_completed',
        'import',
        updatedJob.id,
        {
          batch_id: batchId,
          total_rows: rawRows.length - 1,
          success_count: successCount,
          error_count: errors.length,
        },
        userId
      );

      const responseData: ImportResult = {
        jobId: updatedJob.id,
        batchId,
        totalRows: rawRows.length - 1,
        successCount,
        errorCount: errors.length,
        status: finalStatus,
        errors,
        errorReportCsv: buildErrorCsv(errors),
      };

      return res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      if (importJobId) {
        try {
          await updateImportJob(importJobId, {
            success_count: successCount,
            error_count: errors.length,
            status: 'failed',
            errors,
            completed_at: new Date().toISOString(),
          });
        } catch (updateError) {
          // Ignore follow-up failures during error cleanup.
        }
      }

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
});

export default router;