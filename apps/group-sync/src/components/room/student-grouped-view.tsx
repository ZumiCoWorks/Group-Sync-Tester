'use client';

import { Zap } from 'lucide-react';
import { useMemo } from 'react';
import type { SyncSession } from '@/types/shared';

type StudentGroupedViewProps = {
  sessionData: SyncSession | null;
  studentName: string;
};

export function StudentGroupedView({ sessionData, studentName }: StudentGroupedViewProps) {
  const { myGroup, groupIdx } = useMemo(() => {
    if (!sessionData || !studentName) return { myGroup: null, groupIdx: -1 };

    const groupIndex = sessionData.groups.findIndex(g => g.members.some(m => m.name === studentName));
    const group = sessionData.groups[groupIndex]?.members || null;

    return { myGroup: group, groupIdx: groupIndex };
  }, [sessionData, studentName]);

  if (!myGroup) {
    return (
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="text-center rounded-3xl border border-muted bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-heading">Waiting for groups...</h2>
          <p className="text-body mt-2">Your group information isn't available yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center animate-in fade-in scale-95 duration-500 rounded-3xl border border-muted bg-white p-6 shadow-xl backdrop-blur-xl sm:p-8">
        <div className="inline-block p-4 bg-accent-creative/10 rounded-full border border-accent-creative/20 mb-2">
          <Zap className="w-12 h-12 text-accent-creative" />
        </div>
        <h2 className="text-5xl font-black tracking-tighter font-headline text-heading">Group {groupIdx + 1}</h2>
        <div className="space-y-3 mt-8">
          {myGroup.map((member, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl flex items-center gap-4 border text-left ${member.name === studentName
                  ? 'bg-accent-creative border-accent-creative/80 text-white shadow-xl shadow-accent-creative/20'
                  : 'bg-secondary border-muted text-body'
                }`}
            >
              <span className="text-3xl">{member.avatar}</span>
              <span className="font-semibold text-lg">{member.name} {member.name === studentName && '(You)'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
