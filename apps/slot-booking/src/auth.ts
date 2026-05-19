import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import AzureAD from 'next-auth/providers/azure-ad';
import { isAfdaEmail, normalizeEmail, resolveDisplayName } from '@/lib/afda-auth';
import { getMockUser } from '@/lib/mock-auth-provider';
import { saveAzureTokenRecord } from '@/lib/azure-token-store';

const useMockAuth = process.env.NODE_ENV !== 'production' || process.env.MOCK_AUTH_ENABLED === 'true';

function resolveEmailFromProfile(profile: Record<string, unknown> | undefined, userEmail: string | null | undefined) {
  const candidate = [
    userEmail,
    typeof profile?.email === 'string' ? profile.email : null,
    typeof profile?.mail === 'string' ? profile.mail : null,
    typeof profile?.preferred_username === 'string' ? profile.preferred_username : null,
    typeof profile?.upn === 'string' ? profile.upn : null,
  ].find((value): value is string => Boolean(value));

  return normalizeEmail(candidate);
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/auth/signin',
  },
  providers: useMockAuth
    ? [
        Credentials({
          name: 'Mock Auth (Development)',
          credentials: {
            email: { label: 'Email', type: 'email', placeholder: 'tlotlo@afda.co.za' },
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
    : [
        AzureAD({
          clientId: process.env.AZURE_AD_CLIENT_ID ?? '',
          clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? '',
          tenantId: process.env.AZURE_AD_TENANT_ID ?? 'common',
          authorization: {
            params: {
              scope: 'openid profile email offline_access Calendars.ReadWrite',
            },
          },
        }),
        // Email provider disabled for now — requires database adapter for token storage.
        // To enable later, set up Prisma with a database and add Email provider back.
      ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, profile, account }) {
      const email = resolveEmailFromProfile(profile as Record<string, unknown> | undefined, user.email);
      return email ? isAfdaEmail(email) : true;
    },
    async jwt({ token, user, profile, account }) {
      const email = resolveEmailFromProfile(profile as Record<string, unknown> | undefined, user?.email ?? token.email ?? null);
      if (email) {
        token.email = email;
      }

      token.name = resolveDisplayName(user?.name ?? token.name ?? null, token.email ?? null);

      const normalized = (token.email ?? '').toString().trim().toLowerCase();
      token.role = normalized.endsWith('@students.afda.co.za') ? 'student' : 'staff';

      if (account?.provider === 'azure-ad' && token.email) {
        const expiresAt = typeof account.expires_at === 'number'
          ? account.expires_at * 1000
          : Date.now() + (55 * 60 * 1000);

        // Coerce provider values to strings to satisfy stricter TS types from the provider
        token.azureAccessToken = String(account.access_token ?? token.azureAccessToken ?? '');
        token.azureRefreshToken = String(account.refresh_token ?? token.azureRefreshToken ?? '');

        token.azureAccessTokenExpiresAt = expiresAt;

        await saveAzureTokenRecord({
          email: token.email,
          accessToken: String(account.access_token ?? token.azureAccessToken ?? ''),
          refreshToken: String(account.refresh_token ?? token.azureRefreshToken ?? ''),
          expiresAt,
          tenantId: process.env.AZURE_AD_TENANT_ID ?? 'common',
        });
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
        // Cast to any to safely assign the runtime-extended `role` field
        (session.user as any).role = token.role ?? (session.user.email?.toString().endsWith('@students.afda.co.za') ? 'student' : 'staff');
      }

      return session;
    },
  },
};
