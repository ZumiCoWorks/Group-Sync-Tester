import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

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
    
    // In b8433fd, this was exactly how it was verified. 
    // If this fails, the token is genuinely invalid or signed with a different secret.
    const decoded = jwt.verify(token, secret) as any;
    
    req.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      // Map 'authenticated' to 'staff' to satisfy role requirements for prototyping
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
