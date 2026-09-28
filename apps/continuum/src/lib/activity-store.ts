export type ActivityRecord = {
  id: string;
  title: string;
  course: string;
  date: string;
  owner: string;
  services: string[];
};

export const ACTIVITY_STORAGE_KEY = 'continuum-activities';

export function activityId(title: string, date: string) {
  return `${title}-${date}`.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function readActivities(): ActivityRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
    return value ? JSON.parse(value) as ActivityRecord[] : [];
  } catch {
    return [];
  }
}

export function writeActivities(activities: ActivityRecord[]) {
  window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activities));
}
