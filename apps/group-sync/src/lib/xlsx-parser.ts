import * as XLSX from 'xlsx';
import { UploadedParticipant } from './types';

const AVATAR_POOL = ['⚡', '💎', '🔥', '🪐', '🧬', '💻', '🎓', '⚖️', '🏹', '🛡️', '🧪', '🔭', '🎨', '🎭', '🎪', '🎯', '🎲', '🎸', '🎺', '🎻', '🎮', '🎰', '🎱', '🎳', '🎹', '🎼', '🎾', '🎿', '🏀', '🏈', '🏉', '🏐', '🏓', '🏸', '🥊', '🥋', '🥅', '🥇', '🥈', '🥉'];

export interface ParseResult {
    success: boolean;
    participants: UploadedParticipant[];
    error?: string;
    summary?: {
        totalDataRows: number;
        parsedRows: number;
        omittedDuplicateRows: number;
        omittedMissingNameRows: number;
    };
}

type CellRow = any[];

/**
 * Find column index by matching against multiple possible names
 * Headers are already normalized to lowercase
 */
function findColumnIndex(headers: string[], possibleNames: string[]): number {
    for (const name of possibleNames) {
        const normalizedName = name.toLowerCase();
        const index = headers.findIndex(h => h === normalizedName);
        if (index !== -1) return index;
    }
    return -1;
}

/**
 * Parse an XLSX file and extract participant data
 * Supports multiple column formats:
 * - Name + Surname OR Name (full name)
 * - Programme/Program/Discipline/Major/Course/School
 * - Student Number/Student ID/ID Number
 * - Campus/Location
 */
export function parseXLSXFile(file: File): Promise<ParseResult> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) {
                    resolve({ success: false, participants: [], error: 'Failed to read file' });
                    return;
                }

                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
                resolve(parseParticipantsFromRows(jsonData));
            } catch (error) {
                console.error('Error parsing XLSX:', error);
                resolve({ success: false, participants: [], error: 'Failed to parse file. Please ensure it is a valid XLSX file.' });
            }
        };

        reader.onerror = () => {
            resolve({ success: false, participants: [], error: 'Failed to read file' });
        };

        reader.readAsBinaryString(file);
    });
}

/**
 * Parse a CSV file and extract participant data using the same rules as XLSX parsing
 */
export function parseCSVFile(file: File): Promise<ParseResult> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (typeof data !== 'string') {
                    resolve({ success: false, participants: [], error: 'Failed to read file' });
                    return;
                }

                const workbook = XLSX.read(data, { type: 'string' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
                resolve(parseParticipantsFromRows(jsonData));
            } catch (error) {
                console.error('Error parsing CSV:', error);
                resolve({ success: false, participants: [], error: 'Failed to parse file. Please ensure it is a valid CSV file.' });
            }
        };

        reader.onerror = () => {
            resolve({ success: false, participants: [], error: 'Failed to read file' });
        };

        reader.readAsText(file);
    });
}

/**
 * Parse a participant file by extension (.xlsx, .xls, .csv)
 */
export function parseParticipantFile(file: File): Promise<ParseResult> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
        return parseCSVFile(file);
    }

    if (extension === 'xlsx' || extension === 'xls') {
        return parseXLSXFile(file);
    }

    return Promise.resolve({
        success: false,
        participants: [],
        error: 'Unsupported file type. Please upload a CSV, XLSX, or XLS file.',
    });
}

