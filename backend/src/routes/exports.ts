import { Router, Request, Response } from 'express';
const PDFDocument = require('pdfkit');
import xlsx from 'xlsx';
import { verifyToken, requireRole, AuthRequest } from '../middleware';
import { ApiError, getBatchById, listBookingsByBatch } from '../db';

const router = Router();

type ExportFormat = 'pdf' | 'xlsx' | 'csv';

type ExportRow = {
  session_id: string;
  session_date: string;
  session_time: string;
  student_name: string;
  student_email: string;
  status: string;
  attended: string;
};

const toDisplayDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

const toDisplayTime = (value: string) =>
  new Date(value).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

const toRows = (bookings: Awaited<ReturnType<typeof listBookingsByBatch>>): ExportRow[] =>
  bookings.map((booking) => ({
    session_id: booking.slot_id,
    session_date: booking.slot?.start_time ? toDisplayDate(booking.slot.start_time) : '',
    session_time: booking.slot?.start_time ? toDisplayTime(booking.slot.start_time) : '',
    student_name: booking.student_name,
    student_email: booking.student_email,
    status: booking.status,
    attended: booking.status === 'attended' ? 'yes' : 'no',
  }));

const toCsv = (rows: ExportRow[]) => {
  const columns: (keyof ExportRow)[] = ['session_id', 'session_date', 'session_time', 'student_name', 'student_email', 'status', 'attended'];
  const escapeValue = (value: string) => {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => escapeValue(row[column] || '')).join(',')),
  ].join('\n');
};

const bufferFromXlsx = (rows: ExportRow[]) => {
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(rows);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Bookings');
  return xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
};

const writePdf = (response: Response, batchTitle: string, rows: ExportRow[]) => {
  const document = new PDFDocument({ margin: 40, size: 'A4' });
  response.setHeader('Content-Type', 'application/pdf');
  response.setHeader('Content-Disposition', `attachment; filename="${batchTitle.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-bookings.pdf"`);
  document.pipe(response);

  document.fontSize(20).text(batchTitle);
  document.moveDown(0.5);
  document.fontSize(11).fillColor('gray').text('Booking export');
  document.moveDown(1);
  document.fillColor('black');

  if (rows.length === 0) {
    document.fontSize(12).text('No bookings available for export.');
    document.end();
    return;
  }

  rows.forEach((row, index) => {
    if (index > 0) {
      document.addPage();
    }

    document.fontSize(16).text(`Booking ${index + 1}`, { underline: true });
    document.moveDown(0.5);
    document.fontSize(11);
    document.text(`Session ID: ${row.session_id}`);
    document.text(`Date: ${row.session_date}`);
    document.text(`Time: ${row.session_time}`);
    document.text(`Student: ${row.student_name}`);
    document.text(`Email: ${row.student_email}`);
    document.text(`Status: ${row.status}`);
    document.text(`Attended: ${row.attended}`);
  });

  document.end();
};

router.get('/', verifyToken, requireRole(['staff', 'lecturer', 'admin', 'ops']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const batchId = typeof req.query.batchId === 'string' ? req.query.batchId : '';
    const format = typeof req.query.format === 'string' ? req.query.format.toLowerCase() : '';

    if (!batchId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'batchId query parameter is required',
        },
      });
    }

    if (!['pdf', 'xlsx', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'format must be one of pdf, xlsx, or csv',
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

    const bookings = await listBookingsByBatch(batchId);
    const rows = toRows(bookings);
    const filenameBase = `${batch.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-bookings`;

    if (format === 'csv') {
      const csv = toCsv(rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
      res.status(200).send(csv);
    } else if (format === 'xlsx') {
      const buffer = bufferFromXlsx(rows);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.xlsx"`);
      res.status(200).send(buffer);
    } else {
      writePdf(res, batch.title, rows);
    }

    return;
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
