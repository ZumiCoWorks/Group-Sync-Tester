export type Participant = {
  id: string;
  name: string;
  avatar: string;
  joinedAt: number;
  discipline?: string;
  disciplines?: string[];
};

export type GroupMember = {
  name: string;
  avatar: string;
  discipline?: string;
  disciplines?: string[];
  current_placement?: string;
  performance?: string;
};

export type Group = {
  members: GroupMember[];
};

export type Session = {
  id?: string;
  hostId: string;
  status: 'lobby' | 'grouped' | 'ended';
  createdAt: number;
  groups: Group[];
  name?: string;
  endedAt?: number;
  participantCount?: number;
};

export type SavedSession = {
  id: string;
  name: string;
  hostId: string;
  createdAt: number;
  savedAt: number;
  endedAt?: number;
  participantCount: number;
  groups: Group[];
  participants: Participant[];
};

export type UploadedParticipant = {
  name: string;
  discipline?: string;
  disciplines?: string[];
};
