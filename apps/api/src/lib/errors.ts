/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code = "INTERNAL_ERROR",
    public details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    const result: {
      error: string;
      code: string;
      details?: unknown;
    } = {
      error: this.message,
      code: this.code,
    };

    if (this.details !== undefined) {
      result.details = this.details;
    }

    return result;
  }
}

/**
 * 400 - Bad Request
 * Client sent invalid data
 */
export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

/**
 * 401 - Unauthorized
 * Authentication required but not provided or invalid
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

/**
 * 403 - Forbidden
 * User is authenticated but doesn't have permission
 */
export class ForbiddenError extends AppError {
  constructor(message = "Permission denied") {
    super(message, 403, "FORBIDDEN");
  }
}

/**
 * 404 - Not Found
 * Resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

/**
 * 409 - Conflict
 * Request conflicts with current state (e.g., duplicate, scheduling conflict)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 409, "CONFLICT", details);
  }
}

/**
 * 422 - Unprocessable Entity
 * Validation failed (semantic errors in valid syntax)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

/**
 * 429 - Too Many Requests
 * Rate limit exceeded
 */
export class RateLimitError extends AppError {
  constructor(
    message = "Too many requests",
    public retryAfter?: number,
  ) {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

/**
 * 500 - Internal Server Error
 * Unexpected server error
 */
export class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(message, 500, "INTERNAL_ERROR");
  }
}

/**
 * 503 - Service Unavailable
 * Service temporarily unavailable (maintenance, overload)
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = "Service temporarily unavailable") {
    super(message, 503, "SERVICE_UNAVAILABLE");
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Error codes enum for consistent reference
 */
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Server errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
}
