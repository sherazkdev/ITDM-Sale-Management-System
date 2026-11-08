import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";

export function toDecimal(value: number | string | Prisma.Decimal): Prisma.Decimal {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}

export function assertPositiveQuantity(q: Prisma.Decimal, label = "Quantity") {
  if (q.lte(0)) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, `${label} must be greater than zero`, 422);
  }
}

export function assertNonNegativeAvailable(q: Prisma.Decimal) {
  if (q.lt(0)) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, "Insufficient available stock", 422);
  }
}

export function decimalToNumber(d: Prisma.Decimal): number {
  return Number(d.toString());
}
