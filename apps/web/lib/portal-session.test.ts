import { describe, expect, it } from "vitest";
import {
  formatPortalSessionRemaining,
  getPortalSessionRemaining,
  parsePortalSessionExpiresAt,
} from "./portal-session";

describe("portal session helpers", () => {
  describe("parsePortalSessionExpiresAt", () => {
    it("returns a date for valid ISO strings", () => {
      const date = parsePortalSessionExpiresAt("2025-10-16T15:00:00.000Z");
      expect(date).toBeInstanceOf(Date);
      expect(date?.toISOString()).toBe("2025-10-16T15:00:00.000Z");
    });

    it("returns null for invalid values", () => {
      expect(parsePortalSessionExpiresAt(undefined)).toBeNull();
      expect(parsePortalSessionExpiresAt(null)).toBeNull();
      expect(parsePortalSessionExpiresAt("not-a-date")).toBeNull();
    });
  });

  describe("getPortalSessionRemaining", () => {
    it("returns milliseconds remaining when session is in the future", () => {
      const now = new Date("2025-10-16T12:00:00.000Z");
      const expiresAt = new Date("2025-10-16T12:30:00.000Z");
      expect(getPortalSessionRemaining(expiresAt, now)).toBe(30 * 60 * 1000);
    });

    it("never returns a negative value", () => {
      const now = new Date("2025-10-16T12:00:00.000Z");
      const expiresAt = new Date("2025-10-16T11:59:00.000Z");
      expect(getPortalSessionRemaining(expiresAt, now)).toBe(0);
      expect(getPortalSessionRemaining(null, now)).toBe(0);
    });
  });

  describe("formatPortalSessionRemaining", () => {
    it("formats durations longer than an hour", () => {
      expect(formatPortalSessionRemaining(3_900_000)).toBe("1 h 05 min 00 s");
    });

    it("formats durations longer than a minute", () => {
      expect(formatPortalSessionRemaining(125_000)).toBe("2 min 05 s");
    });

    it("formats durations shorter than a minute", () => {
      expect(formatPortalSessionRemaining(15_000)).toBe("15 s");
    });

    it("returns zero seconds for expired sessions", () => {
      expect(formatPortalSessionRemaining(0)).toBe("0 s");
      expect(formatPortalSessionRemaining(-1)).toBe("0 s");
    });
  });
});
