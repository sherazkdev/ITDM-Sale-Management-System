import { Prisma } from "@prisma/client";

export type MoneyInput = Prisma.Decimal | string | number;

export function toDecimal(value: MoneyInput): Prisma.Decimal {
  if (value instanceof Prisma.Decimal) {
    return value;
  }
  return new Prisma.Decimal(value);
}

export function sumDecimals(values: MoneyInput[]): Prisma.Decimal {
  return values.reduce<Prisma.Decimal>(
    (acc, v) => acc.add(toDecimal(v)),
    new Prisma.Decimal(0),
  );
}

export function lineSubtotal(quantity: MoneyInput, unitPrice: MoneyInput): Prisma.Decimal {
  return toDecimal(quantity).mul(toDecimal(unitPrice));
}

export function isPositive(value: MoneyInput): boolean {
  return toDecimal(value).greaterThan(0);
}

export function isNonNegative(value: MoneyInput): boolean {
  return toDecimal(value).greaterThanOrEqualTo(0);
}
