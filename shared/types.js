"use strict";
/**
 * Shared types across backend and frontend apps.
 * This file is referenced by all packages in the monorepo.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.NotificationType = void 0;
// ============================================================================
// Notification Types
// ============================================================================
var NotificationType;
(function (NotificationType) {
    NotificationType["BOOKING_CONFIRMED"] = "booking_confirmed";
    NotificationType["BOOKING_CANCELLED"] = "booking_cancelled";
    NotificationType["BATCH_PUBLISHED"] = "batch_published";
    NotificationType["BATCH_CLOSED"] = "batch_closed";
    NotificationType["IMPORT_COMPLETED"] = "import_completed";
    NotificationType["IMPORT_FAILED"] = "import_failed";
    NotificationType["VENUE_APPROVED"] = "venue_approved";
    NotificationType["VENUE_DECLINED"] = "venue_declined";
    NotificationType["ROLE_ASSIGNED"] = "role_assigned";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
// ============================================================================
// Error Types
// ============================================================================
class ApiError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=types.js.map