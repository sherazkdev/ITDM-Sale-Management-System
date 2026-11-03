import { describe, expect, it } from "vitest";
import { AppError } from "../../src/shared/errors/app-error.js";
import { ErrorCodes } from "../../src/shared/errors/error-codes.js";

describe("AppError", () => {
  it("carries code, status, and details for operational errors", () => {
    const err = new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid input", 422, {
      details: { field: "name" },
    });
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.details).toEqual({ field: "name" });
    expect(err.isOperational).toBe(true);
  });
});
