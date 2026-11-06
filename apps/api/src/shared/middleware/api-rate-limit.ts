import rateLimit from "express-rate-limit";

/** Broad abuse protection — login has a dedicated limiter. */
export function createApiRateLimiter() {
  /**
   * Production always uses a fixed ceiling (600 / 15m).
   * `ITDMS_API_RATE_LIMIT_MAX` is honored only when NODE_ENV !== "production"
   * so local Playwright capture matrices cannot weaken production defaults.
   */
  const productionMax = 600;
  const developmentMax = Number(process.env.ITDMS_API_RATE_LIMIT_MAX ?? "20000");
  const max = process.env.NODE_ENV === "production" ? productionMax : developmentMax;
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith("/health"),
  });
}
