import { logger } from "./logger.js";

const exitHandler = ({
  error,
  reason,
  type,
}: {
  error?: unknown;
  reason?: unknown;
  type: "uncaughtException" | "unhandledRejection";
}) => {
  const serialized = error instanceof Error ? error : new Error(String(error));
  logger.fatal(
    {
      type,
      stack: serialized.stack,
      message: serialized.message,
      reason,
    },
    "Unhandled fatal error. Shutting down.",
  );
  if (process.env.NODE_ENV !== "test") {
    setTimeout(() => process.exit(1), 100).unref();
  }
};

process.on("uncaughtException", (error) => {
  exitHandler({ error, type: "uncaughtException" });
});

process.on("unhandledRejection", (reason) => {
  exitHandler({ reason, type: "unhandledRejection" });
});
