export const WORKSUITE_ROOT_COLLECTION = 'worksuite_v1';
export const WORKSUITE_ROOT_DOC = 'app';
export const WORKSUITE_STORAGE_KEY = 'worksuite_v1_snapshot';
export const WORKSUITE_ROLE_KEY = 'worksuite_v1_role';
export const LOCKOUT_LABEL = 'Thursday 14:00';
export const LOCKOUT_DAY_INDEX = 4;
export const LOCKOUT_HOUR = 14;

export const WORKSUITE_PREFIX = process.env.NEXT_PUBLIC_DATABASE_PREFIX || 'ws_';
export const WORKSUITE_DEV_MODE = String(process.env.NEXT_PUBLIC_DEV_MODE || 'true').toLowerCase() === 'true';

export function isLocked(targetDate: string | Date, now: Date = new Date()) {
  const requestDate = typeof targetDate === 'string' ? new Date(targetDate) : new Date(targetDate);
  if (Number.isNaN(requestDate.getTime())) {
    return false;
  }

  const lockoutBoundary = new Date(now);
  const dayIndex = lockoutBoundary.getDay();
  const daysUntilThursday = (LOCKOUT_DAY_INDEX - dayIndex + 7) % 7;

  lockoutBoundary.setDate(lockoutBoundary.getDate() + daysUntilThursday);
  lockoutBoundary.setHours(LOCKOUT_HOUR, 0, 0, 0);

  if (now < lockoutBoundary) {
    return false;
  }

  const nextWeekStart = new Date(lockoutBoundary);
  nextWeekStart.setDate(nextWeekStart.getDate() + 4);
  nextWeekStart.setHours(0, 0, 0, 0);

  return requestDate >= nextWeekStart;
}

export function isScheduleLocked(now: Date = new Date()) {
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();

  return day === LOCKOUT_DAY_INDEX && (hour > LOCKOUT_HOUR || (hour === LOCKOUT_HOUR && minute >= 0));
}

export function getLockoutCopy(now: Date = new Date()) {
  if (isScheduleLocked(now)) {
    return `Lockout active since ${LOCKOUT_LABEL}. Create/Edit actions are paused for the upcoming week.`;
  }

  return `Create/Edit actions remain open until ${LOCKOUT_LABEL}.`;
}
