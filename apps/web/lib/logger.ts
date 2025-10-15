type LogLevel = "debug" | "info" | "warn" | "error";

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const env = process.env.NODE_ENV ?? "development";
const isProduction = env === "production";

function shouldLog(level: LogLevel): boolean {
  if (isProduction) {
    // Only surface info+, skip verbose debug noise in production.
    return levelPriority[level] >= levelPriority.info;
  }
  return true;
}

function formatMessage(level: LogLevel, message: string, metadata?: unknown) {
  return {
    level,
    message,
    metadata,
    timestamp: new Date().toISOString(),
    env,
  };
}

function emit(level: LogLevel, message: string, metadata?: unknown) {
  if (!shouldLog(level)) return;
  const payload = formatMessage(level, message, metadata);

  switch (level) {
    case "debug":
      console.debug(payload);
      break;
    case "info":
      console.info(payload);
      break;
    case "warn":
      console.warn(payload);
      break;
    case "error":
      console.error(payload);
      break;
    default:
      console.log(payload);
  }
}

export const logger = {
  debug: (message: string, metadata?: unknown) =>
    emit("debug", message, metadata),
  info: (message: string, metadata?: unknown) =>
    emit("info", message, metadata),
  warn: (message: string, metadata?: unknown) =>
    emit("warn", message, metadata),
  error: (message: string, metadata?: unknown) =>
    emit("error", message, metadata),
};
