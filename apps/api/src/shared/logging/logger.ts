import { pino, type Logger as PinoLogger } from "pino";
import type { AppEnv } from "../config/env.js";

export type Logger = PinoLogger;

export function createLogger(env: AppEnv): Logger {
  return pino({
    level: env.LOG_LEVEL,
    ...(env.NODE_ENV === "production"
      ? { redact: { paths: ["req.headers.authorization", "DATABASE_URL"], censor: "[REDACTED]" } }
      : {}),
  });
}
