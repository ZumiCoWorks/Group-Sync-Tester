import {
  canManageGroupSyncSession,
  isPopulateEnabled,
  projectParticipant,
  projectParticipantSession,
  projectPublicSession,
} from './group-sync-access';

const session = {
  id: 'session-1',
  code: 'ABC123',
  name: 'Venture Lab',
  host_id: 'host-1',
  status: 'grouped',
  groups: [
    { id: 'group-1', members: [{ name: 'Ada', avatar: 'A', student_number: 'S1', discipline: 'Design' }] },
    { id: 'group-2', members: [{ name: 'Grace', avatar: 'G', student_number: 'S2', performance: 'Good' }] },
  ],
  roster: [{ name: 'Ada', studentNumber: 'S1', performance: 'Good' }],
  created_at: '2026-11-01T10:00:00.000Z',
  updated_at: '2026-11-01T10:05:00.000Z',
  ended_at: null,
};

const participant = {
  id: 'participant-1',
  session_id: 'session-1',
  name: 'Ada',
  avatar: 'A',
  student_number: 'S1',
  discipline: 'Design',
  current_placement: 'Old team',
  joined_at: '2026-11-01T10:01:00.000Z',
};

describe('Group Sync access policy', () => {
  it('allows only the host or an explicit admin to manage a session', () => {
    expect(canManageGroupSyncSession({ id: 'host-1', role: 'lecturer' }, session)).toBe(true);
    expect(canManageGroupSyncSession({ id: 'admin-1', role: 'admin' }, session)).toBe(true);
    expect(canManageGroupSyncSession({ id: 'other-1', role: 'lecturer' }, session)).toBe(false);
    expect(canManageGroupSyncSession(undefined, session)).toBe(false);
  });

  it('does not expose host, roster, or groups in public discovery', () => {
    const projected = projectPublicSession(session);
    expect(projected).toEqual(expect.objectContaining({ code: 'ABC123', name: 'Venture Lab', status: 'grouped', groups: [] }));
    expect(projected).not.toHaveProperty('id');
    expect(projected).not.toHaveProperty('host_id');
    expect(projected).not.toHaveProperty('roster');
    expect(projected).not.toHaveProperty('created_at');
    expect(projected).not.toHaveProperty('updated_at');
    expect(projected).not.toHaveProperty('ended_at');
  });

  it('returns only the participant group with minimal member fields', () => {
    const projected = projectParticipantSession(session, participant);
    expect(projected.groups[0].members).toEqual([{ name: 'Ada', avatar: 'A' }]);
    expect(projected.groups[1].members).toEqual([]);
    expect(JSON.stringify(projected)).not.toContain('Design');
    expect(JSON.stringify(projected)).not.toContain('Good');
  });

  it('removes roster-only fields from a participant response', () => {
    expect(projectParticipant(participant)).toEqual({
      id: 'participant-1',
      name: 'Ada',
      avatar: 'A',
    });
  });

  it('keeps demo population disabled in production and opt-in elsewhere', () => {
    expect(isPopulateEnabled('production', 'true')).toBe(false);
    expect(isPopulateEnabled('development', undefined)).toBe(false);
    expect(isPopulateEnabled('development', 'true')).toBe(true);
  });
});
