import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../index';
import pino from 'pino';

const router = Router();
const logger = pino();
const allowedStaffRoles = new Set(['staff', 'lecturer', 'admin', 'ops']);

/**
 * GET /api/auth/verify
 * Verify JWT from Authorization header and return user profile
 */
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.status(401).json({ success: false, error: { code: 'MISSING_TOKEN', message: 'Authorization header required' } });
    }

    const token = auth.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token missing' } });
    }

    const secret = process.env.SUPABASE_JWT_SECRET || '';
    let payload: any;
    try {
      payload = jwt.verify(token, secret);
    } catch (err) {
      logger.error(err, 'Token verification failed');
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token invalid or expired' } });
    }

    const email = payload?.email || payload?.user_email || null;
    const role = typeof payload?.role === 'string' ? payload.role : typeof payload?.app_metadata?.role === 'string' ? payload.app_metadata.role : null;

    if (!role || !allowedStaffRoles.has(role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'This account does not have staff access' },
      });
    }

    // Upsert user into local users table if staff/ops/admin
    if (email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1)
        .maybeSingle();

      if (error) logger.error(error, 'Error checking users table');

      if (!data) {
        // Insert minimal user record
        const insert = await supabase.from('users').insert({
          email,
          first_name: payload?.given_name || 'Staff',
          last_name: payload?.family_name || 'Member',
          role,
        });
        if (insert.error) logger.error(insert.error, 'Failed to insert user');
      }
    }

    res.json({ success: true, data: { tokenPayload: payload } });
  } catch (err) {
    logger.error(err, 'Auth verify error');
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
});

export default router;
