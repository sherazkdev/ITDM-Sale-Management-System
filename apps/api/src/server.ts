import type { Server } from "node:http";
import { createApp } from "./app.js";
import { createApplicationControllers } from "./application/controllers.js";
import { createApiRouter } from "./routes/index.js";
import { loadEnv } from "./shared/config/env.js";
import { createLogger } from "./shared/logging/logger.js";
import { disconnectPrisma, getPrisma } from "./shared/db/prisma.js";

export function buildApplication() {
  const env = loadEnv();
  const logger = createLogger(env);
  const prisma = getPrisma(env, logger);
  const controllers = createApplicationControllers(prisma, env, logger);
  const apiRouter = createApiRouter(controllers);
  const app = createApp({ env, logger, apiRouter });
  return { app, env, logger, prisma, controllers };
}

export async function startServer(): Promise<Server> {
  const { app, env, logger, prisma } = buildApplication();

  await prisma.$connect();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, "ITDMS API listening");
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, "Shutting down gracefully");
    server.close(() => {
      void disconnectPrisma()
        .then(() => {
          logger.info("Shutdown complete");
          process.exit(0);
        })
        .catch((err: unknown) => {
          logger.error({ err }, "Error during shutdown");
          process.exit(1);
        });
    });
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGINT", () => {
    shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    shutdown("SIGTERM");
  });

  return server;
}
