import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../index';
import pino from 'pino';

const router = Router();
const logger = pino();
const allowedStaffRoles = new Set(['tutor_junior', 'tutor_senior', 'lecturer', 'adhoc', 'ops_venue_admin', 'admin']);

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

    let authData;
    let authError;
    try {
      const result = await supabase.auth.getUser(token);
      authData = result.data;
      authError = result.error;
    } catch (err) {
      logger.error(err, 'Token verification failed');
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token invalid or expired' } });
    }

    if (authError || !authData?.user) {
      logger.error(authError, 'Token verification failed');
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token invalid or expired' } });
    }

    const email = authData.user.email || null;
    // We need to fetch the role from the public.users table as done in middleware
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_v2')
      .eq('id', authData.user.id)
      .single();

    const role = userData?.role_v2 || null;

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
          first_name: authData?.user?.user_metadata?.given_name || 'Staff',
          last_name: authData?.user?.user_metadata?.family_name || 'Member',
          role,
        });
        if (insert.error) logger.error(insert.error, 'Failed to insert user');
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email,
          role,
        },
      },
    });
  } catch (err) {
    logger.error(err, 'Auth verify error');
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
});

export default router;
