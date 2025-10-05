import { createMiddleware } from "hono/factory";
import crypto from "node:crypto";

declare module "hono" {
  interface ContextVariableMap {
    nonce: string;
  }
}

/**
 * CSP Nonce Middleware
 * 
 * Generates a cryptographically secure nonce for each request
 * to be used in Content-Security-Policy headers.
 * 
 * The nonce is stored in context and can be accessed in:
 * - Inline scripts: <script nonce="${nonce}">
 * - Inline styles: <style nonce="${nonce}">
 * - CSP headers: script-src 'nonce-{value}'
 */
export const nonceMiddleware = createMiddleware(async (c, next) => {
  // Generate cryptographically secure nonce (128 bits = 16 bytes)
  const nonce = crypto.randomBytes(16).toString("base64");

  // Store nonce in context for access in routes and templates
  c.set("nonce", nonce);

  await next();
});
