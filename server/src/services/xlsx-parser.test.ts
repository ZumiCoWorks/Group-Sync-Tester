import xlsx from 'xlsx';
import { parseRosterExcel } from './xlsx-parser';

describe('xlsx-parser', () => {
  it('should parse and merge roster data from a two-tab Excel structure', () => {
    // 1. Create a mock workbook in memory
    const wb = xlsx.utils.book_new();

    // Tab 1: Class List
    const classListData = [
      ['First Name', 'Last Name', 'Student Number', 'Discipline'],
      ['Alice', 'Smith', 'STU001', 'Finance'],
      ['Bob', 'Jones', 'STU002', 'Marketing'],
      ['Charlie', 'Brown', 'STU003', 'Design'],
    ];
    const ws1 = xlsx.utils.aoa_to_sheet(classListData);
    xlsx.utils.book_append_sheet(wb, ws1, 'Class List');

    // Tab 2: Current Placements
    const placementData = [
      ['Student Number', 'Current Team'],
      ['STU001', 'Team Alpha'],
      ['STU002', 'Team Beta'],
      ['STU003', 'Team Alpha'],
    ];
    const ws2 = xlsx.utils.aoa_to_sheet(placementData);
    xlsx.utils.book_append_sheet(wb, ws2, 'Current Placements');

    // 2. Write workbook to a buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // 3. Parse and assert
    const result = parseRosterExcel(buffer);

    expect(result.success).toBe(true);
    expect(result.students.length).toBe(3);
    
    const alice = result.students.find(s => s.studentNumber === 'STU001');
    expect(alice).toBeDefined();
    expect(alice?.name).toBe('Alice Smith');
    expect(alice?.discipline).toBe('Finance');
    expect(alice?.currentPlacement).toBe('Team Alpha');

    const bob = result.students.find(s => s.studentNumber === 'STU002');
    expect(bob?.name).toBe('Bob Jones');
    expect(bob?.discipline).toBe('Marketing');
    expect(bob?.currentPlacement).toBe('Team Beta');

    expect(result.summary).toEqual({
      totalStudents: 3,
      withDiscipline: 3,
      withPlacement: 3,
    });
  });

  it('should handle missing placements tab gracefully', () => {
    const wb = xlsx.utils.book_new();
    const classListData = [
      ['First Name', 'Last Name', 'Student ID', 'Major'],
      ['Ada', 'Lovelace', 'STU100', 'Computer Science'],
    ];
    const ws1 = xlsx.utils.aoa_to_sheet(classListData);
    xlsx.utils.book_append_sheet(wb, ws1, 'Class List');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const result = parseRosterExcel(buffer);

    expect(result.success).toBe(true);
    expect(result.students.length).toBe(1);
    expect(result.students[0].name).toBe('Ada Lovelace');
    expect(result.students[0].discipline).toBe('Computer Science');
    expect(result.students[0].currentPlacement).toBeUndefined();
  });
});
