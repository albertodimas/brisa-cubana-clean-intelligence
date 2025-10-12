/**
 * bcryptjs helpers to handle serverless namespace issues
 */

import * as bcrypt from "bcryptjs";

/**
 * Resolve bcrypt.hash function from the namespace
 * Handles different module resolutions in serverless environments
 */
export function resolveBcryptHash(): typeof bcrypt.hash | undefined {
  const namespace = bcrypt as unknown as {
    hash?: typeof bcrypt.hash;
    default?: { hash?: typeof bcrypt.hash };
  };
  return namespace.hash ?? namespace.default?.hash;
}

/**
 * Resolve bcrypt.compare function from the namespace
 * Handles different module resolutions in serverless environments
 */
export function resolveBcryptCompare(): typeof bcrypt.compare | undefined {
  const namespace = bcrypt as unknown as {
    compare?: typeof bcrypt.compare;
    default?: { compare?: typeof bcrypt.compare };
  };
  return namespace.compare ?? namespace.default?.compare;
}

/**
 * Hash a password using bcryptjs
 * @param password - Plain text password
 * @param rounds - Salt rounds (default: 10)
 * @returns Hashed password or null if bcrypt is unavailable
 */
export async function hashPassword(
  password: string,
  rounds = 10,
): Promise<string | null> {
  const hashFn = resolveBcryptHash();
  if (!hashFn) {
    console.error("[bcrypt] hash function unavailable");
    return null;
  }
  return await hashFn(password, rounds);
}

/**
 * Compare a password with a hash using bcryptjs
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches, false otherwise, or null if bcrypt is unavailable
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean | null> {
  const compareFn = resolveBcryptCompare();
  if (!compareFn) {
    console.error("[bcrypt] compare function unavailable");
    return null;
  }
  return await compareFn(password, hash);
}
