import type { Metadata } from 'next';
import { WorksuiteAuthProvider } from '@/worksuite/auth/worksuite-auth';
import { WorksuiteFrame } from '@/worksuite/components/worksuite-frame';

export const metadata: Metadata = {
  title: 'AFDA Worksuite',
  description: 'Venue booking and assessment scheduling for AFDA.',
};

export default function WorksuiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorksuiteAuthProvider>
      <WorksuiteFrame>{children}</WorksuiteFrame>
    </WorksuiteAuthProvider>
  );
}
