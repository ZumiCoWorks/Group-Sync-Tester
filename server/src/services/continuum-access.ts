export type ContinuumGrant = {
  id?: string;
  user_id: string;
  workspace_id: string;
  service_id: string | null;
  capabilities: string[];
  starts_at: string;
  expires_at: string | null;
  revoked_at: string | null;
};

export function isContinuumGrantActive(grant: ContinuumGrant, at = new Date()) {
  if (grant.revoked_at) return false;
  if (new Date(grant.starts_at).getTime() > at.getTime()) return false;
  if (grant.expires_at && new Date(grant.expires_at).getTime() <= at.getTime()) return false;
  return true;
}

export function continuumGrantAllows(
  grant: ContinuumGrant,
  workspaceId: string,
  serviceId: string,
  capabilityKey: string,
  at = new Date()
) {
  if (!isContinuumGrantActive(grant, at)) return false;
  if (grant.workspace_id !== workspaceId) return false;
  if (grant.service_id && grant.service_id !== serviceId) return false;
  return grant.capabilities.includes('orchestrate_workflows') || grant.capabilities.includes(`${capabilityKey}_manage`);
}

export function canRunContinuumAction(
  role: string,
  grants: ContinuumGrant[],
  workspaceId: string,
  serviceId: string,
  capabilityKey: string,
  at = new Date()
) {
  if (role === 'admin') return true;
  return grants.some((grant) => continuumGrantAllows(grant, workspaceId, serviceId, capabilityKey, at));
}
