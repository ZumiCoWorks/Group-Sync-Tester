/**
 * Mock auth provider for local development without Azure AD.
 * Set MOCK_AUTH_ENABLED=true in .env.local to use this.
 */

export interface MockUser {
  email: string;
  name: string;
}

const MOCK_USERS: Record<string, MockUser> = {
  'lecturer@afda.co.za': {
    email: 'lecturer@afda.co.za',
    name: 'Lecturer Demo',
  },
  'tutor@afda.co.za': {
    email: 'tutor@afda.co.za',
    name: 'Tutor Demo',
  },
  'student@students.afda.co.za': {
    email: 'student@students.afda.co.za',
    name: 'Student Demo',
  },
  'operations@afda.co.za': {
    email: 'operations@afda.co.za',
    name: 'Operations Demo',
  },
};

export function getMockUser(email: string): MockUser | null {
  const normalized = email.trim().toLowerCase();
  return MOCK_USERS[normalized] ?? {
    email: normalized,
    name: normalized.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
  };
}

export function listMockUsers(): MockUser[] {
  return Object.values(MOCK_USERS);
}
