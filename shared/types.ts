/**
 * Shared types across backend and frontend apps.
 * This file is referenced by all packages in the monorepo.
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export type UserRole = 'student' | 'staff' | 'lecturer' | 'ops' | 'admin' | 'integrator';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  domain?: string; // Institution domain (e.g., 'university.edu')
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Batch & Slot Types
// ============================================================================

export type BatchStatus = 'draft' | 'pending_venue_approval' | 'published' | 'archived' | 'closed';
export type SlotStatus = 'available' | 'full' | 'expired';

export interface Slot {
  id: string;
  batchId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  capacity: number; // Capacity per slot
  bookingCount: number; // Current bookings
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  title: string;
  description?: string;
  createdByUserId: string;
  createdByUser?: User; // Populated on fetch
  status: BatchStatus;
  venueId?: string;
  venue?: Venue;
  dateRange: {
    start: string; // ISO 8601
    end: string; // ISO 8601
  };
  slotDuration: number; // Minutes (e.g., 60)
  perSlotCapacity: number; // Capacity per slot (usually 1)
  batchCapacity?: number; // Max total bookings across all slots
  slots?: Slot[];
  bookingCount: number;
  totalSlots: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// ============================================================================
// Booking Types
// ============================================================================

export type BookingStatus = 'confirmed' | 'waitlisted' | 'cancelled' | 'attended';

export interface Booking {
  id: string;
  slotId: string;
  slot?: Slot;
  batchId: string;
  batch?: Batch;
  studentId?: string; // For registered students
  studentName: string;
  studentEmail: string;
  studentId_external?: string; // For imported participants
  status: BookingStatus;
  confirmationNumber: string;
  bookedAt: string;
  createdAt: string;
  updatedAt: string;
  markedAttendedat?: string;
}

// ============================================================================
// Venue Types
// ============================================================================

export interface Venue {
  id: string;
  name: string;
  address: string;
  capacity: number;
  facilities: string[]; // e.g., ['projector', 'whiteboard', 'wifi']
  contactEmail: string;
  contactPhone?: string;
  opsOwnerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VenueAvailability {
  id: string;
  venueId: string;
  venue?: Venue;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:MM (e.g., "09:00")
  endTime: string; // HH:MM (e.g., "17:00")
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlackoutWindow {
  id: string;
  venueId: string;
  venue?: Venue;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  reason: string; // e.g., "Maintenance", "Closed"
  createdAt: string;
  updatedAt: string;
}

export interface VenueBookingRequest {
  id: string;
  batchId: string;
  batch?: Batch;
  venueId: string;
  venue?: Venue;
  requestedByUserId: string;
  requestedByUser?: User;
  status: 'pending' | 'approved' | 'declined';
  requestNotes?: string;
  declineReason?: string;
  suggestedAlternatives?: Venue[];
  createdAt: string;
  respondedAt?: string;
  respondedByUserId?: string;
  respondedByUser?: User;
  updatedAt: string;
}

// ============================================================================
// Audit Log Types
// ============================================================================

export type AuditAction =
  | 'batch_created'
  | 'batch_published'
  | 'batch_edited'
  | 'batch_archived'
  | 'batch_closed'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_reassigned'
  | 'booking_marked_attended'
  | 'booking_waitlisted'
  | 'import_started'
  | 'import_completed'
  | 'import_failed'
  | 'venue_approved'
  | 'venue_declined'
  | 'role_assigned'
  | 'role_revoked'
  | 'data_exported';

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: AuditAction;
  resourceType: 'batch' | 'booking' | 'venue' | 'user' | 'import' | 'system';
  resourceId: string;
  details: Record<string, any>; // Action-specific details
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ============================================================================
// Import Types
// ============================================================================

export interface ParticipantRecord {
  firstName: string;
  lastName: string;
  email: string;
  studentId?: string;
  preferredDate?: string; // ISO 8601
}

export interface ImportJob {
  id: string;
  batchId: string;
  batch?: Batch;
  createdByUserId: string;
  createdByUser?: User;
  totalRows: number;
  successCount: number;
  errorCount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  errors: ImportError[];
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface ImportError {
  rowNumber: number;
  record: ParticipantRecord;
  error: string; // Error message
}

// ============================================================================
// Export Types
// ============================================================================

export interface ExportRequest {
  id: string;
  type: 'pdf' | 'xlsx' | 'csv' | 'all';
  resourceType: 'batch' | 'booking' | 'audit_log' | 'system';
  resourceId?: string;
  createdByUserId: string;
  status: 'pending' | 'completed' | 'failed';
  downloadUrl?: string;
  createdAt: string;
  expiresAt: string; // Link expires after 7 days
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Notification Types
// ============================================================================

export enum NotificationType {
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  BATCH_PUBLISHED = 'batch_published',
  BATCH_CLOSED = 'batch_closed',
  IMPORT_COMPLETED = 'import_completed',
  IMPORT_FAILED = 'import_failed',
  VENUE_APPROVED = 'venue_approved',
  VENUE_DECLINED = 'venue_declined',
  ROLE_ASSIGNED = 'role_assigned',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// ============================================================================
// Request/Response DTOs
// ============================================================================

export interface CreateBatchRequest {
  title: string;
  description?: string;
  venueId?: string;
  dateRange: {
    start: string;
    end: string;
  };
  slotDuration: number; // Minutes
  perSlotCapacity?: number;
  batchCapacity?: number;
  generateMultiDate?: {
    weekDays: number[]; // [1, 2, 3, 4, 5] for Mon-Fri
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  };
}

export interface UpdateBatchRequest {
  title?: string;
  description?: string;
  venueId?: string;
  batchCapacity?: number;
}

export interface ImportParticipantsRequest {
  batchId: string;
  file: File; // FormData file
}

export interface CreateBookingRequest {
  slotId: string;
  studentName?: string;
  studentEmail?: string;
  studentId?: string;
}

export interface ExportBatchRequest {
  batchId: string;
  format: 'pdf' | 'xlsx' | 'csv';
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardMetrics {
  totalBatches: number;
  publishedBatches: number;
  draftBatches: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  attendedCount: number;
  lastPublishedAt?: string;
}

export interface UserDashboard {
  user: User;
  metrics: DashboardMetrics;
  recentBatches: Batch[];
  recentBookings: Booking[];
  recentAuditLogs: AuditLog[];
}

// ============================================================================
// Group Sync Types
// ============================================================================

export interface SyncSession {
  id: string;
  code: string;
  name?: string;
  host_id: string | null;
  status: 'lobby' | 'grouped' | 'ended';
  groups: SyncGroup[];
  created_at: string;
  updated_at: string;
  ended_at: string | null;
}

export interface SyncGroup {
  id: string;
  members: SyncGroupMember[];
}

export interface SyncGroupMember {
  name: string;
  avatar: string;
  discipline?: string;
  student_number?: string;
  current_placement?: string;
}

export interface SyncParticipant {
  id: string;
  session_id: string;
  name: string;
  avatar: string;
  student_number?: string;
  discipline?: string;
  current_placement?: string;
  joined_at: string;
}

