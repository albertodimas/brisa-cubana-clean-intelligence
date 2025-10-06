/**
 * Content Security Policy (CSP) Helper
 *
 * Builds a strict CSP with nonce-based script and style execution.
 * Eliminates 'unsafe-inline' to prevent XSS attacks while maintaining
 * compatibility with Vercel Analytics and Sentry.
 *
 * References:
 * - https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 * - https://web.dev/articles/csp
 * - https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
 */

interface CspOptions {
  nonce: string;
  connectSrcValue: string[];
  reportUri?: string;
}

/**
 * Builds a Content Security Policy string with nonce-based directives
 *
 * @param options - Configuration object
 * @param options.nonce - Per-request 128-bit nonce for scripts and styles
 * @param options.connectSrcValue - Array of allowed connect-src origins
 * @param options.reportUri - Optional CSP violation report endpoint
 * @returns CSP directive string
 */
export function buildCsp({
  nonce,
  connectSrcValue,
  reportUri,
}: CspOptions): string {
  const directives = [
    // Default fallback for any resource type not explicitly covered
    "default-src 'self'",

    // Scripts: Allow self, nonce, and third-party analytics
    // 'strict-dynamic' allows runtime-injected scripts from nonce-authorized scripts
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://va.vercel-scripts.com https://js.sentry-cdn.com`,

    // Styles: Allow self and nonce (no unsafe-inline)
    `style-src 'self' 'nonce-${nonce}'`,

    // Style attributes: Block inline style attributes
    "style-src-attr 'none'",

    // API connections: Allow configured origins
    `connect-src ${connectSrcValue.join(" ")}`,

    // Images: Allow self, data URIs, and HTTPS
    "img-src 'self' data: https:",

    // Fonts: Allow self and data URIs (Next.js fonts)
    "font-src 'self' data:",

    // Prevent embedding in frames (clickjacking protection)
    "frame-ancestors 'none'",

    // Restrict base URI to prevent base tag injection
    "base-uri 'self'",

    // Restrict form submissions to same origin
    "form-action 'self'",

    // Upgrade insecure requests to HTTPS
    "upgrade-insecure-requests",
  ];

  // Add CSP violation reporting in production
  if (reportUri) {
    directives.push(`report-uri ${reportUri}`);
  }

  return directives.join("; ");
}
