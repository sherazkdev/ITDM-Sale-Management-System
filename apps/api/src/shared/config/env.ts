import { z } from "zod";

const nodeEnvSchema = z.enum(["development", "test", "production"]);

export const envSchema = z
  .object({
    NODE_ENV: nodeEnvSchema.default("development"),
    /** When "1", enforce production-like secret length and forbid CSRF bypass (local staging). */
    ITDMS_STAGING_STRICT: z.enum(["0", "1"]).optional(),
    /** When "1", enable Express trust proxy (reverse proxy / TLS termination). */
    ITDMS_TRUST_PROXY: z.enum(["0", "1"]).optional(),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
    SESSION_COOKIE_NAME: z.string().default("itdms_session"),
    CORS_ORIGIN: z.string().optional(),
    STORAGE_ROOT: z.string().default("./storage"),
    /** PROPOSED lead time — not approved client policy (D14). */
    NOTIFICATION_LEAD_DAYS: z.coerce.number().int().min(1).max(365).default(60),
  })
  .superRefine((data, ctx) => {
    const strict =
      data.NODE_ENV === "production" || data.ITDMS_STAGING_STRICT === "1";
    if (strict && data.SESSION_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SESSION_SECRET must be at least 32 characters in production/staging-strict",
        path: ["SESSION_SECRET"],
      });
    }
    if (strict && process.env.ITDMS_DISABLE_CSRF === "1") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ITDMS_DISABLE_CSRF must not be set in production or ITDMS_STAGING_STRICT mode",
        path: ["NODE_ENV"],
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | undefined;

export function loadEnv(input: NodeJS.ProcessEnv = process.env): AppEnv {
  if (cached) {
    return cached;
  }
  const parsed = envSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${message}`);
  }
  cached = parsed.data;
  return cached;
}

export function resetEnvCacheForTests(): void {
  cached = undefined;
}
