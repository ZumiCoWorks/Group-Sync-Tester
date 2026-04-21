export const WORKSUITE_ROOT_COLLECTION = 'worksuite_v1';
export const WORKSUITE_ROOT_DOC = 'app';
export const WORKSUITE_STORAGE_KEY = 'worksuite_v1_snapshot';
export const WORKSUITE_ROLE_KEY = 'worksuite_v1_role';
export const LOCKOUT_LABEL = 'Thursday 14:00';
export const LOCKOUT_DAY_INDEX = 4;
export const LOCKOUT_HOUR = 14;

export const WORKSUITE_PREFIX = process.env.NEXT_PUBLIC_DATABASE_PREFIX || 'ws_';
export const WORKSUITE_DEV_MODE = String(process.env.NEXT_PUBLIC_DEV_MODE || 'true').toLowerCase() === 'true';

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
