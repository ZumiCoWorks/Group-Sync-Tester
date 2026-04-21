'use server';
/**
 * @fileOverview A student grouping function with random shuffle.
 *
 * - groupStudents - A function that handles the student grouping process.
 * - GroupStudentsInput - The input type for the groupStudents function.
 * - GroupStudentsOutput - The return type for the groupStudents function.
 */

type Participant = {
  id: string;
  name: string;
  avatar: string;
  joinedAt: number;
  discipline?: string;
};

type GroupMember = {
  name: string;
  avatar: string;
};

type Group = {
  members: GroupMember[];
};

export type GroupStudentsInput = {
  participants: Participant[];
  groupCount: number;
  useDisciplines: boolean;
  exclusions: [string, string][];
};

export type GroupStudentsOutput = {
  groups: Group[];
};

export async function groupStudents(input: GroupStudentsInput): Promise<GroupStudentsOutput> {
  console.log('Server action: groupStudents called with', {
    participantCount: input.participants.length,
    groupCount: input.groupCount
  });

  // Simple random shuffle fallback
  // TODO: Re-enable AI grouping once Genkit is properly configured for Vercel
  const shuffled = [...input.participants].sort(() => Math.random() - 0.5);
  const newGroups: Group[] = Array.from({ length: input.groupCount }, () => ({ members: [] }));

  shuffled.forEach((p, index) => {
    newGroups[index % input.groupCount].members.push({ name: p.name, avatar: p.avatar });
  });

  console.log('Server action: groupStudents returning', { groupCount: newGroups.length });

  return { groups: newGroups };
}
