import {
  canRunContinuumAction,
  continuumGrantAllows,
  isContinuumGrantActive,
  type ContinuumGrant,
} from './continuum-access';

const now = new Date('2026-09-28T12:00:00.000Z');
const baseGrant: ContinuumGrant = {
  user_id: 'user-1',
  workspace_id: 'workspace-1',
  service_id: 'service-1',
  capabilities: ['group_sync_manage'],
  starts_at: '2026-09-01T00:00:00.000Z',
  expires_at: '2026-10-01T00:00:00.000Z',
  revoked_at: null,
};

describe('Continuum scoped access', () => {
  test('accepts a current matching workspace and service grant', () => {
    expect(continuumGrantAllows(baseGrant, 'workspace-1', 'service-1', 'group_sync', now)).toBe(true);
  });

  test('rejects expired, revoked and future grants', () => {
    expect(isContinuumGrantActive({ ...baseGrant, expires_at: '2026-09-28T11:59:59.000Z' }, now)).toBe(false);
    expect(isContinuumGrantActive({ ...baseGrant, revoked_at: '2026-09-20T00:00:00.000Z' }, now)).toBe(false);
    expect(isContinuumGrantActive({ ...baseGrant, starts_at: '2026-09-29T00:00:00.000Z' }, now)).toBe(false);
  });

  test('rejects a different workspace or service', () => {
    expect(continuumGrantAllows(baseGrant, 'workspace-2', 'service-1', 'group_sync', now)).toBe(false);
    expect(continuumGrantAllows(baseGrant, 'workspace-1', 'service-2', 'group_sync', now)).toBe(false);
  });

  test('allows institution administrators without a grant', () => {
    expect(canRunContinuumAction('admin', [], 'workspace-1', 'service-1', 'group_sync', now)).toBe(true);
  });

  test('allows a service-neutral orchestration grant', () => {
    const grant = { ...baseGrant, service_id: null, capabilities: ['orchestrate_workflows'] };
    expect(canRunContinuumAction('lecturer', [grant], 'workspace-1', 'service-2', 'group_sync', now)).toBe(true);
  });
});
