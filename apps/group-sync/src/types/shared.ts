/**
 * Shared types for Group Sync.
 * Locally defined to allow independent Vercel deployments.
 */

export interface SyncSession {
  id: string;
  code: string;
  name?: string;
  host_id: string | null;
  status: 'lobby' | 'grouped' | 'ended';
  groups: SyncGroup[];
  created_at: string;
  updated_at: string;
  ended_at: string | null;
}

export interface SyncGroup {
  id: string;
  members: SyncGroupMember[];
}

export interface SyncGroupMember {
  name: string;
  avatar: string;
  discipline?: string;
  student_number?: string;
  current_placement?: string;
}

export interface SyncParticipant {
  id: string;
  session_id: string;
  name: string;
  avatar: string;
  student_number?: string;
  discipline?: string;
  current_placement?: string;
  joined_at: string;
}
