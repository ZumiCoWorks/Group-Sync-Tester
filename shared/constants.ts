/**
 * Shared constants across all packages
 */

// User roles
export const USER_ROLES = {
  STUDENT: 'student',
  STAFF: 'staff',
  LECTURER: 'lecturer',
  OPS: 'ops',
  ADMIN: 'admin',
  INTEGRATOR: 'integrator',
} as const;

export const STAFF_ROLES = ['staff', 'lecturer', 'admin'] as const;
export const OPS_ROLES = ['ops', 'admin'] as const;
export const ADMIN_ROLES = ['admin'] as const;

// Batch statuses
export const BATCH_STATUS = {
  DRAFT: 'draft',
  PENDING_VENUE_APPROVAL: 'pending_venue_approval',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  CLOSED: 'closed',
} as const;

// Booking statuses
export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  WAITLISTED: 'waitlisted',
  CANCELLED: 'cancelled',
  ATTENDED: 'attended',
} as const;

// Audit actions
export const AUDIT_ACTIONS = {
  BATCH_CREATED: 'batch_created',
  BATCH_PUBLISHED: 'batch_published',
  BATCH_EDITED: 'batch_edited',
  BATCH_ARCHIVED: 'batch_archived',
  BATCH_CLOSED: 'batch_closed',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_REASSIGNED: 'booking_reassigned',
  BOOKING_MARKED_ATTENDED: 'booking_marked_attended',
  BOOKING_WAITLISTED: 'booking_waitlisted',
  IMPORT_STARTED: 'import_started',
  IMPORT_COMPLETED: 'import_completed',
  IMPORT_FAILED: 'import_failed',
  VENUE_APPROVED: 'venue_approved',
  VENUE_DECLINED: 'venue_declined',
  ROLE_ASSIGNED: 'role_assigned',
  ROLE_REVOKED: 'role_revoked',
  DATA_EXPORTED: 'data_exported',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error codes
export const ERROR_CODES = {
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SLOT_FULL: 'SLOT_FULL',
  BATCH_FULL: 'BATCH_FULL',
  BATCH_NOT_FOUND: 'BATCH_NOT_FOUND',
  BATCH_NOT_AVAILABLE: 'BATCH_NOT_AVAILABLE',
  SLOT_NOT_FOUND: 'SLOT_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DB_ERROR: 'DB_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  BATCH_PUBLISHED: 'batch_published',
  BATCH_CLOSED: 'batch_closed',
  IMPORT_COMPLETED: 'import_completed',
  IMPORT_FAILED: 'import_failed',
  VENUE_APPROVED: 'venue_approved',
  VENUE_DECLINED: 'venue_declined',
  ROLE_ASSIGNED: 'role_assigned',
} as const;

// Time constants (in milliseconds)
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
} as const;

// Validation constraints
export const VALIDATION = {
  MIN_BATCH_TITLE_LENGTH: 3,
  MAX_BATCH_TITLE_LENGTH: 255,
  MIN_SLOT_DURATION_MINUTES: 15,
  MAX_SLOT_DURATION_MINUTES: 480, // 8 hours
  MIN_CAPACITY: 1,
  MAX_CAPACITY: 1000,
} as const;
