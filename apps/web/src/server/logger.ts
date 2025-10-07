import pino from "pino";
import { env } from "@/config/env";

const isProduction = env.nodeEnv === "production";
const isDevelopment = env.nodeEnv === "development";

export const logger = pino({
  level: isProduction ? "info" : "debug",
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    env: env.nodeEnv,
    service: "brisa-web",
  },
});

export type Logger = typeof logger;
