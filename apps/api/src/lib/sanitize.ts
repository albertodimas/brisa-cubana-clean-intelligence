import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify with strict configuration
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
    ],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
}

/**
 * Sanitize plain text - removes all HTML tags
 * Use for fields that should never contain HTML
 */
export function sanitizePlainText(input: string | null | undefined): string {
  if (!input) return "";

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitize JSON array of strings
 * Useful for arrays like recommendations, team members, etc.
 */
export function sanitizeStringArray(
  input: string[] | null | undefined,
): string[] {
  if (!input || !Array.isArray(input)) return [];

  return input.map((item) =>
    typeof item === "string" ? sanitizePlainText(item) : "",
  );
}

/**
 * Sanitize user input for bookings
 */
export interface SanitizedBookingInput {
  notes?: string;
}

export function sanitizeBookingInput(input: {
  notes?: string | null;
}): SanitizedBookingInput {
  return {
    notes: input.notes ? sanitizePlainText(input.notes) : undefined,
  };
}

/**
 * Sanitize CleanScore report input
 */
export interface SanitizedCleanScoreInput {
  observations?: string;
  recommendations: string[];
  teamMembers: string[];
}

export function sanitizeCleanScoreInput(input: {
  observations?: string | null;
  recommendations?: string[] | null;
  teamMembers?: string[] | null;
}): SanitizedCleanScoreInput {
  return {
    observations: input.observations
      ? sanitizeHtml(input.observations)
      : undefined,
    recommendations: sanitizeStringArray(input.recommendations),
    teamMembers: sanitizeStringArray(input.teamMembers),
  };
}

/**
 * Sanitize conversation message content
 */
export function sanitizeMessageContent(
  content: string | null | undefined,
): string {
  if (!content) return "";
  return sanitizePlainText(content);
}

/**
 * Sanitize reconciliation note message
 */
export function sanitizeNoteMessage(
  message: string | null | undefined,
): string {
  if (!message) return "";
  return sanitizeHtml(message);
}
