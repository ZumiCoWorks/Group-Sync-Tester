import type { DelegationRecord, WorksuiteRole } from './types';

export function resolveSurfaceRole(pathname: string): WorksuiteRole {
  const normalizedPath = pathname.toLowerCase();

  if (normalizedPath.includes('/ops')) {
    return 'operations';
  }

  if (normalizedPath.includes('/lecturer')) {
    return 'lecturer';
  }

  if (normalizedPath.includes('/tutor')) {
    return 'tutor';
  }

  if (normalizedPath.includes('/student')) {
    return 'student';
  }

  return 'operations';
}

export function roleLabel(role: WorksuiteRole) {
  switch (role) {
    case 'operations':
      return 'Operations';
    case 'lecturer':
      return 'Lecturer';
    case 'tutor':
      return 'Tutor';
    case 'student':
      return 'Student';
    default:
      return 'Worksuite';
  }
}

export function canTutorActForLecturer(delegations: DelegationRecord[], tutorEmail: string, lecturerEmail: string) {
  const normalizedTutor = tutorEmail.trim().toLowerCase();
  const normalizedLecturer = lecturerEmail.trim().toLowerCase();

  return delegations.some((delegation) => {
    if (!delegation.isActive) {
      return false;
    }

    const hasScope = delegation.scope === 'full' || delegation.scope === 'slot-create';
    return hasScope
      && delegation.tutorEmail.trim().toLowerCase() === normalizedTutor
      && delegation.lecturerEmail.trim().toLowerCase() === normalizedLecturer;
  });
}

export function listActiveDelegationsForTutor(delegations: DelegationRecord[], tutorEmail: string) {
  const normalizedTutor = tutorEmail.trim().toLowerCase();

  return delegations.filter((delegation) => delegation.isActive && delegation.tutorEmail.trim().toLowerCase() === normalizedTutor);
}

export function listActiveDelegationsForLecturer(delegations: DelegationRecord[], lecturerEmail: string) {
  const normalizedLecturer = lecturerEmail.trim().toLowerCase();

  return delegations.filter((delegation) => delegation.isActive && delegation.lecturerEmail.trim().toLowerCase() === normalizedLecturer);
}