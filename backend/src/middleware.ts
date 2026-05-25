import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Define the custom request interface your sub-routers require
export interface AuthRequest extends Request {
  user?: any;
}

// Support alternative named interfaces if used by other files
export interface AuthenticatedRequest extends AuthRequest {}

// Initialize an isolated Supabase Client for direct JWT validation
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const authCryptoClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

/**
 * Token Verification Middleware
 */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'No authorization token provided',
        },
      });
    }

    const token = authHeader.split(' ')[1];

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_CONFIG_ERROR',
          message: 'Backend environment variables are missing at runtime.',
        },
      });
    }

    // Verify token directly with Supabase Engine
    const { data: { user }, error } = await authCryptoClient.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Authorization token is invalid or expired',
        },
      });
    }

    // Bind structural user values onto request lifecycle
    req.user = user;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during token authentication verification',
      },
    });
  }
}

// Named alias to satisfy router imports matching the original layout
export const verifyToken = requireAuth;

/**
 * Role Authorization Middleware
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Basic fallback check if user payload isn't bound yet
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to check permissions',
        },
      });
    }

    // Parse role metadata out of Supabase App Metadata claims fields
    const userRole = req.user.app_metadata?.role || req.user.user_metadata?.role || 'student';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to execute this administrative action',
        },
      });
    }

    return next();
  };
}