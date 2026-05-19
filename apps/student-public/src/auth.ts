import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getMockUser } from '@/lib/mock-auth-provider';
import { normalizeEmail } from '@/lib/afda-auth';

const useMockAuth = process.env.NODE_ENV !== 'production' || process.env.MOCK_AUTH_ENABLED === 'true';

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/auth/signin',
  },
  providers: useMockAuth
    ? [
        Credentials({
          name: 'Mock Auth (Development)',
          credentials: {
            email: { label: 'Email', type: 'email', placeholder: 'student@afda.co.za' },
          },
          async authorize(credentials) {
            if (!credentials?.email) {
              return null;
            }

            const mockUser = getMockUser(credentials.email);
            const email = normalizeEmail(credentials.email);
            if (!email) {
              return null;
            }

            return {
              id: email,
              email,
              name: mockUser?.name ?? email.split('@')[0],
            };
          },
        }),
      ]
    : [],
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};
