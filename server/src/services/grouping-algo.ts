// import { SyncGroup, SyncParticipant, SyncGroupMember } from '@afda/shared/types';

export interface SyncGroupMember {
  name: string;
  avatar: string;
  discipline?: string | null;
  disciplines?: string[];
  student_number?: string | null;
  current_placement?: string | null;
  performance?: string | null;
}

export interface SyncGroup {
  id: string;
  members: SyncGroupMember[];
}

export interface SyncParticipant {
  id: string;
  session_id: string;
  name: string;
  avatar: string;
  discipline?: string | null;
  disciplines?: string[] | null;
  student_number?: string | null;
  current_placement?: string | null;
  performance?: string | null;
  joined_at: string;
}

type PerformanceRating = 'good' | 'average' | 'weak';

function normalizePerformance(value?: string | null): PerformanceRating | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (['good', 'high', 'strong', 'excellent'].includes(normalized)) return 'good';
  if (['average', 'avg', 'medium', 'mid', 'satisfactory'].includes(normalized)) return 'average';
  if (['weak', 'bad', 'low', 'poor'].includes(normalized)) return 'weak';
  return undefined;
}

function getDisciplines(person: { discipline?: string | null; disciplines?: string[] | null }): string[] {
  const values = [
    ...(person.disciplines || []),
    ...String(person.discipline || '').split(/[|;\n]+/),
  ].map(value => value.trim()).filter(Boolean);
  const seen = new Set<string>();
  return values.filter(value => {
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasDiscipline(person: { discipline?: string | null; disciplines?: string[] | null }, discipline: string): boolean {
  const target = discipline.trim().toLowerCase();
  return getDisciplines(person).some(value => value.toLowerCase() === target);
}

function toGroupMember(participant: SyncParticipant): SyncGroupMember {
  const disciplines = getDisciplines(participant);
  return {
    name: participant.name,
    avatar: participant.avatar,
    discipline: disciplines[0] || participant.discipline,
    disciplines,
    student_number: participant.student_number,
    current_placement: participant.current_placement,
    performance: normalizePerformance(participant.performance),
  };
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
        members: participants.map(toGroupMember)
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
        p => hasDiscipline(p, reqDisc) && !seededParticipantIds.has(p.id)
      );

      if (candidates.length === 0) return;

      const shuffledCandidates = shuffleArray(candidates);
      let candidateIndex = 0;

      // Assign up to 1 candidate per group to ensure representation
      for (let gIdx = 0; gIdx < groups.length && candidateIndex < shuffledCandidates.length; gIdx++) {
        const group = groups[gIdx];

        // Check if group already has this discipline represented
        const hasRepresentation = group.members.some(
          m => hasDiscipline(m, reqDisc)
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

          const performance = normalizePerformance(candidate.performance);
          if (performance) {
            conflictScore += group.members.filter(member => member.performance === performance).length * 2000;
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
        group.members.push(toGroupMember(selected));

        seededParticipantIds.add(selected.id);
        candidateIndex++;
      }
    });
  }

  // Filter out already seeded participants for the general queue
  const remainingParticipants = participants.filter(p => !seededParticipantIds.has(p.id));
  let queue = shuffleArray(remainingParticipants);

  // If using disciplines, group participants by discipline so we distribute them round-robin
  if (useDisciplines) {
    const disciplineGroups = new Map<string, SyncParticipant[]>();
    const withoutDiscipline: SyncParticipant[] = [];

    queue.forEach(p => {
      const disc = getDisciplines(p)[0];
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
      if (useDisciplines) {
        const participantDisciplines = getDisciplines(participant).map(value => value.toLowerCase());
        const disciplineOverlapCount = group.members.reduce((total, member) => {
          const memberDisciplines = getDisciplines(member).map(value => value.toLowerCase());
          return total + participantDisciplines.filter(value => memberDisciplines.includes(value)).length;
        }, 0);
        score += disciplineOverlapCount * 100;
      }

      // 4. Performance balance penalty: distribute Good, Average, and Weak ratings evenly.
      const performance = normalizePerformance(participant.performance);
      if (performance) {
        const samePerformanceCount = group.members.filter(
          (m: SyncGroupMember) => m.performance === performance
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
    groups[bestGroupIndex].members.push(toGroupMember(participant));
  });

  return groups;
}
