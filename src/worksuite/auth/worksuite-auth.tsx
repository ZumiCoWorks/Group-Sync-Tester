'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { WORKSUITE_DEV_MODE, WORKSUITE_ROLE_KEY } from '../config';
import { WorksuiteMode, WorksuiteRole, WorksuiteUser } from '../types';

const ROLE_DEFAULTS: Record<WorksuiteRole, { displayName: string; email: string }> = {
  operations: { displayName: 'Nomsa Operations', email: 'ops@afda.local' },
  staff: { displayName: 'Daisy Tutor', email: 'tutor@afda.local' },
  student: { displayName: 'Nandi Student', email: 'student@afda.local' },
};

type WorksuiteAuthContextValue = {
  user: WorksuiteUser;
  mode: WorksuiteMode;
  canToggleRole: boolean;
  setRole: (role: WorksuiteRole) => void;
  setDisplayName: (displayName: string) => void;
};

const WorksuiteAuthContext = createContext<WorksuiteAuthContextValue | null>(null);

function buildMockUser(role: WorksuiteRole, displayName: string): WorksuiteUser {
  return {
    id: `${role}-${displayName.toLowerCase().replace(/\s+/g, '-')}`,
    displayName,
    email: ROLE_DEFAULTS[role].email,
    role,
    mode: 'mock',
    venueScope: 'AFDA Worksuite',
  };
}

export function WorksuiteAuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<WorksuiteRole>('operations');
  const [displayName, setDisplayNameState] = useState(ROLE_DEFAULTS.operations.displayName);

  useEffect(() => {
    if (!WORKSUITE_DEV_MODE) return;

    const savedRole = window.localStorage.getItem(WORKSUITE_ROLE_KEY) as WorksuiteRole | null;
    if (savedRole === 'operations' || savedRole === 'staff' || savedRole === 'student') {
      setRoleState(savedRole);
      setDisplayNameState(ROLE_DEFAULTS[savedRole].displayName);
    }
  }, []);

  useEffect(() => {
    if (!WORKSUITE_DEV_MODE) return;
    window.localStorage.setItem(WORKSUITE_ROLE_KEY, role);
  }, [role]);

  const value = useMemo<WorksuiteAuthContextValue>(() => {
    const user: WorksuiteUser = WORKSUITE_DEV_MODE
      ? buildMockUser(role, displayName)
      : {
          id: 'azure-placeholder',
          displayName: 'Microsoft Auth Pending',
          email: 'pending@afda.ac.za',
          role: 'operations',
          mode: 'connected',
          venueScope: 'AFDA Worksuite',
        };

    return {
      user,
      mode: WORKSUITE_DEV_MODE ? 'mock' : 'connected',
      canToggleRole: WORKSUITE_DEV_MODE,
      setRole: (nextRole: WorksuiteRole) => {
        if (!WORKSUITE_DEV_MODE) return;
        setRoleState(nextRole);
        setDisplayNameState(ROLE_DEFAULTS[nextRole].displayName);
      },
      setDisplayName: (nextDisplayName: string) => {
        if (!WORKSUITE_DEV_MODE) return;
        setDisplayNameState(nextDisplayName);
      },
    };
  }, [displayName, role]);

  return <WorksuiteAuthContext.Provider value={value}>{children}</WorksuiteAuthContext.Provider>;
}

export function useWorksuiteAuth() {
  const context = useContext(WorksuiteAuthContext);
  if (!context) {
    throw new Error('useWorksuiteAuth must be used within WorksuiteAuthProvider');
  }

  return context;
}
