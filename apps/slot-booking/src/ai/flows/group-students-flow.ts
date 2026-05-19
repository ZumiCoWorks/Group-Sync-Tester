export async function groupStudents(opts: { participants: any[]; groupCount: number; exclusions?: string[][]; useDisciplines?: boolean }) {
  // Minimal deterministic grouping stub for demo and typecheck.
  const { participants, groupCount } = opts;
  const groups: { members: { name: string; avatar: string }[] }[] = Array.from({ length: Math.max(1, groupCount) }, () => ({ members: [] }));

  participants.forEach((p, i) => {
    groups[i % groups.length].members.push({ name: p.name, avatar: p.avatar });
  });

  return { groups };
}
