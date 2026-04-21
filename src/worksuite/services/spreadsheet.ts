import * as XLSX from 'xlsx';
import { SpreadsheetPreview, VenueColumnMapping, VenueRecord } from '../types';

const SPREADSHEET_ALIASES: Record<keyof VenueColumnMapping, string[]> = {
  venueId: ['venue id', 'room id', 'room code', 'venue_id', 'room name code'],
  roomName: ['room name', 'venue name', 'space name', 'room'],
  building: ['building', 'block', 'site', 'facility'],
  campus: ['campus', 'location', 'branch'],
  capacity: ['capacity', 'seats', 'seat count', 'max occupancy'],
  notes: ['notes', 'remarks', 'comment', 'comments', 'description'],
};

function normalise(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function findHeaderRow(rows: string[][]) {
  let headerRowIndex = 0;
  let maxNonEmptyCells = 0;

  for (let index = 0; index < Math.min(rows.length, 10); index += 1) {
    const row = rows[index];
    const nonEmptyCells = row.filter((cell) => normalise(cell).length > 0).length;

    if (nonEmptyCells >= 2 && nonEmptyCells > maxNonEmptyCells) {
      maxNonEmptyCells = nonEmptyCells;
      headerRowIndex = index;
    }
  }

  return headerRowIndex;
}

function readSpreadsheet(file: File) {
  return new Promise<SpreadsheetPreview>((resolve, reject) => {
    const reader = new FileReader();
    const isCsv = file.name.toLowerCase().endsWith('.csv');

    reader.onload = (event) => {
      try {
        const raw = event.target?.result;
        const workbook = XLSX.read(raw, { type: isCsv ? 'string' : 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        const headerRowIndex = findHeaderRow(rows);
        const headers = (rows[headerRowIndex] || []).map((cell) => String(cell ?? '').trim());

        resolve({
          sourceName: file.name,
          headers,
          rows: rows.slice(headerRowIndex + 1).filter((row) => row.some((cell) => normalise(cell).length > 0)),
          headerRowIndex,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read spreadsheet'));

    if (isCsv) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  });
}

export async function parseVenueSpreadsheet(file: File) {
  return readSpreadsheet(file);
}

export function autoMapVenueColumns(headers: string[]): VenueColumnMapping {
  const headerIndexes = headers.map((header) => normalise(header));

  const pick = (aliases: string[]) => {
    for (const alias of aliases) {
      const index = headerIndexes.findIndex((header) => header === alias || header.includes(alias));
      if (index !== -1) {
        return headers[index];
      }
    }

    return headers[0] || '';
  };

  return {
    venueId: pick(SPREADSHEET_ALIASES.venueId),
    roomName: pick(SPREADSHEET_ALIASES.roomName),
    building: pick(SPREADSHEET_ALIASES.building),
    campus: pick(SPREADSHEET_ALIASES.campus),
    capacity: pick(SPREADSHEET_ALIASES.capacity),
    notes: pick(SPREADSHEET_ALIASES.notes),
  };
}

export function buildVenueRecords(rows: string[][], headers: string[], mapping: VenueColumnMapping): VenueRecord[] {
  const headerIndexByName = new Map(headers.map((header, index) => [normalise(header), index]));
  const importedAt = Date.now();
  const venues: VenueRecord[] = [];

  rows.forEach((row, rowOffset) => {
    const getValue = (columnName: string) => {
      const index = headerIndexByName.get(normalise(columnName));
      if (index === undefined) return '';
      return String(row[index] ?? '').trim();
    };

    const roomName = getValue(mapping.roomName);
    const venueId = getValue(mapping.venueId) || roomName || `venue-${rowOffset + 1}`;

    if (!roomName && !venueId) {
      return;
    }

    const capacityRaw = getValue(mapping.capacity);
    const capacity = Number.parseInt(capacityRaw, 10);

    venues.push({
      id: `${venueId}-${rowOffset + 1}`.replace(/\s+/g, '-').toLowerCase(),
      venueId,
      roomName: roomName || venueId,
      building: getValue(mapping.building),
      campus: getValue(mapping.campus),
      capacity: Number.isFinite(capacity) ? capacity : 0,
      notes: getValue(mapping.notes),
      sourceRow: rowOffset + 1,
      importedAt,
    });
  });

  return venues;
}
