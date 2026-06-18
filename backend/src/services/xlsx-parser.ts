import xlsx from 'xlsx';

export interface ParsedStudent {
  name: string;
  studentNumber?: string;
  discipline?: string;
  currentPlacement?: string;
}

export interface ParseRosterResult {
  success: boolean;
  students: ParsedStudent[];
  error?: string;
  summary?: {
    totalStudents: number;
    withDiscipline: number;
    withPlacement: number;
  };
}

const normalizeHeader = (val: any): string => 
  String(val ?? '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '');

function findColumnIndex(headers: string[], candidates: string[]): number {
  // First look for exact match
  const exactIdx = headers.findIndex(header => candidates.includes(header));
  if (exactIdx !== -1) return exactIdx;

  // Fallback to partial match, ensuring candidate 'name' doesn't match 'surname'
  return headers.findIndex(header => 
    candidates.some(candidate => {
      if (candidate === 'name' && header.includes('surname')) {
        return false;
      }
      return header.includes(candidate) || candidate.includes(header);
    })
  );
}

function autoDetectHeaderRow(rows: any[][]): number {
  let headerRowIndex = 0;
  let maxNonEmptyCells = 0;

  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    const nonEmptyCells = row.filter((cell: any) => cell !== null && cell !== undefined && String(cell).trim() !== '').length;

    if (nonEmptyCells > maxNonEmptyCells && nonEmptyCells >= 2) {
      maxNonEmptyCells = nonEmptyCells;
      headerRowIndex = i;
    }
  }
  return headerRowIndex;
}

