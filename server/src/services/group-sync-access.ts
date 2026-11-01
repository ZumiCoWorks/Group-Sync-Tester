export type GroupSyncUser = {
  id: string;
  role: string;
};

export type GroupSyncSessionRecord = {
  id: string;
  code: string;
  name?: string | null;
  host_id: string | null;
  status: string;
  groups?: unknown;
  roster?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
  ended_at?: string | null;
};

export type GroupSyncParticipantRecord = {
  id: string;
  session_id: string;
  name: string;
  avatar: string;
  student_number?: string | null;
  discipline?: string | null;
  current_placement?: string | null;
  joined_at?: string | null;
};

type GroupMember = {
  name?: string;
  avatar?: string;
  student_number?: string;
};

type GroupRecord = {
  id?: string;
  members?: GroupMember[];
};

export function canManageGroupSyncSession(
  user: GroupSyncUser | undefined,
  session: Pick<GroupSyncSessionRecord, 'host_id'>
) {
  return Boolean(user && (session.host_id === user.id || user.role === 'admin'));
}

export function projectPublicSession(session: GroupSyncSessionRecord) {
  return {
    code: session.code,
    name: session.name || 'Group Sync Session',
    status: session.status,
    groups: [],
  };
}

export function projectParticipantSession(
  session: GroupSyncSessionRecord,
  participant: GroupSyncParticipantRecord
) {
  const groups = Array.isArray(session.groups) ? session.groups as GroupRecord[] : [];
  const participantNumber = participant.student_number?.trim().toLowerCase();
  const participantName = participant.name.trim().toLowerCase();

  const projectedGroups = groups.map((group) => {
    const members = Array.isArray(group.members) ? group.members : [];
    const containsParticipant = members.some((member) => {
      const memberNumber = member.student_number?.trim().toLowerCase();
      return (participantNumber && memberNumber === participantNumber) ||
        member.name?.trim().toLowerCase() === participantName;
    });

    return {
      id: group.id,
      members: containsParticipant
        ? members.map((member) => ({ name: member.name || '', avatar: member.avatar || '' }))
        : [],
    };
  });

  return {
    ...projectPublicSession(session),
    groups: projectedGroups,
  };
}

export function projectParticipant(participant: GroupSyncParticipantRecord) {
  return {
    id: participant.id,
    name: participant.name,
    avatar: participant.avatar,
  };
}

export function isPopulateEnabled(nodeEnv: string | undefined, explicitFlag: string | undefined) {
  if (nodeEnv === 'production') return false;
  return explicitFlag === 'true';
}
