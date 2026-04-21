import { AuditRecord, WorksuiteSnapshot } from './types';

const now = Date.now();

const auditSeed: AuditRecord = {
  id: 'audit-seed',
  action: 'seeded',
  message: 'Worksuite mock store seeded for DEV_MODE.',
  createdAt: now,
};

export const mockWorksuiteSnapshot: WorksuiteSnapshot = {
  venues: [
    {
      id: 'venue-afda-main-01',
      venueId: 'VEN-101',
      roomName: 'Black Box Studio',
      building: 'Main Campus',
      campus: 'Cape Town',
      capacity: 24,
      notes: 'High contrast lighting. Best for critique sessions.',
      sourceRow: 2,
      importedAt: now,
    },
    {
      id: 'venue-afda-main-02',
      venueId: 'VEN-207',
      roomName: 'Screening Room',
      building: 'South Wing',
      campus: 'Cape Town',
      capacity: 60,
      notes: 'Reserved for assessments and live reviews.',
      sourceRow: 3,
      importedAt: now,
    },
  ],
  slots: [],
  bookings: [],
  audits: [auditSeed],
};