function parseParticipantsFromRows(jsonData: CellRow[]): ParseResult {
    if (jsonData.length < 2) {
        return { success: false, participants: [], error: 'File must contain at least a header row and one data row' };
    }

    // Auto-detect header row by finding the row with the most non-empty cells.
    // This handles files where row 1 is a title like "BCOM Y2 CLASSLIST 2026".
    let headerRowIndex = 0;
    let maxNonEmptyCells = 0;

    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        const nonEmptyCells = row.filter((cell: any) => cell !== null && cell !== undefined && cell !== '').length;

        if (nonEmptyCells > maxNonEmptyCells && nonEmptyCells >= 3) {
            maxNonEmptyCells = nonEmptyCells;
            headerRowIndex = i;
        }
    }

    console.log(`Auto-detected header row at index ${headerRowIndex} (row ${headerRowIndex + 1})`);

    // Get headers and normalize them
    const headers = jsonData[headerRowIndex].map((h: any) => String(h).toLowerCase().trim());
    console.log('Detected headers:', headers);

    // Find column indices for various possible column names
    const nameIndex = findColumnIndex(headers, ['name', 'first name', 'firstname', 'given name']);
    const surnameIndex = findColumnIndex(headers, ['surname', 'last name', 'lastname', 'family name']);
    const disciplineIndex = findColumnIndex(headers, ['programme', 'program', 'discipline', 'major', 'course', 'school']);
    const studentNumberIndex = findColumnIndex(headers, ['student number', 'student id', 'id number', 'student no', 'snumber']);

    console.log('Column indices:', { nameIndex, surnameIndex, disciplineIndex, studentNumberIndex });

    // Name is required - either as a single column or Name + Surname
    if (nameIndex === -1 && surnameIndex === -1) {
        console.error('No name or surname column found. Headers:', headers);
        return {
            success: false,
            participants: [],
            error: `File must contain at least a "Name" column or "Name" and "Surname" columns. Found columns: ${headers.join(', ')}`,
        };
    }

    // Parse participants (start from row after header)
    const dataStartRow = headerRowIndex + 1;
    const participants: UploadedParticipant[] = [];
    const seenIdentifiers = new Set<string>();
    let totalDataRows = 0;
    let omittedDuplicateRows = 0;
    let omittedMissingNameRows = 0;

    for (let i = dataStartRow; i < jsonData.length; i++) {
        const row = jsonData[i];

        // Skip completely empty rows
        if (!row || row.every((cell: any) => !cell || String(cell).trim() === '')) {
            continue;
        }
        totalDataRows++;

        // Build full name
        let fullName = '';
        if (nameIndex !== -1 && row[nameIndex]) {
            fullName = String(row[nameIndex]).trim();
        }
        if (surnameIndex !== -1 && row[surnameIndex]) {
            const surname = String(row[surnameIndex]).trim();
            fullName = fullName ? `${fullName} ${surname}` : surname;
        }

        // Skip if no name
        if (!fullName) {
            omittedMissingNameRows++;
            continue;
        }

        // Dedupe by student number when present, otherwise fallback to full name.
        let identifier = fullName;
        if (studentNumberIndex !== -1 && row[studentNumberIndex]) {
            const studentNumber = String(row[studentNumberIndex]).trim();
            if (studentNumber) {
                identifier = studentNumber;
            }
        }

        if (seenIdentifiers.has(identifier)) {
            omittedDuplicateRows++;
            continue;
        }
        seenIdentifiers.add(identifier);

        const participant: UploadedParticipant = {
            name: fullName,
        };

        // Add discipline/programme if available
        if (disciplineIndex !== -1 && row[disciplineIndex]) {
            participant.discipline = String(row[disciplineIndex]).trim();
        }

        participants.push(participant);
    }

    if (participants.length === 0) {
        return { success: false, participants: [], error: 'No valid participants found in file' };
    }

    return {
        success: true,
        participants,
        summary: {
            totalDataRows,
            parsedRows: participants.length,
            omittedDuplicateRows,
            omittedMissingNameRows,
        },
    };
}

/**
 * Get a random avatar from the pool
 */
export function getRandomAvatar(index: number): string {
    return AVATAR_POOL[index % AVATAR_POOL.length];
}

/**
 * Validate uploaded participant data
 */
export function validateParticipants(participants: UploadedParticipant[]): { valid: boolean; error?: string } {
    if (participants.length === 0) {
        return { valid: false, error: 'No participants to upload' };
    }

    if (participants.length > 200) {
        return { valid: false, error: 'Maximum 200 participants allowed per upload' };
    }

    // Duplicates are now handled during parsing, so we don't need to check again

    return { valid: true };
}
