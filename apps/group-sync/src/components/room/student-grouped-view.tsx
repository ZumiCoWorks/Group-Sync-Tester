'use client';

import { Zap } from 'lucide-react';
import { useMemo } from 'react';
import type { SyncSession } from '@afda/shared/types';

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
      <div className="min-h-screen bg-foreground text-background p-6 flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Waiting for groups...</h2>
          <p>Your group information isn't available yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-foreground text-background p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8 text-center animate-in fade-in scale-95 duration-500">
        <div className="inline-block p-4 bg-primary/10 rounded-full border border-primary/20 mb-4">
          <Zap className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-5xl font-black tracking-tighter font-headline">Group {groupIdx + 1}</h2>
        <div className="space-y-3 mt-10">
          {myGroup.map((member, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl flex items-center gap-4 border text-left ${member.name === studentName
                  ? 'bg-primary border-primary/80 text-primary-foreground shadow-xl shadow-primary/20'
                  : 'bg-secondary/10 border-border/10 text-muted-foreground'
                }`}
            >
              <span className="text-3xl">{member.avatar}</span>
              <span className="font-bold text-lg">{member.name} {member.name === studentName && '(You)'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
