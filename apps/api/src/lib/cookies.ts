import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

/**
 * Cookie configuration for JWT tokens
 * HttpOnly, Secure, SameSite=Strict for maximum security
 */

const ACCESS_TOKEN_COOKIE = "brisa_access";
const REFRESH_TOKEN_COOKIE = "brisa_refresh";

const isProduction = process.env.NODE_ENV === "production";

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None";
  path: string;
  maxAge?: number;
}

const accessTokenOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction, // HTTPS only in production
  sameSite: "Strict",
  path: "/",
  maxAge: 15 * 60, // 15 minutes
};

const refreshTokenOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "Strict",
  path: "/",
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

/**
 * Set access token cookie
 */
export function setAccessTokenCookie(c: Context, token: string): void {
  setCookie(c, ACCESS_TOKEN_COOKIE, token, accessTokenOptions);
}

/**
 * Set refresh token cookie
 */
export function setRefreshTokenCookie(c: Context, token: string): void {
  setCookie(c, REFRESH_TOKEN_COOKIE, token, refreshTokenOptions);
}

/**
 * Get access token from cookie
 */
export function getAccessTokenCookie(c: Context): string | undefined {
  return getCookie(c, ACCESS_TOKEN_COOKIE);
}

/**
 * Get refresh token from cookie
 */
export function getRefreshTokenCookie(c: Context): string | undefined {
  return getCookie(c, REFRESH_TOKEN_COOKIE);
}

/**
 * Clear all auth cookies (logout)
 */
export function clearAuthCookies(c: Context): void {
  deleteCookie(c, ACCESS_TOKEN_COOKIE, { path: "/" });
  deleteCookie(c, REFRESH_TOKEN_COOKIE, { path: "/" });
}

export {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenOptions,
  refreshTokenOptions,
};
