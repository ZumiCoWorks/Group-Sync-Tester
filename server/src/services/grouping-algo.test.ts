import { generateGroups } from './grouping-algo';
import { SyncParticipant } from '@afda/shared/types';

describe('grouping-algo', () => {
  const mockParticipants: SyncParticipant[] = [
    { id: '1', session_id: 's1', name: 'Alice', avatar: '🐱', discipline: 'Finance', current_placement: 'Team A', joined_at: new Date().toISOString() },
    { id: '2', session_id: 's1', name: 'Bob', avatar: '🐶', discipline: 'Finance', current_placement: 'Team A', joined_at: new Date().toISOString() },
    { id: '3', session_id: 's1', name: 'Charlie', avatar: '🦊', discipline: 'Marketing', current_placement: 'Team B', joined_at: new Date().toISOString() },
    { id: '4', session_id: 's1', name: 'David', avatar: '🦁', discipline: 'Marketing', current_placement: 'Team B', joined_at: new Date().toISOString() },
    { id: '5', session_id: 's1', name: 'Eve', avatar: '🐸', discipline: 'Design', current_placement: 'Team C', joined_at: new Date().toISOString() },
    { id: '6', session_id: 's1', name: 'Frank', avatar: '🐼', discipline: 'Design', current_placement: 'Team C', joined_at: new Date().toISOString() },
  ];

  it('should return empty list if participants are empty', () => {
    const result = generateGroups([], { groupCount: 2, useDisciplines: true, avoidSamePlacements: true });
    expect(result).toEqual([]);
  });

  it('should group participants into requested number of groups', () => {
    const result = generateGroups(mockParticipants, { groupCount: 3, useDisciplines: false, avoidSamePlacements: false });
    expect(result.length).toBe(3);
    expect(result.reduce((sum, g) => sum + g.members.length, 0)).toBe(6);
  });

  it('should balance disciplines when useDisciplines is true', () => {
    const result = generateGroups(mockParticipants, { groupCount: 2, useDisciplines: true, avoidSamePlacements: false });
    expect(result.length).toBe(2);
    
    // Each group should get 3 members and should be balanced
    result.forEach(group => {
      expect(group.members.length).toBe(3);
      // Disciplines should be distributed. No group should contain 2 of the same discipline if we have 3 disciplines of size 2 each.
      const disciplines = group.members.map(m => m.discipline);
      const uniqueDisciplines = new Set(disciplines);
      expect(uniqueDisciplines.size).toBe(3); // Alice & Bob (Finance) are split, Charlie & David (Marketing) are split, Eve & Frank (Design) are split.
    });
  });

  it('should avoid same placements when avoidSamePlacements is true', () => {
    const result = generateGroups(mockParticipants, { groupCount: 2, useDisciplines: false, avoidSamePlacements: true });
    expect(result.length).toBe(2);

    result.forEach(group => {
      expect(group.members.length).toBe(3);
      // Placements should be split. Alice (Team A) and Bob (Team A) should not be in the same group.
      const placements = group.members.map(m => m.current_placement);
      const uniquePlacements = new Set(placements);
      expect(uniquePlacements.size).toBe(3);
    });
  });
});
