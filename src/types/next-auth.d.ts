import type { DefaultSession } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & {
      role?: 'staff' | 'student';
    };
  }

  interface User {
    role?: 'staff' | 'student';
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role?: 'staff' | 'student';
    azureAccessToken?: string;
    azureRefreshToken?: string;
    azureAccessTokenExpiresAt?: number;
  }
}