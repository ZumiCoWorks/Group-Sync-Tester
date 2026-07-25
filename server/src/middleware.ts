import jwt from 'jsonwebtoken';
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

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
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
    const secret = process.env.SUPABASE_JWT_SECRET || '';
    
    // DEBUG MODE: Return a specific error if secret is missing to prove to the user
    if (!secret) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_SECRET_ON_SERVER',
          message: 'The Vercel backend is missing SUPABASE_JWT_SECRET in its environment variables.',
        },
      });
    }

    const decoded = jwt.verify(token, secret) as any;
    
    req.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      role: (decoded.user_metadata?.role) || (decoded.role === 'authenticated' ? 'staff' : decoded.role),
      iat: decoded.iat,
      exp: decoded.exp
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
