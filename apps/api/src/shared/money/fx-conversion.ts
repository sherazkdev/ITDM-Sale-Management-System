import { Prisma } from "@prisma/client";
import { AppError } from "../errors/app-error.js";
import { ErrorCodes } from "../errors/error-codes.js";
import { REPORTING_CURRENCY } from "../domain/financial-rules.js";
import { toDecimal } from "../money/decimal-math.js";

const FX_SCALE = 8;

export function normalizeCurrency(code: string): string {
  const c = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(c)) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid currency code", 422);
  }
  return c;
}

/** Manual exchange rate to USD — required when transaction currency is not USD. */
export function resolveExchangeRateToUsd(currency: string, manualRate?: number): Prisma.Decimal {
  const c = normalizeCurrency(currency);
  if (c === REPORTING_CURRENCY) {
    return new Prisma.Decimal(1);
  }
  if (manualRate === undefined || manualRate === null) {
    throw new AppError(
      ErrorCodes.VALIDATION_ERROR,
      `exchangeRateToUsd required for non-${REPORTING_CURRENCY} payments`,
      422,
    );
  }
  if (!Number.isFinite(manualRate) || manualRate <= 0) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, "exchangeRateToUsd must be positive", 422);
  }
  return toDecimal(manualRate).toDecimalPlaces(FX_SCALE);
}

export function convertToUsd(
  amount: Prisma.Decimal | number,
  exchangeRateToUsd: Prisma.Decimal,
): Prisma.Decimal {
  return toDecimal(amount).mul(exchangeRateToUsd).toDecimalPlaces(2);
}

export function committedUsdAtPost(input: {
  invoiceAmount: Prisma.Decimal;
  currency: string;
  commitmentExchangeRateToUsd?: number;
}): { commitmentAmountUsd: Prisma.Decimal | null; rate: Prisma.Decimal | null } {
  const currency = normalizeCurrency(input.currency);
  const amount = toDecimal(input.invoiceAmount);
  if (currency === REPORTING_CURRENCY) {
    return { commitmentAmountUsd: amount.toDecimalPlaces(2), rate: new Prisma.Decimal(1) };
  }
  if (input.commitmentExchangeRateToUsd === undefined) {
    return { commitmentAmountUsd: null, rate: null };
  }
  const rate = resolveExchangeRateToUsd(currency, input.commitmentExchangeRateToUsd);
  return { commitmentAmountUsd: convertToUsd(amount, rate), rate };
}
