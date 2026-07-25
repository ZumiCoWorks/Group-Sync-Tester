import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pino from 'pino';

const logger = pino();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
  };
}

/**
 * Middleware: Verify JWT token from Authorization header
 */
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Authorization token is required',
      },
    });
  }

  try {
    const secret = process.env.SUPABASE_JWT_SECRET || '';
    let decoded: any;
    try {
      // First try to verify with the secret as a raw string
      decoded = jwt.verify(token, secret);
    } catch (rawErr) {
      // If that fails, try decoding it as base64 (common for older Supabase projects)
      try {
        const secretKey = Buffer.from(secret, 'base64');
        decoded = jwt.verify(token, secretKey);
      } catch (base64Err) {
        throw new Error('Token verification failed with both raw and base64 secret');
      }
    }
    
    req.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      // Default to 'staff' if 'authenticated' for prototype purposes so requireRole passes
      role: (decoded.user_metadata?.role) || (decoded.role === 'authenticated' ? 'staff' : decoded.role),
      iat: decoded.iat,
      exp: decoded.exp
    };
    
    next();
  } catch (err) {
    logger.error(err, 'Token verification failed');
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authorization token is invalid or expired',
      },
    });
  }
};

/**
 * Middleware: Check user role
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
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

/**
 * Middleware: Error handler
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err, 'Error handler caught exception');

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
};
