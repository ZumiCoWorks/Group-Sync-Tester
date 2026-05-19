import 'server-only';

import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import path from 'path';
import { normalizeEmail } from '@/lib/afda-auth';

export type RoleRequest = {
  id: string;
  email: string;
  role: 'operations' | 'lecturer' | 'tutor';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  updatedAt?: number;
};

const STORE_DIR = path.join(process.cwd(), '.data');
const REQ_PATH = path.join(STORE_DIR, 'role-requests.json');
const MAP_PATH = path.join(STORE_DIR, 'user-roles.json');

async function readJson(filePath: string) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeJson(filePath: string, data: unknown) {
  await mkdir(STORE_DIR, { recursive: true });
  const tmp = `${filePath}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await rename(tmp, filePath);
}

export async function listRoleRequests() {
  const raw = (await readJson(REQ_PATH)) as RoleRequest[] | null;
  return raw ?? [];
}

export async function saveRoleRequest(req: RoleRequest) {
  const list = (await listRoleRequests()).filter(Boolean);
  const next = [...list.filter((r) => r.id !== req.id), req];
  await writeJson(REQ_PATH, next);
  return req;
}

export async function updateRoleRequestStatus(id: string, status: RoleRequest['status']) {
  const list = await listRoleRequests();
  const found = list.find((r) => r.id === id);
  if (!found) return null;
  found.status = status;
  found.updatedAt = Date.now();
  await writeJson(REQ_PATH, list);
  return found;
}

export async function getAssignedRole(email: string) {
  const normalized = normalizeEmail(email) ?? email.toLowerCase();

  // 1) FORCE_ROLE (applies to current signed-in user during dev/testing)
  const force = process.env.FORCE_ROLE;
  if (force && force.trim().length > 0) {
    return force as 'operations' | 'lecturer' | 'tutor' | 'student';
  }

  // 2) ROLE_OVERRIDES supports comma-separated email:role pairs
  // e.g. ROLE_OVERRIDES=you@x.co.za:operations,me@y.co:lecturer
  const raw = process.env.ROLE_OVERRIDES;
  if (raw && raw.trim().length > 0) {
    const pairs = raw.split(',').map((p) => p.trim()).filter(Boolean);
    for (const p of pairs) {
      const [e, r] = p.split(':').map((s) => s.trim());
      if (!e || !r) continue;
      if ((normalizeEmail(e) ?? e.toLowerCase()) === normalized) {
        return r as 'operations' | 'lecturer' | 'tutor' | 'student';
      }
    }
  }

  // 3) persisted map
  const map = (await readJson(MAP_PATH)) as Record<string, string> | null;
  if (!map) return null;
  const assigned = map[normalized] as 'operations' | 'lecturer' | 'tutor' | 'student' | null;
  if (assigned) {
    return assigned;
  }

  if (process.env.NODE_ENV !== 'production' || process.env.MOCK_AUTH_ENABLED === 'true') {
    if (normalized.endsWith('@students.afda.co.za') || normalized.includes('student')) {
      return 'student';
    }

    if (normalized.includes('tutor')) {
      return 'tutor';
    }

    if (normalized.includes('lecturer')) {
      return 'lecturer';
    }

    if (normalized.includes('ops') || normalized.includes('operations')) {
      return 'operations';
    }

    return 'lecturer';
  }

  return null;
}

export async function assignRoleToUser(email: string, role: 'operations' | 'lecturer' | 'tutor' | 'student') {
  const key = normalizeEmail(email) ?? email.toLowerCase();
  const map = (await readJson(MAP_PATH)) as Record<string, string> | null;
  const next = map ? { ...map } : {};
  next[key] = role;
  await writeJson(MAP_PATH, next);
  return role;
}

export async function clearRoleForUser(email: string) {
  const key = normalizeEmail(email) ?? email.toLowerCase();
  const map = (await readJson(MAP_PATH)) as Record<string, string> | null;
  if (!map || !map[key]) return false;
  const next = { ...map };
  delete next[key];
  await writeJson(MAP_PATH, next);
  return true;
}
