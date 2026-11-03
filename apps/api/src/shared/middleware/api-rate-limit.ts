import rateLimit from "express-rate-limit";

/** Broad abuse protection — login has a dedicated limiter. */
export function createApiRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 600 : 3000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith("/health"),
  });
}
