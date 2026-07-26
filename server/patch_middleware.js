const fs = require('fs');
const file = 'src/middleware.ts';
let code = fs.readFileSync(file, 'utf8');

const newVerifyToken = `
import { supabase } from './index';

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
    const secret = process.env.SUPABASE_JWT_SECRET || '';
    
    // Strict signature verification against the rotated secret
    const decoded: any = jwt.verify(token, secret);
    
    const userId = decoded.sub || decoded.id;
    const userEmail = decoded.email;

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
      role: userData.role_v2,
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
`;

code = code.replace(/export const verifyToken = \(req: AuthRequest, res: Response, next: NextFunction\) => \{[\s\S]*?^};/m, newVerifyToken.trim());
code = code.replace(/import jwt from 'jsonwebtoken';/, `import jwt from 'jsonwebtoken';\nimport { supabase } from './index';`);

fs.writeFileSync(file, code);
