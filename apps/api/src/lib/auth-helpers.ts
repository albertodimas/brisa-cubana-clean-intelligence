/**
 * Authentication helper utilities
 * Reduces code duplication across route handlers
 */

import type { Context } from "hono";
import { UnauthorizedError } from "./errors";
import { getAuthUser } from "../middleware/auth";
import type { AccessTokenPayload } from "./token";

/**
 * Extracts authenticated user from context
 * Throws UnauthorizedError if user is not authenticated
 *
 * Use this instead of manual null checks in route handlers
 *
 * @example
 * ```typescript
 * const authUser = requireAuthUser(c);
 * // No need for null check - will throw if not authenticated
 * ```
 */
export function requireAuthUser(c: Context): AccessTokenPayload {
  const authUser = getAuthUser(c);
  if (!authUser) {
    throw new UnauthorizedError();
  }
  return authUser;
}

/**
 * Sanitizes user object for logging
 * Removes sensitive fields like passwordHash, tokens, etc.
 */
export function sanitizeUserForLog(user: {
  id: string;
  email: string;
  role?: string;
  [key: string]: unknown;
}) {
  return {
    id: user.id,
    emailDomain: user.email.split("@")[1],
    role: user.role,
  };
}

/**
 * Checks if user has ownership of a resource
 */
export function verifyOwnership(
  resourceUserId: string,
  currentUserId: string,
  currentUserRole: string,
): boolean {
  // Admins can access any resource
  if (currentUserRole === "ADMIN") {
    return true;
  }
  // Users can only access their own resources
  return resourceUserId === currentUserId;
}
