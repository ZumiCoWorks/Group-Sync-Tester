export type WorksuiteRole = 'operations' | 'lecturer' | 'tutor' | 'student';
export type WorksuiteMode = 'mock' | 'connected';
export type SlotLocationMode = 'allocated' | 'custom';

export type DelegationScope = 'slot-create' | 'calendar-sync' | 'full';

export type WorksuiteUser = {
  id: string;
  displayName: string;
  email: string;
  role: WorksuiteRole;
  mode: WorksuiteMode;
  venueScope?: string;
};

export type DelegationRecord = {
  id: string;
  lecturerName: string;
  lecturerEmail: string;
  tutorName: string;
  tutorEmail: string;
  scope: DelegationScope;
  note?: string;
  createdBy: string;
  createdAt: number;
  isActive: boolean;
  revokedAt?: number;
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
  batchId: string;
  venueId: string;
  venueName: string;
  locationLabel: string;
  locationMode: SlotLocationMode;
  ownerName: string;
  ownerEmail: string;
  ownerRole: Exclude<WorksuiteRole, 'student'>;
  createdBy: string;
  createdByRole: Exclude<WorksuiteRole, 'student'>;
  tutorName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'open' | 'booked';
  isPublished: boolean;
  bookedBy?: string;
  bookedByEmail?: string;
  bookingId?: string;
  publishedAt?: number;
  createdAt: number;
};

export type SlotBatch = {
  id: string;
  tutorName: string;
  ownerName: string;
  ownerEmail: string;
  ownerRole: Exclude<WorksuiteRole, 'student'>;
  createdBy: string;
  createdByRole: Exclude<WorksuiteRole, 'student'>;
  date: string;
  startTime: string;
  durationMinutes: number;
  slotCount: number;
  locationMode: SlotLocationMode;
  locationLabel: string;
  venueId: string;
  venueName: string;
  customLocation?: string;
  isPublished: boolean;
  createdAt: number;
  publishedAt?: number;
};

export type BookingRecord = {
  id: string;
  slotId: string;
  venueId: string;
  venueName: string;
  locationLabel: string;
  locationMode: SlotLocationMode;
  ownerName: string;
  ownerEmail: string;
  ownerRole: Exclude<WorksuiteRole, 'student'>;
  createdBy: string;
  createdByRole: Exclude<WorksuiteRole, 'student'>;
  studentName: string;
  studentEmail: string;
  tutorName: string;
  date: string;
  startTime: string;
  endTime: string;
  bookedAt: number;
  calendarStatus: 'mocked' | 'synced';
  calendarProvider?: 'mock' | 'cal.com' | 'microsoft-graph';
  calendarBookingUid?: string;
  calendarBookingUrl?: string | null;
  calendarMeetingUrl?: string | null;
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
  slotBatches: SlotBatch[];
  bookings: BookingRecord[];
  delegations: DelegationRecord[];
  audits: AuditRecord[];
};
