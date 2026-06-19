// Inline types (avoids @shared/types path alias which isn't configured in this package)
export interface SyncGroupMember {
  name: string;
  avatar: string;
  discipline?: string | null;
  student_number?: string | null;
  current_placement?: string | null;
  performance?: string | null;
}

export interface SyncGroup {
  id: string;
  members: SyncGroupMember[];
}

export interface SyncParticipant {
  id?: string;
  session_id?: string;
  name: string;
  avatar: string;
  student_number?: string | null;
  discipline?: string | null;
  current_placement?: string | null;
  joined_at?: string;
  performance?: string | null;
}

export interface GroupingOptions {
  groupCount: number;
  useDisciplines: boolean;
  avoidSamePlacements: boolean;
  requiredDisciplines?: string[];
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
  const { groupCount, useDisciplines, avoidSamePlacements, requiredDisciplines } = options;

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
          discipline: p.discipline || undefined,
          student_number: p.student_number || undefined,
          current_placement: p.current_placement || undefined,
          performance: p.performance || undefined
        }))
      }
    ];
  }

  // Initialize empty groups
  const groups: SyncGroup[] = Array.from({ length: Math.min(groupCount, participants.length) }, (_, i) => ({
    id: `group-${i + 1}`,
    members: []
  }));

  // Seeding phase for required disciplines
  const seededParticipantIds = new Set<string>();

  if (useDisciplines && requiredDisciplines && requiredDisciplines.length > 0) {
    requiredDisciplines.forEach(reqDisc => {
      // Find all participants of this discipline who haven't been seeded yet
      const candidates = participants.filter(
        p => p.id && p.discipline && p.discipline.trim().toLowerCase() === reqDisc.trim().toLowerCase() && !seededParticipantIds.has(p.id)
      );

      if (candidates.length === 0) return;

      const shuffledCandidates = shuffleArray(candidates);
      let candidateIndex = 0;

      // Assign up to 1 candidate per group to ensure representation
      for (let gIdx = 0; gIdx < groups.length && candidateIndex < shuffledCandidates.length; gIdx++) {
        const group = groups[gIdx];

        // Check if group already has this discipline represented
        const hasRepresentation = group.members.some(
          m => m.discipline && m.discipline.trim().toLowerCase() === reqDisc.trim().toLowerCase()
        );
        if (hasRepresentation) continue;

        // Score candidates based on placement conflicts and select the best one
        let bestCandidateIdx = candidateIndex;
        let lowestConflictScore = Infinity;

        for (let cIdx = candidateIndex; cIdx < shuffledCandidates.length; cIdx++) {
          const candidate = shuffledCandidates[cIdx];
          let conflictScore = 0;

          if (avoidSamePlacements && candidate.current_placement) {
            const hasConflict = group.members.some(
              m => m.current_placement && m.current_placement.toLowerCase() === candidate.current_placement!.toLowerCase()
            );
            if (hasConflict) conflictScore += 1000;
          }

          if (conflictScore < lowestConflictScore) {
            lowestConflictScore = conflictScore;
            bestCandidateIdx = cIdx;
          }
        }

        // Swap the best candidate to the current index
        const temp = shuffledCandidates[candidateIndex];
        shuffledCandidates[candidateIndex] = shuffledCandidates[bestCandidateIdx];
        shuffledCandidates[bestCandidateIdx] = temp;

        const selected = shuffledCandidates[candidateIndex];
        group.members.push({
          name: selected.name,
          avatar: selected.avatar,
          discipline: selected.discipline || undefined,
          student_number: selected.student_number || undefined,
          current_placement: selected.current_placement || undefined,
          performance: selected.performance || undefined
        });

        if (selected.id) {
          seededParticipantIds.add(selected.id);
        }
        candidateIndex++;
      }
    });
  }

  // Filter out already seeded participants for the general queue
  const remainingParticipants = participants.filter(p => !p.id || !seededParticipantIds.has(p.id));
  let queue = shuffleArray(remainingParticipants);

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
          m => m.current_placement && m.current_placement.toLowerCase() === participant.current_placement!.toLowerCase()
        );
        if (hasPlacementConflict) {
          score += 1000; // Large penalty
        }
      }

      // 3. Discipline conflict penalty: try to maximize diversity of disciplines in each group.
      if (useDisciplines && participant.discipline) {
        const sameDisciplineCount = group.members.filter(
          m => m.discipline && m.discipline.toLowerCase() === participant.discipline!.toLowerCase()
        ).length;
        score += sameDisciplineCount * 100; // Small penalty per matching discipline
      }

      // 4. Performance balance penalty: try to distribute performance ratings ('good', 'bad') evenly
      if (participant.performance) {
        const samePerformanceCount = group.members.filter(
          m => m.performance === participant.performance
        ).length;
        score += samePerformanceCount * 2000; // Large penalty to enforce even distribution
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
      discipline: participant.discipline || undefined,
      student_number: participant.student_number || undefined,
      current_placement: participant.current_placement || undefined,
      performance: participant.performance || undefined
    });
  });

  return groups;
}
