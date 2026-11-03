import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import type { HealthRepository } from "./health.repository.js";

export type LivenessResult = {
  status: "ok";
  service: "itdms-api";
};

export type ReadinessResult = {
  status: "ok" | "degraded";
  service: "itdms-api";
  checks: {
    database: "up" | "down";
  };
};

export class HealthService {
  constructor(private readonly repository: HealthRepository) {}

  getLiveness(): LivenessResult {
    return { status: "ok", service: "itdms-api" };
  }

  async getReadiness(): Promise<ReadinessResult> {
    try {
      await this.repository.pingDatabase();
      return {
        status: "ok",
        service: "itdms-api",
        checks: { database: "up" },
      };
    } catch {
      throw new AppError(
        ErrorCodes.SERVICE_UNAVAILABLE,
        "Service is not ready",
        503,
        {
          details: { checks: { database: "down" } },
        },
      );
    }
  }
}
