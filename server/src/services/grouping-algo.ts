import { SyncGroup, SyncParticipant, SyncGroupMember } from '@afda/shared/types';

export interface GroupingOptions {
  groupCount: number;
  useDisciplines: boolean;
  avoidSamePlacements: boolean;
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Groups participants using a heuristic scoring system to balance sizes,
 * distribute disciplines, and disperse existing team placements.
 */
export function generateGroups(
  participants: SyncParticipant[],
  options: GroupingOptions
): SyncGroup[] {
  const { groupCount, useDisciplines, avoidSamePlacements } = options;

  if (participants.length === 0) {
    return [];
  }

  // Handle boundary case of 1 group
  if (groupCount <= 1) {
    return [
      {
        id: 'group-1',
        members: participants.map(p => ({
          name: p.name,
          avatar: p.avatar,
          discipline: p.discipline,
          student_number: p.student_number,
          current_placement: p.current_placement
        }))
      }
    ];
  }

  // Initialize empty groups
  const groups: SyncGroup[] = Array.from({ length: Math.min(groupCount, participants.length) }, (_, i) => ({
    id: `group-${i + 1}`,
    members: []
  }));

  // Shuffle all participants initially to introduce randomness
  let queue = shuffleArray(participants);

  // If using disciplines, group participants by discipline so we distribute them round-robin
  if (useDisciplines) {
    const disciplineGroups = new Map<string, SyncParticipant[]>();
    const withoutDiscipline: SyncParticipant[] = [];

    queue.forEach(p => {
      const disc = p.discipline?.trim();
      if (disc) {
        if (!disciplineGroups.has(disc)) {
          disciplineGroups.set(disc, []);
        }
        disciplineGroups.get(disc)!.push(p);
      } else {
        withoutDiscipline.push(p);
      }
    });

    // Rebuild the queue by interleaving disciplines
    const interleavedQueue: SyncParticipant[] = [];
    const disciplineIterators = Array.from(disciplineGroups.values());
    let hasMore = true;
    let index = 0;

    while (hasMore) {
      hasMore = false;
      disciplineIterators.forEach(list => {
        if (index < list.length) {
          interleavedQueue.push(list[index]);
          hasMore = true;
        }
      });
      index++;
    }
    
    // Add those without disciplines at the end
    interleavedQueue.push(...withoutDiscipline);
    queue = interleavedQueue;
  }

  // Distribute participants using a heuristic scoring system
  queue.forEach(participant => {
    let bestGroupIndex = 0;
    let lowestScore = Infinity;

    groups.forEach((group, idx) => {
      // 1. Size Penalty: keep groups balanced. Weight of 10000 per member.
      let score = group.members.length * 10000;

      // 2. Placement conflict penalty: avoid putting students who were in the same placement in the same group.
      if (avoidSamePlacements && participant.current_placement) {
        const hasPlacementConflict = group.members.some(
          (m: SyncGroupMember) => m.current_placement && m.current_placement.toLowerCase() === participant.current_placement!.toLowerCase()
        );
        if (hasPlacementConflict) {
          score += 1000; // Large penalty
        }
      }

      // 3. Discipline conflict penalty: try to maximize diversity of disciplines in each group.
      if (useDisciplines && participant.discipline) {
        const sameDisciplineCount = group.members.filter(
          (m: SyncGroupMember) => m.discipline && m.discipline.toLowerCase() === participant.discipline!.toLowerCase()
        ).length;
        score += sameDisciplineCount * 100; // Small penalty per matching discipline
      }

      if (score < lowestScore) {
        lowestScore = score;
        bestGroupIndex = idx;
      } else if (score === lowestScore) {
        // If tied, randomly choose to add variety
        if (Math.random() < 0.5) {
          bestGroupIndex = idx;
        }
      }
    });

    // Assign participant to the chosen group
    groups[bestGroupIndex].members.push({
      name: participant.name,
      avatar: participant.avatar,
      discipline: participant.discipline,
      student_number: participant.student_number,
      current_placement: participant.current_placement
    });
  });

  return groups;
}
