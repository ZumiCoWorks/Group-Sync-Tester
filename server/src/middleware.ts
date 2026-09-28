import jwt from 'jsonwebtoken';
import { supabase } from './index';
import { Request, Response, NextFunction } from 'express';
import pino from 'pino';

const logger = pino();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role: string;
    [key: string]: any;
  };
}


export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Authorization header with Bearer token is required',
      },
    });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authorization token is missing',
      },
    });
  }

  try {
    // Securely verify token and get user using Supabase Admin Auth (supports ES256)
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Invalid token');
    }
    
    const userId = authData.user.id;
    const userEmail = authData.user.email;

    // Fetch role_v2 and access_expires_at from public.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_v2, access_expires_at')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User record not found in the database',
        },
      });
    }

    if (!userData.role_v2) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ROLE_NOT_MIGRATED',
          message: 'Your account role has not been migrated yet. Please contact support.',
        },
      });
    }

    if (userData.role_v2 === 'adhoc') {
      if (userData.access_expires_at && new Date(userData.access_expires_at) < new Date()) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'ACCESS_EXPIRED',
            message: 'Your adhoc access has expired.',
          },
        });
      }
    }
    
    req.user = {
      id: userId,
      email: userEmail,
      role: userData.role_v2
    };
    
    next();
  } catch (err: any) {
    logger.error(err, 'Token verification failed');
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authorization token is invalid or expired: ' + err.message,
      },
    });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        },
      });
    }

    next();
  };
};
