import 'server-only';

import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import path from 'path';
import { normalizeEmail } from '@/lib/afda-auth';

export type AzureTokenRecord = {
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tenantId: string;
  updatedAt: number;
};

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_PATH = path.join(STORE_DIR, 'azure-token-store.json');

let cache: Record<string, AzureTokenRecord> | null = null;

function getRecordKey(email: string) {
  return normalizeEmail(email) ?? email.trim().toLowerCase();
}

async function readStore() {
  if (cache) {
    return cache;
  }

  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    cache = JSON.parse(raw) as Record<string, AzureTokenRecord>;
  } catch {
    cache = {};
  }

  return cache;
}

async function writeStore(records: Record<string, AzureTokenRecord>) {
  await mkdir(STORE_DIR, { recursive: true });

  const payload = `${JSON.stringify(records, null, 2)}\n`;
  const tempPath = `${STORE_PATH}.tmp`;
  await writeFile(tempPath, payload, 'utf8');
  await rename(tempPath, STORE_PATH);
  cache = records;
}

export async function saveAzureTokenRecord(record: {
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tenantId: string;
}) {
  const email = normalizeEmail(record.email);
  if (!email || !record.accessToken) {
    return null;
  }

  const records = await readStore();
  const nextRecord: AzureTokenRecord = {
    email,
    accessToken: record.accessToken,
    refreshToken: record.refreshToken,
    expiresAt: record.expiresAt,
    tenantId: record.tenantId,
    updatedAt: Date.now(),
  };

  records[getRecordKey(email)] = nextRecord;
  await writeStore(records);
  return nextRecord;
}

export async function getAzureTokenRecord(email: string) {
  const records = await readStore();
  return records[getRecordKey(email)] ?? null;
}

export async function refreshAzureAccessTokenForUser(email: string) {
  const record = await getAzureTokenRecord(email);
  if (!record?.refreshToken) {
    return null;
  }

  const clientId = process.env.AZURE_AD_CLIENT_ID ?? '';
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET ?? '';
  const tenantId = process.env.AZURE_AD_TENANT_ID ?? record.tenantId ?? 'common';

  if (!clientId || !clientSecret) {
    return null;
  }

  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: record.refreshToken,
      scope: 'openid profile email offline_access Calendars.ReadWrite',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure token refresh failed: ${errorText}`);
  }

  const payload = await response.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const nextRecord = await saveAzureTokenRecord({
    email: record.email,
    accessToken: payload.access_token ?? record.accessToken,
    refreshToken: payload.refresh_token ?? record.refreshToken,
    expiresAt: Date.now() + (Number(payload.expires_in ?? 3600) * 1000),
    tenantId,
  });

  return nextRecord?.accessToken ?? null;
}

export async function getValidAzureAccessTokenForUser(email: string) {
  const record = await getAzureTokenRecord(email);
  if (!record) {
    return null;
  }

  if (record.accessToken && record.expiresAt - Date.now() > 60_000) {
    return record.accessToken;
  }

  return refreshAzureAccessTokenForUser(email);
}