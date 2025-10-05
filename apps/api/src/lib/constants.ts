/**
 * Application constants
 * Centralized to avoid magic numbers and strings
 */

export const PERFORMANCE = {
  SLOW_REQUEST_THRESHOLD_MS: 1000,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 10,
  DB_CONNECTION_TIMEOUT_MS: 10000,
} as const;

export const SECURITY = {
  PASSWORD_SALT_ROUNDS: 12,
  JWT_EXPIRATION: "8h",
  MAX_LOGIN_ATTEMPTS: 3,
  LOGIN_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
} as const;

export const BUSINESS = {
  MAX_BOOKING_MONTHS_AHEAD: 6,
  CLEANSCORE_MIN: 0,
  CLEANSCORE_MAX: 100,
  DATA_RETENTION_DAYS: 90,
} as const;

export const USER_ROLES = {
  ADMIN: "ADMIN" as const,
  STAFF: "STAFF" as const,
  CLIENT: "CLIENT" as const,
};

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
