export function isAfdaEmail(email: string | null | undefined) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return false;
  }

  const allowedDomains = getAllowedEmailDomains();
  return allowedDomains.some((domain) => normalizedEmail.endsWith(`@${domain}`));
}

export function normalizeEmail(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  // Azure B2B guest UPN example: info_zcollabworks.co.za#EXT#@tenant.onmicrosoft.com
  // Convert to info@zcollabworks.co.za so domain allowlists can be applied consistently.
  const extMatch = normalizedEmail.match(/^(.+?)#ext#@[^@]+$/i);
  if (!extMatch) {
    return normalizedEmail;
  }

  const encodedOriginalEmail = extMatch[1];
  const separatorIndex = encodedOriginalEmail.lastIndexOf('_');
  if (separatorIndex <= 0 || separatorIndex >= encodedOriginalEmail.length - 1) {
    return normalizedEmail;
  }

  const localPart = encodedOriginalEmail.slice(0, separatorIndex);
  const domainPart = encodedOriginalEmail.slice(separatorIndex + 1);
  return `${localPart}@${domainPart}`;
}

export function resolveDisplayName(name: string | null | undefined, email: string | null | undefined) {
  const trimmedName = name?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  return email?.trim() || 'AFDA User';
}

function parseDomains(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

export function getAllowedEmailDomains() {
  const explicitDomains = parseDomains(process.env.AFDA_ALLOWED_EMAIL_DOMAINS);
  if (explicitDomains.length > 0) {
    return explicitDomains;
  }

  const fallbackDomains = parseDomains([
    process.env.AFDA_STAFF_EMAIL_DOMAIN,
    process.env.AFDA_STUDENT_EMAIL_DOMAIN,
  ].filter(Boolean).join(',')) || ['afda.co.za'];

  return fallbackDomains.length > 0 ? fallbackDomains : ['afda.co.za'];
}
