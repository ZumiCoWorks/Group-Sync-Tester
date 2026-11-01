import xlsx from 'xlsx';

export type PerformanceRating = 'good' | 'average' | 'weak';

export interface ParsedStudent {
  name: string;
  studentNumber?: string;
  /** First discipline retained for compatibility with older sessions. */
  discipline?: string;
  /** Complete, de-duplicated history of disciplines found across the workbook. */
  disciplines: string[];
  currentPlacement?: string;
  performance?: PerformanceRating;
}

export interface ParseRosterResult {
  success: boolean;
  students: ParsedStudent[];
  error?: string;
  summary?: {
    totalStudents: number;
    withDiscipline: number;
    disciplineAssignments: number;
    withPlacement: number;
    withPerformance: number;
  };
}

const NAME_HEADERS = ['first name', 'given name', 'name'];
const LAST_NAME_HEADERS = ['last name', 'surname', 'family name'];
const STUDENT_NUMBER_HEADERS = ['student number', 'student id', 'student no', 'id number', 'snumber'];
const DISCIPLINE_HEADERS = ['programme', 'program', 'discipline', 'major', 'course', 'school', 'stream'];
const PERFORMANCE_HEADERS = ['performance', 'rating', 'grade', 'rank', 'evaluation', 'level'];
const PLACEMENT_HEADERS = ['team', 'group', 'placement', 'current team', 'current group'];

const normalizeHeader = (value: unknown): string =>
  String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '');

function headerMatches(header: string, candidates: string[]): boolean {
  return candidates.some(candidate => {
    if (candidate === 'name' && header.includes('surname')) return false;
    return header === candidate || header.startsWith(`${candidate} `) || header.endsWith(` ${candidate}`);
  });
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  return headers.findIndex(header => headerMatches(header, candidates));
}

function findColumnIndices(headers: string[], candidates: string[]): number[] {
  return headers.reduce<number[]>((indices, header, index) => {
    if (headerMatches(header, candidates)) indices.push(index);
    return indices;
  }, []);
}

function autoDetectHeaderRow(rows: unknown[][]): number {
  let headerRowIndex = 0;
  let maxRecognizedHeaders = -1;
  let maxNonEmptyCells = 0;
  const knownHeaders = [
    ...NAME_HEADERS,
    ...LAST_NAME_HEADERS,
    ...STUDENT_NUMBER_HEADERS,
    ...DISCIPLINE_HEADERS,
    ...PERFORMANCE_HEADERS,
    ...PLACEMENT_HEADERS,
  ];

  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i] || [];
    const normalized = row.map(normalizeHeader);
    const recognizedHeaders = normalized.filter(header => headerMatches(header, knownHeaders)).length;
    const nonEmptyCells = normalized.filter(Boolean).length;

    if (
      recognizedHeaders > maxRecognizedHeaders ||
      (recognizedHeaders === maxRecognizedHeaders && nonEmptyCells > maxNonEmptyCells)
    ) {
      maxRecognizedHeaders = recognizedHeaders;
      maxNonEmptyCells = nonEmptyCells;
      headerRowIndex = i;
    }
  }

  return headerRowIndex;
}

export function normalizePerformance(value: unknown): PerformanceRating | undefined {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return undefined;

  if (['good', 'high', 'strong', 'excellent'].some(term => normalized === term || normalized.includes(term))) {
    return 'good';
  }
  if (['average', 'avg', 'medium', 'mid', 'satisfactory'].some(term => normalized === term || normalized.includes(term))) {
    return 'average';
  }
  // Keep accepting the old "bad" vocabulary, but store it as the new Weak rating.
  if (['weak', 'bad', 'low', 'poor'].some(term => normalized === term || normalized.includes(term))) {
    return 'weak';
  }

  return undefined;
}