export function parseRosterExcel(buffer: Buffer): ParseRosterResult {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    if (workbook.SheetNames.length === 0) {
      return { success: false, students: [], error: 'Excel workbook contains no sheets.' };
    }

    // Identify sheets: Tab 1 = Class List, Tab 2 = Current Placements
    let classListSheetName = workbook.SheetNames[0];
    let placementsSheetName = workbook.SheetNames.length > 1 ? workbook.SheetNames[1] : undefined;

    // Scan sheet names for explicit matches
    for (const name of workbook.SheetNames) {
      const lower = name.toLowerCase();
      if (lower.includes('placement') || lower.includes('team') || lower.includes('group') || lower.includes('current')) {
        placementsSheetName = name;
      } else if (lower.includes('class') || lower.includes('student') || lower.includes('roster')) {
        classListSheetName = name;
      }
    }

    const classListSheet = workbook.Sheets[classListSheetName];
    const classListRows = xlsx.utils.sheet_to_json<any[]>(classListSheet, { header: 1, defval: '' });

    if (classListRows.length < 2) {
      return { success: false, students: [], error: 'Class list sheet is empty or contains no data.' };
    }

    // Parse Class List (Tab 1)
    const clHeaderIdx = autoDetectHeaderRow(classListRows);
    const clHeaders = classListRows[clHeaderIdx].map(normalizeHeader);

    const firstNameCol = findColumnIndex(clHeaders, ['first name', 'given name', 'name']);
    const lastNameCol = findColumnIndex(clHeaders, ['last name', 'surname', 'family name']);
    const studentNumCol = findColumnIndex(clHeaders, ['student number', 'student id', 'student no', 'id number', 'snumber']);
    const disciplineCol = findColumnIndex(clHeaders, ['programme', 'program', 'discipline', 'major', 'course', 'school', 'stream']);

    if (firstNameCol === -1 && lastNameCol === -1) {
      return { 
        success: false, 
        students: [], 
        error: `Could not find a name column in sheet "${classListSheetName}". Headers: ${clHeaders.join(', ')}` 
      };
    }

    const studentsMap = new Map<string, ParsedStudent>(); // Map by student number
    const studentsByNameMap = new Map<string, ParsedStudent>(); // Map by clean name for fallbacks

    for (let i = clHeaderIdx + 1; i < classListRows.length; i++) {
      const row = classListRows[i];
      if (!row || row.every(cell => String(cell ?? '').trim() === '')) continue;

      let firstName = firstNameCol !== -1 ? String(row[firstNameCol] ?? '').trim() : '';
      let lastName = lastNameCol !== -1 ? String(row[lastNameCol] ?? '').trim() : '';
      let fullName = `${firstName} ${lastName}`.trim();
      
      // Fallback if columns are merged or name is single column
      if (!fullName && firstNameCol !== -1) fullName = String(row[firstNameCol] ?? '').trim();
      if (!fullName) continue;

      const studentNumber = studentNumCol !== -1 ? String(row[studentNumCol] ?? '').trim() : undefined;
      const discipline = disciplineCol !== -1 ? String(row[disciplineCol] ?? '').trim() : undefined;

      const student: ParsedStudent = {
        name: fullName,
        studentNumber,
        discipline,
      };

      if (studentNumber) {
        studentsMap.set(studentNumber.toLowerCase(), student);
      }
      studentsByNameMap.set(fullName.toLowerCase(), student);
    }

    // Parse Current Placements (Tab 2) if it exists
    if (placementsSheetName && workbook.Sheets[placementsSheetName]) {
      const placementsSheet = workbook.Sheets[placementsSheetName];
      const placementsRows = xlsx.utils.sheet_to_json<any[]>(placementsSheet, { header: 1, defval: '' });

      if (placementsRows.length > 1) {
        const plHeaderIdx = autoDetectHeaderRow(placementsRows);
        const plHeaders = placementsRows[plHeaderIdx].map(normalizeHeader);

        const plStudentNumCol = findColumnIndex(plHeaders, ['student number', 'student id', 'student no', 'id number', 'snumber']);
        const plFirstNameCol = findColumnIndex(plHeaders, ['first name', 'given name', 'name']);
        const plLastNameCol = findColumnIndex(plHeaders, ['last name', 'surname', 'family name']);
        const teamCol = findColumnIndex(plHeaders, ['team', 'group', 'placement', 'current team', 'current group']);

        if (teamCol !== -1) {
          for (let i = plHeaderIdx + 1; i < placementsRows.length; i++) {
            const row = placementsRows[i];
            if (!row || row.every(cell => String(cell ?? '').trim() === '')) continue;

            const studentNumber = plStudentNumCol !== -1 ? String(row[plStudentNumCol] ?? '').trim() : undefined;
            const firstName = plFirstNameCol !== -1 ? String(row[plFirstNameCol] ?? '').trim() : '';
            const lastName = plLastNameCol !== -1 ? String(row[plLastNameCol] ?? '').trim() : '';
            let fullName = `${firstName} ${lastName}`.trim();
            if (!fullName && plFirstNameCol !== -1) fullName = String(row[plFirstNameCol] ?? '').trim();

            const placement = String(row[teamCol] ?? '').trim();
            if (!placement) continue;

            // Try to match student
            let matchedStudent: ParsedStudent | undefined;

            if (studentNumber) {
              matchedStudent = studentsMap.get(studentNumber.toLowerCase());
            }

            if (!matchedStudent && fullName) {
              matchedStudent = studentsByNameMap.get(fullName.toLowerCase());
            }

            if (matchedStudent) {
              matchedStudent.currentPlacement = placement;
            } else if (fullName) {
              // Student in placements tab but not class list. Add them anyway.
              const newStudent: ParsedStudent = {
                name: fullName,
                studentNumber,
                currentPlacement: placement,
              };
              if (studentNumber) {
                studentsMap.set(studentNumber.toLowerCase(), newStudent);
              }
              studentsByNameMap.set(fullName.toLowerCase(), newStudent);
            }
          }
        }
      }
    }

    const uniqueStudents = Array.from(studentsByNameMap.values());
    const withDiscipline = uniqueStudents.filter(s => !!s.discipline).length;
    const withPlacement = uniqueStudents.filter(s => !!s.currentPlacement).length;

    return {
      success: true,
      students: uniqueStudents,
      summary: {
        totalStudents: uniqueStudents.length,
        withDiscipline,
        withPlacement,
      }
    };
  } catch (error: any) {
    console.error('Error parsing Excel roster:', error);
    return { success: false, students: [], error: error?.message || 'Failed to parse Excel file.' };
  }
}
