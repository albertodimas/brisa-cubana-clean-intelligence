"use client";

const isProduction = process.env.NODE_ENV === "production";

const withGuard =
  <T extends (...args: unknown[]) => void>(fn: T) =>
  (...args: Parameters<T>) => {
    if (isProduction) {
      return;
    }
    fn(...args);
  };

export const clientLogger = {
  info: withGuard(console.info.bind(console)),
  warn: withGuard(console.warn.bind(console)),
  error: withGuard(console.error.bind(console)),
  log: withGuard(console.log.bind(console)),
};

export type ClientLogger = typeof clientLogger;