function parseDisciplineValues(values: unknown[]): string[] {
  const disciplines = values.flatMap(value =>
    String(value ?? '')
      .split(/[|;\n]+/)
      .map(item => item.trim())
      .filter(Boolean)
  );

  const seen = new Set<string>();
  return disciplines.filter(discipline => {
    const key = discipline.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeDisciplines(existing: string[], incoming: string[]): string[] {
  return parseDisciplineValues([...existing, ...incoming]);
}

function readName(row: unknown[], firstNameCol: number, lastNameCol: number): string {
  const firstName = firstNameCol !== -1 ? String(row[firstNameCol] ?? '').trim() : '';
  const lastName = lastNameCol !== -1 ? String(row[lastNameCol] ?? '').trim() : '';
  return `${firstName} ${lastName}`.trim();
}

export function parseRosterExcel(buffer: Buffer): ParseRosterResult {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    if (workbook.SheetNames.length === 0) {
      return { success: false, students: [], error: 'Excel workbook contains no sheets.' };
    }

    let classListSheetName = workbook.SheetNames[0];
    const namedClassList = workbook.SheetNames.find(name => /class|roster/i.test(name));
    if (namedClassList) classListSheetName = namedClassList;

    const students: ParsedStudent[] = [];
    const studentsByNumber = new Map<string, ParsedStudent>();
    const studentsByName = new Map<string, ParsedStudent>();

    const findStudent = (studentNumber: string, name: string): ParsedStudent | undefined => {
      if (studentNumber) {
        const byNumber = studentsByNumber.get(studentNumber.toLowerCase());
        if (byNumber) return byNumber;
      }
      return name ? studentsByName.get(name.toLowerCase()) : undefined;
    };

    const indexStudent = (student: ParsedStudent) => {
      if (!students.includes(student)) students.push(student);
      if (student.studentNumber) studentsByNumber.set(student.studentNumber.toLowerCase(), student);
      if (student.name) studentsByName.set(student.name.toLowerCase(), student);
    };

    const mergeStudent = (incoming: ParsedStudent): ParsedStudent => {
      const existing = findStudent(incoming.studentNumber || '', incoming.name);
      if (!existing) {
        incoming.discipline = incoming.disciplines[0];
        indexStudent(incoming);
        return incoming;
      }

      existing.disciplines = mergeDisciplines(existing.disciplines, incoming.disciplines);
      existing.discipline = existing.disciplines[0];
      existing.studentNumber ||= incoming.studentNumber;
      existing.currentPlacement = incoming.currentPlacement || existing.currentPlacement;
      existing.performance = incoming.performance || existing.performance;
      indexStudent(existing);
      return existing;
    };

    const parseSheet = (sheetName: string, requireName: boolean) => {
      const rows = xlsx.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: '' });
      if (rows.length < 2) return;

      const headerIndex = autoDetectHeaderRow(rows);
      const headers = rows[headerIndex].map(normalizeHeader);
      const firstNameCol = findColumnIndex(headers, NAME_HEADERS);
      const lastNameCol = findColumnIndex(headers, LAST_NAME_HEADERS);
      const studentNumberCol = findColumnIndex(headers, STUDENT_NUMBER_HEADERS);
      const disciplineCols = findColumnIndices(headers, DISCIPLINE_HEADERS);
      const performanceCol = findColumnIndex(headers, PERFORMANCE_HEADERS);
      const placementCol = findColumnIndex(headers, PLACEMENT_HEADERS);

      if (requireName && firstNameCol === -1 && lastNameCol === -1) {
        throw new Error(`Could not find a name column in sheet "${sheetName}". Headers: ${headers.join(', ')}`);
      }

      const hasStudentIdentity = studentNumberCol !== -1 || firstNameCol !== -1 || lastNameCol !== -1;
      const hasUsefulHistory = disciplineCols.length > 0 || performanceCol !== -1 || placementCol !== -1;
      if (!hasStudentIdentity || (!requireName && !hasUsefulHistory)) return;

      for (let i = headerIndex + 1; i < rows.length; i++) {
        const row = rows[i] || [];
        if (row.every(cell => String(cell ?? '').trim() === '')) continue;

        const name = readName(row, firstNameCol, lastNameCol);
        const studentNumber = studentNumberCol !== -1 ? String(row[studentNumberCol] ?? '').trim() : '';
        const matchedStudent = findStudent(studentNumber, name);
        if (!matchedStudent && !name) continue;

        const disciplines = parseDisciplineValues(disciplineCols.map(column => row[column]));
        const performance = performanceCol !== -1 ? normalizePerformance(row[performanceCol]) : undefined;
        const currentPlacement = placementCol !== -1 ? String(row[placementCol] ?? '').trim() || undefined : undefined;

        mergeStudent({
          name: name || matchedStudent!.name,
          studentNumber: studentNumber || matchedStudent?.studentNumber,
          disciplines,
          currentPlacement,
          performance,
        });
      }
    };

    parseSheet(classListSheetName, true);
    for (const sheetName of workbook.SheetNames) {
      if (sheetName !== classListSheetName) parseSheet(sheetName, false);
    }

    if (students.length === 0) {
      return { success: false, students: [], error: 'No valid students were found in the workbook.' };
    }

    const withDiscipline = students.filter(student => student.disciplines.length > 0).length;
    const disciplineAssignments = students.reduce((total, student) => total + student.disciplines.length, 0);
    const withPlacement = students.filter(student => !!student.currentPlacement).length;
    const withPerformance = students.filter(student => !!student.performance).length;

    return {
      success: true,
      students,
      summary: {
        totalStudents: students.length,
        withDiscipline,
        disciplineAssignments,
        withPlacement,
        withPerformance,
      },
    };
  } catch (error: any) {
    console.error('Error parsing roster:', error);
    return { success: false, students: [], error: error?.message || 'Failed to parse roster file.' };
  }
}
