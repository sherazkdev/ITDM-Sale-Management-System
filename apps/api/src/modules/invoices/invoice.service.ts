import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { BudgetTransactionType, REPORTING_CURRENCY } from "../../shared/domain/financial-rules.js";
import { runInTransaction } from "../../shared/db/transaction.js";
import {
  committedUsdAtPost,
  convertToUsd,
  normalizeCurrency,
  resolveExchangeRateToUsd,
} from "../../shared/money/fx-conversion.js";
import { toDecimal, sumDecimals } from "../../shared/money/decimal-math.js";
import type { AuditService } from "../../shared/audit/audit.service.js";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";
import type { PrismaClient } from "@prisma/client";

export const InvoicePaymentStatus = {
  unpaid: "UNPAID",
  partial: "PARTIAL",
  paid: "PAID",
} as const;

function derivePaymentStatus(invoiceAmount: Prisma.Decimal, paidTotal: Prisma.Decimal): string {
  if (paidTotal.lessThanOrEqualTo(0)) {
    return InvoicePaymentStatus.unpaid;
  }
  if (paidTotal.lessThan(invoiceAmount)) {
    return InvoicePaymentStatus.partial;
  }
  return InvoicePaymentStatus.paid;
}

function dateOnlyFromPost(postedAt: Date): Date {
  return new Date(`${postedAt.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

export class InvoiceService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async create(
    input: {
      invoiceNumber: string;
      purchaseOrderId: bigint;
      invoiceDate: string;
      invoiceAmount: number;
    },
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { purchaseOrderId: input.purchaseOrderId },
    });
    if (!po) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Purchase order not found", 422);
    }
    try {
      const invoice = await this.prisma.invoice.create({
        data: {
          invoiceNumber: input.invoiceNumber.trim(),
          purchaseOrder: { connect: { purchaseOrderId: input.purchaseOrderId } },
          invoiceDate: new Date(`${input.invoiceDate}T00:00:00.000Z`),
          invoiceAmount: toDecimal(input.invoiceAmount),
          currency: normalizeCurrency(po.currency),
          paymentStatus: InvoicePaymentStatus.unpaid,
        },
      });
      await this.audit.record({
        actorUserId: auditContext.actorUserId,
        action: "invoice.create",
        targetType: "invoice",
        targetId: String(invoice.invoiceId),
        result: "success",
        requestId: auditContext.requestId,
      });
      return invoice;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError(ErrorCodes.CONFLICT, "Invoice number already exists", 409);
      }
      throw err;
    }
  }

  async postInvoice(
    invoiceId: bigint,
    input: { budgetId: bigint; commitmentExchangeRateToUsd?: number },
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    return runInTransaction(this.prisma, async (tx) => {
      await tx.$queryRaw`SELECT invoice_id FROM invoices WHERE invoice_id = ${invoiceId} FOR UPDATE`;
      const invoice = await tx.invoice.findUnique({
        where: { invoiceId },
        include: { purchaseOrder: true },
      });
      if (!invoice) {
        throw new AppError(ErrorCodes.NOT_FOUND, "Invoice not found", 404);
      }
      if (invoice.postedAt) {
        throw new AppError(ErrorCodes.CONFLICT, "Invoice already posted", 409);
      }
      const budget = await tx.budgetAllocation.findUnique({ where: { budgetId: input.budgetId } });
      if (!budget) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "Budget allocation not found", 422);
      }

      const postedAt = new Date();
      const { commitmentAmountUsd, rate } = committedUsdAtPost({
        invoiceAmount: toDecimal(invoice.invoiceAmount),
        currency: invoice.currency,
        commitmentExchangeRateToUsd: input.commitmentExchangeRateToUsd,
      });

      const updated = await tx.invoice.update({
        where: { invoiceId },
        data: {
          postedAt,
          budgetId: input.budgetId,
          commitmentExchangeRateToUsd: rate,
          commitmentAmountUsd,
        },
      });

      await tx.budgetTransaction.create({
        data: {
          budget: { connect: { budgetId: input.budgetId } },
          purchaseOrder: { connect: { purchaseOrderId: invoice.purchaseOrderId } },
          invoice: { connect: { invoiceId } },
          transactionType: BudgetTransactionType.committedInvoice,
          amount: toDecimal(invoice.invoiceAmount),
          currency: invoice.currency,
          amountUsdReporting: commitmentAmountUsd,
          exchangeRateToUsd: rate,
          transactionDate: dateOnlyFromPost(postedAt),
          remarks: "Committed on invoice post (client Wave 2)",
        },
      });

      await this.audit.record({
        actorUserId: auditContext.actorUserId,
        action: "invoice.post",
        targetType: "invoice",
        targetId: String(invoiceId),
        result: "success",
        requestId: auditContext.requestId,
        metadata: {
          budgetId: String(input.budgetId),
          commitmentAmountUsd: commitmentAmountUsd?.toString() ?? null,
        },
      });

      return updated;
    });
  }

  async getById(invoiceId: bigint) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { invoiceId },
      include: { purchaseOrder: { include: { vendor: true } }, payments: true },
    });
    if (!invoice) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Invoice not found", 404);
    }
    return invoice;
  }

  async getBalance(invoiceId: bigint) {
    const invoice = await this.getById(invoiceId);
    const paidTotal = sumDecimals(invoice.payments.map((p) => p.amount));
    const paidTotalUsd = sumDecimals(invoice.payments.map((p) => p.amountUsd));
    const outstanding = toDecimal(invoice.invoiceAmount).sub(paidTotal);
    return {
      invoiceId: invoice.invoiceId,
      currency: invoice.currency,
      reportingCurrency: REPORTING_CURRENCY,
      invoiceAmount: invoice.invoiceAmount,
      paidTotal,
      paidTotalUsd,
      outstanding,
      paymentStatus: invoice.paymentStatus,
      postedAt: invoice.postedAt,
      commitmentAmountUsd: invoice.commitmentAmountUsd,
    };
  }

  async recordPayment(
    invoiceId: bigint,
    input: {
      amount: number;
      paidAt?: string;
      referenceNumber?: string;
      idempotencyKey: string;
      notes?: string;
      exchangeRateToUsd?: number;
      budgetId?: bigint;
    },
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    const existing = await this.prisma.invoicePayment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      if (existing.invoiceId !== invoiceId) {
        throw new AppError(
          ErrorCodes.CONFLICT,
          "Idempotency key already used for a different invoice",
          409,
        );
      }
      return this.getBalance(invoiceId);
    }

    return runInTransaction(this.prisma, async (tx) => {
      await tx.$queryRaw`SELECT invoice_id FROM invoices WHERE invoice_id = ${invoiceId} FOR UPDATE`;
      const invoice = await tx.invoice.findUnique({
        where: { invoiceId },
        include: { payments: true },
      });
      if (!invoice) {
        throw new AppError(ErrorCodes.NOT_FOUND, "Invoice not found", 404);
      }
      if (!invoice.postedAt) {
        throw new AppError(
          ErrorCodes.CONFLICT,
          "Invoice must be posted before recording payments",
          409,
        );
      }

      const paidTotal = sumDecimals(invoice.payments.map((p) => p.amount));
      const paymentAmount = toDecimal(input.amount);
      const newTotal = paidTotal.add(paymentAmount);
      if (newTotal.greaterThan(toDecimal(invoice.invoiceAmount))) {
        throw new AppError(ErrorCodes.CONFLICT, "Payment would exceed invoice amount", 409);
      }

      const rate = resolveExchangeRateToUsd(invoice.currency, input.exchangeRateToUsd);
      const amountUsd = convertToUsd(paymentAmount, rate);
      const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
      const budgetId = input.budgetId ?? invoice.budgetId;
      if (!budgetId) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          "budgetId required when invoice has no budget allocation",
          422,
        );
      }

      const payment = await tx.invoicePayment.create({
        data: {
          invoiceId,
          amount: paymentAmount,
          currency: invoice.currency,
          exchangeRateToUsd: rate,
          amountUsd,
          paidAt,
          referenceNumber: input.referenceNumber,
          idempotencyKey: input.idempotencyKey,
          notes: input.notes,
          budgetId,
        },
      });

      await tx.budgetTransaction.create({
        data: {
          budget: { connect: { budgetId } },
          purchaseOrder: { connect: { purchaseOrderId: invoice.purchaseOrderId } },
          invoice: { connect: { invoiceId } },
          invoicePayment: { connect: { invoicePaymentId: payment.invoicePaymentId } },
          transactionType: BudgetTransactionType.actualPayment,
          amount: paymentAmount,
          currency: invoice.currency,
          amountUsdReporting: amountUsd,
          exchangeRateToUsd: rate,
          transactionDate: dateOnlyFromPost(paidAt),
          remarks: "Actual paid expenditure (client Wave 2)",
        },
      });

      const status = derivePaymentStatus(toDecimal(invoice.invoiceAmount), newTotal);
      await tx.invoice.update({
        where: { invoiceId },
        data: {
          paymentStatus: status,
          paymentDate: status === InvoicePaymentStatus.paid ? paidAt : invoice.paymentDate,
        },
      });

      await this.audit.record({
        actorUserId: auditContext.actorUserId,
        action: "invoice.record_payment",
        targetType: "invoice",
        targetId: String(invoiceId),
        result: "success",
        requestId: auditContext.requestId,
        metadata: {
          idempotencyKey: input.idempotencyKey,
          amountUsd: amountUsd.toString(),
          exchangeRateToUsd: rate.toString(),
        },
      });

      const paidTotalUsd = sumDecimals([
        ...invoice.payments.map((p) => p.amountUsd),
        amountUsd,
      ]);

      return {
        invoiceId: invoice.invoiceId,
        currency: invoice.currency,
        reportingCurrency: REPORTING_CURRENCY,
        invoiceAmount: invoice.invoiceAmount,
        paidTotal: newTotal,
        paidTotalUsd,
        outstanding: toDecimal(invoice.invoiceAmount).sub(newTotal),
        paymentStatus: status,
        postedAt: invoice.postedAt,
        commitmentAmountUsd: invoice.commitmentAmountUsd,
      };
    });
  }

  async listByPurchaseOrder(purchaseOrderId: bigint) {
    return this.prisma.invoice.findMany({
      where: { purchaseOrderId },
      orderBy: { invoiceDate: "desc" },
    });
  }

  async listPayments(invoiceId: bigint) {
    const invoice = await this.prisma.invoice.findUnique({ where: { invoiceId } });
    if (!invoice) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Invoice not found", 404);
    }
    return this.prisma.invoicePayment.findMany({
      where: { invoiceId },
      orderBy: { paidAt: "asc" },
    });
  }

  async list(
    query: PaginationQuery,
    filters: { search?: string; paymentStatus?: string } = {},
  ) {
    const search = filters.search?.trim();
    const paymentStatus = filters.paymentStatus?.trim();
    const where: Prisma.InvoiceWhereInput = {
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search, mode: "insensitive" } },
              { purchaseOrder: { poNumber: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { invoiceId: "desc" },
        include: { purchaseOrder: true },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { items, total };
  }
}
