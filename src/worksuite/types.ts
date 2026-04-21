export type WorksuiteRole = 'staff' | 'student';
export type WorksuiteMode = 'mock' | 'connected';

export type WorksuiteUser = {
  id: string;
  displayName: string;
  email: string;
  role: WorksuiteRole;
  mode: WorksuiteMode;
  venueScope?: string;
};

export type VenueRecord = {
  id: string;
  venueId: string;
  roomName: string;
  building: string;
  campus: string;
  capacity: number;
  notes?: string;
  sourceRow: number;
  importedAt: number;
};

export type VenueColumnKey = 'venueId' | 'roomName' | 'building' | 'campus' | 'capacity' | 'notes';
export type VenueColumnMapping = Record<VenueColumnKey, string>;

export type SpreadsheetPreview = {
  sourceName: string;
  headers: string[];
  rows: string[][];
  headerRowIndex: number;
};

export type SlotRecord = {
  id: string;
  venueId: string;
  venueName: string;
  tutorName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'open' | 'booked';
  bookedBy?: string;
  bookedByEmail?: string;
  createdAt: number;
};

export type BookingRecord = {
  id: string;
  slotId: string;
  venueId: string;
  venueName: string;
  studentName: string;
  studentEmail: string;
  tutorName: string;
  date: string;
  startTime: string;
  endTime: string;
  bookedAt: number;
  calendarStatus: 'mocked' | 'synced';
};

export type AuditRecord = {
  id: string;
  action: string;
  message: string;
  createdAt: number;
};

export type WorksuiteSnapshot = {
  venues: VenueRecord[];
  slots: SlotRecord[];
  bookings: BookingRecord[];
  audits: AuditRecord[];
};
