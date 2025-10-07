/* eslint-disable no-console */
import { env } from "@/config/env";

const isProduction = env.nodeEnv === "production";

/**
 * Server-side logger for Next.js
 * Uses console with structured logging format
 */
export const logger = {
  info: (obj: Record<string, unknown> | string, msg?: string) => {
    if (typeof obj === "string") {
      console.info(`[INFO] ${obj}`);
    } else {
      console.info(`[INFO] ${msg ?? ""}`, obj);
    }
  },
  warn: (obj: Record<string, unknown> | string, msg?: string) => {
    if (typeof obj === "string") {
      console.warn(`[WARN] ${obj}`);
    } else {
      console.warn(`[WARN] ${msg ?? ""}`, obj);
    }
  },
  error: (obj: Record<string, unknown> | string, msg?: string) => {
    if (typeof obj === "string") {
      console.error(`[ERROR] ${obj}`);
    } else {
      console.error(`[ERROR] ${msg ?? ""}`, obj);
    }
  },
  debug: (obj: Record<string, unknown> | string, msg?: string) => {
    if (!isProduction) {
      if (typeof obj === "string") {
        console.debug(`[DEBUG] ${obj}`);
      } else {
        console.debug(`[DEBUG] ${msg ?? ""}`, obj);
      }
    }
  },
};

export type Logger = typeof logger;
