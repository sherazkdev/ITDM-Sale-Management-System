import express, { type Express, type Request, type Router } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { AppEnv } from "./shared/config/env.js";
import type { Logger } from "./shared/logging/logger.js";
import { requestIdMiddleware } from "./shared/middleware/request-id.js";
import { errorHandler, notFoundHandler } from "./shared/middleware/error-handler.js";
import { CSRF_HEADER_NAME } from "./shared/middleware/csrf.middleware.js";

export type AppDependencies = {
  env: AppEnv;
  logger: Logger;
  apiRouter: Router;
};

export function createApp(deps: AppDependencies): Express {
  const app = express();
  const { env, logger, apiRouter } = deps;

  app.disable("x-powered-by");
  const trustProxy =
    env.NODE_ENV === "production" ||
    process.env.ITDMS_TRUST_PROXY === "1" ||
    env.ITDMS_TRUST_PROXY === "1";
  app.set("trust proxy", trustProxy);

  app.use(requestIdMiddleware());
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === "production",
    }),
  );

  if (env.CORS_ORIGIN) {
    const allowedOrigin = env.CORS_ORIGIN;
    app.use((req, res, next) => {
      const origin = req.header("Origin");
      if (origin === allowedOrigin) {
        res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
        res.setHeader("Vary", "Origin");
      }
      if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
        res.setHeader(
          "Access-Control-Allow-Headers",
          `Content-Type, Authorization, X-Request-Id, ${CSRF_HEADER_NAME}`,
        );
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.status(204).end();
        return;
      }
      next();
    });
  }

  app.use(
    pinoHttp({
      logger,
      genReqId: (req: Request) => req.requestId,
      customProps: (req: Request) => ({ requestId: req.requestId }),
      redact: ["req.headers.authorization", "req.headers.cookie"],
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler());
  app.use(errorHandler(logger));

  return app;
}
