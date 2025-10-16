/**
 * Parses an ISO string into a Date instance, returning null when invalid.
 */
export function parsePortalSessionExpiresAt(
  value: string | null | undefined,
): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Calculates the remaining time in milliseconds until the session expires.
 */
export function getPortalSessionRemaining(
  expiresAt: Date | null,
  now: Date = new Date(),
): number {
  if (!expiresAt) {
    return 0;
  }

  return Math.max(0, expiresAt.getTime() - now.getTime());
}

/**
 * Human friendly formatting for the remaining session time.
 */
export function formatPortalSessionRemaining(ms: number): string {
  if (ms <= 0) {
    return "0 s";
  }

  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    const minutePart = minutes.toString().padStart(2, "0");
    const secondPart = seconds.toString().padStart(2, "0");
    return `${hours} h ${minutePart} min ${secondPart} s`;
  }

  if (minutes > 0) {
    const secondPart = seconds.toString().padStart(2, "0");
    return `${minutes} min ${secondPart} s`;
  }

  return `${seconds} s`;
}
