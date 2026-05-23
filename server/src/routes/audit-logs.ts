import express from 'express';
import { verifyToken, requireRole } from '../middleware';
import { listAuditLogsByBatch, ApiError } from '../db';

const router = express.Router();

/**
 * GET /api/audit-logs
 * Fetch audit logs for a batch with optional action filter
 * Query params:
 *   - batchId: Required. The batch ID to fetch logs for.
 *   - action: Optional. Filter by action type (e.g., 'booking_confirmed', 'batch_published')
 */
router.get('/', verifyToken, requireRole(['staff', 'lecturer', 'admin', 'ops']), async (req, res) => {
  try {
    const { batchId, action } = req.query;

    if (!batchId || typeof batchId !== 'string') {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Missing or invalid batchId query parameter',
      });
    }

    const actionFilter = action && typeof action === 'string' ? action : undefined;

    const logs = await listAuditLogsByBatch(batchId, actionFilter);

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        details: error.details,
      });
    }

    console.error('Unexpected error in audit logs route:', error);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * GET /api/audit-logs/export
 * Export audit logs as CSV for a batch
 */
router.get('/export', verifyToken, requireRole(['staff', 'lecturer', 'admin', 'ops']), async (req, res) => {
  try {
    const { batchId, action } = req.query;

    if (!batchId || typeof batchId !== 'string') {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Missing or invalid batchId query parameter',
      });
    }

    const actionFilter = action && typeof action === 'string' ? action : undefined;

    const logs = await listAuditLogsByBatch(batchId, actionFilter);

    // Convert logs to CSV format
    const headers = ['Timestamp', 'Action', 'Resource Type', 'Resource ID', 'User ID', 'Details'];
    const csvRows = logs.map((log) => [
      log.created_at,
      log.action,
      log.resource_type,
      log.resource_id,
      log.user_id || '',
      log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '',
    ]);

    const csvContent = [
      headers.map((h) => `"${h}"`).join(','),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        details: error.details,
      });
    }

    console.error('Unexpected error in audit logs export route:', error);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

export default router;
