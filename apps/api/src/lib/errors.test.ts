import { describe, it, expect } from "vitest";
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  isAppError,
  ErrorCode,
} from "./errors";

describe("AppError", () => {
  it("should create error with default values", () => {
    const error = new AppError("Test error");
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.details).toBeUndefined();
    expect(error.name).toBe("AppError");
  });

  it("should create error with custom values", () => {
    const details = { field: "email", reason: "invalid" };
    const error = new AppError("Custom error", 400, "CUSTOM_CODE", details);
    expect(error.message).toBe("Custom error");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("CUSTOM_CODE");
    expect(error.details).toEqual(details);
  });

  it("should serialize to JSON without details", () => {
    const error = new AppError("Test error", 500, "TEST_CODE");
    const json = error.toJSON();
    expect(json).toEqual({
      error: "Test error",
      code: "TEST_CODE",
    });
    expect(json).not.toHaveProperty("details");
  });

  it("should serialize to JSON with details", () => {
    const details = { field: "email" };
    const error = new AppError("Test error", 400, "TEST_CODE", details);
    const json = error.toJSON();
    expect(json).toEqual({
      error: "Test error",
      code: "TEST_CODE",
      details: { field: "email" },
    });
  });

  it("should capture stack trace", () => {
    const error = new AppError("Test error");
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("AppError");
  });
});

describe("BadRequestError", () => {
  it("should create 400 error without details", () => {
    const error = new BadRequestError("Invalid input");
    expect(error.message).toBe("Invalid input");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.details).toBeUndefined();
  });

  it("should create 400 error with details", () => {
    const details = { fields: ["email", "password"] };
    const error = new BadRequestError("Invalid input", details);
    expect(error.details).toEqual(details);
  });
});

describe("UnauthorizedError", () => {
  it("should create 401 error with default message", () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe("Authentication required");
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
  });

  it("should create 401 error with custom message", () => {
    const error = new UnauthorizedError("Invalid credentials");
    expect(error.message).toBe("Invalid credentials");
  });
});

describe("ForbiddenError", () => {
  it("should create 403 error with default message", () => {
    const error = new ForbiddenError();
    expect(error.message).toBe("Permission denied");
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });

  it("should create 403 error with custom message", () => {
    const error = new ForbiddenError("Admin access required");
    expect(error.message).toBe("Admin access required");
  });
});

describe("NotFoundError", () => {
  it("should create 404 error with default resource", () => {
    const error = new NotFoundError();
    expect(error.message).toBe("Resource not found");
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
  });

  it("should create 404 error with custom resource", () => {
    const error = new NotFoundError("User");
    expect(error.message).toBe("User not found");
  });
});

describe("ConflictError", () => {
  it("should create 409 error without details", () => {
    const error = new ConflictError("Booking conflict");
    expect(error.message).toBe("Booking conflict");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
  });

  it("should create 409 error with details", () => {
    const details = { conflictingBookingId: "123" };
    const error = new ConflictError("Booking conflict", details);
    expect(error.details).toEqual(details);
  });
});

describe("ValidationError", () => {
  it("should create 422 error without details", () => {
    const error = new ValidationError("Validation failed");
    expect(error.message).toBe("Validation failed");
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe("VALIDATION_ERROR");
  });

  it("should create 422 error with details", () => {
    const details = { errors: [{ field: "email", message: "Invalid format" }] };
    const error = new ValidationError("Validation failed", details);
    expect(error.details).toEqual(details);
  });
});

describe("RateLimitError", () => {
  it("should create 429 error with default message", () => {
    const error = new RateLimitError();
    expect(error.message).toBe("Too many requests");
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(error.retryAfter).toBeUndefined();
  });

  it("should create 429 error with custom message and retry time", () => {
    const error = new RateLimitError("Rate limit exceeded", 60);
    expect(error.message).toBe("Rate limit exceeded");
    expect(error.retryAfter).toBe(60);
  });
});

describe("InternalServerError", () => {
  it("should create 500 error with default message", () => {
    const error = new InternalServerError();
    expect(error.message).toBe("Internal server error");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_ERROR");
  });

  it("should create 500 error with custom message", () => {
    const error = new InternalServerError("Database connection failed");
    expect(error.message).toBe("Database connection failed");
  });
});

describe("ServiceUnavailableError", () => {
  it("should create 503 error with default message", () => {
    const error = new ServiceUnavailableError();
    expect(error.message).toBe("Service temporarily unavailable");
    expect(error.statusCode).toBe(503);
    expect(error.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("should create 503 error with custom message", () => {
    const error = new ServiceUnavailableError("Maintenance mode");
    expect(error.message).toBe("Maintenance mode");
  });
});

describe("isAppError", () => {
  it("should return true for AppError instances", () => {
    expect(isAppError(new AppError("test"))).toBe(true);
    expect(isAppError(new BadRequestError("test"))).toBe(true);
    expect(isAppError(new UnauthorizedError())).toBe(true);
    expect(isAppError(new NotFoundError())).toBe(true);
  });

  it("should return false for non-AppError instances", () => {
    expect(isAppError(new Error("test"))).toBe(false);
    expect(isAppError("string")).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError({})).toBe(false);
    expect(isAppError(123)).toBe(false);
  });
});

describe("ErrorCode enum", () => {
  it("should have all expected error codes", () => {
    expect(ErrorCode.BAD_REQUEST).toBe("BAD_REQUEST");
    expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ErrorCode.FORBIDDEN).toBe("FORBIDDEN");
    expect(ErrorCode.NOT_FOUND).toBe("NOT_FOUND");
    expect(ErrorCode.CONFLICT).toBe("CONFLICT");
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.RATE_LIMIT_EXCEEDED).toBe("RATE_LIMIT_EXCEEDED");
    expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    expect(ErrorCode.SERVICE_UNAVAILABLE).toBe("SERVICE_UNAVAILABLE");
    expect(ErrorCode.DATABASE_ERROR).toBe("DATABASE_ERROR");
    expect(ErrorCode.EXTERNAL_SERVICE_ERROR).toBe("EXTERNAL_SERVICE_ERROR");
  });
});
