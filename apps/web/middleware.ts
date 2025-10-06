import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/server/auth/config";
import { buildCsp } from "@/server/security/csp";

/**
 * Composed middleware that:
 * 1. Generates per-request nonce for CSP
 * 2. Applies nonce-based Content Security Policy
 * 3. Preserves NextAuth route protection
 */

// Base connect sources for CSP
const baseConnectSources = [
  "'self'",
  "https://api.brisacubana.com",
  "https://vitals.vercel-insights.com",
  "https://*.sentry.io",
];

// Build connect-src list based on environment
const connectSrc = new Set(baseConnectSources);

const apiUrlFromEnv = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;

if (apiUrlFromEnv) {
  try {
    const apiOrigin = new URL(apiUrlFromEnv).origin;
    connectSrc.add(apiOrigin);
  } catch {
    // Ignore invalid URLs; fallback to defaults only
  }
}

if (process.env.NODE_ENV !== "production") {
  connectSrc.add("http://localhost:3001");
  connectSrc.add("http://127.0.0.1:3001");
}

const connectSrcValue = Array.from(connectSrc);

/**
 * Generates a cryptographically secure 128-bit nonce
 * @returns Base64-encoded nonce string
 */
function generateNonce(): string {
  const nonce = new Uint8Array(16);
  crypto.getRandomValues(nonce);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(nonce).toString("base64");
  }

  const base64Encoder = globalThis.btoa;
  if (base64Encoder) {
    const binary = Array.from(nonce)
      .map((byte) => String.fromCharCode(byte))
      .join("");
    return base64Encoder(binary);
  }

  // Fallback (should not happen in Edge runtime)
  return Array.from(nonce)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default auth(async (req: NextRequest) => {
  // Generate nonce for this request
  const nonce = generateNonce();

  // Clone request headers and inject nonce
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  // Build CSP with nonce and optional reporting
  const csp = buildCsp({
    nonce,
    connectSrcValue,
    reportUri: process.env.CSP_REPORT_URI,
  });

  // Create response with modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Apply CSP to response
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, max-age=0, must-revalidate");
  response.headers.append("Vary", "Origin");

  return response;
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
