import type { Metadata } from 'next';
import { GroupSyncHome } from '@/components/group-sync/group-sync-home';

export const metadata: Metadata = {
  title: 'Group Sync',
  description: 'Live student grouping for AFDA rooms and sessions.',
};

export default function GroupSyncPage() {
  return <GroupSyncHome />;
}
