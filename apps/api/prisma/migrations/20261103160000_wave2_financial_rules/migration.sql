-- Wave 2: client-approved financial rules (D05–D08 partial) — preserve existing rows.

ALTER TABLE "invoices" ADD COLUMN "currency" CHAR(3);
ALTER TABLE "invoices" ADD COLUMN "posted_at" TIMESTAMPTZ(6);
ALTER TABLE "invoices" ADD COLUMN "budget_id" BIGINT;
ALTER TABLE "invoices" ADD COLUMN "commitment_exchange_rate_to_usd" DECIMAL(18,8);
ALTER TABLE "invoices" ADD COLUMN "commitment_amount_usd" DECIMAL(18,2);

UPDATE "invoices" i
SET "currency" = po."currency"
FROM "purchase_orders" po
WHERE po."purchase_order_id" = i."purchase_order_id" AND i."currency" IS NULL;

UPDATE "invoices" SET "currency" = 'USD' WHERE "currency" IS NULL;

ALTER TABLE "invoices" ALTER COLUMN "currency" SET NOT NULL;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_budget_id_fkey"
  FOREIGN KEY ("budget_id") REFERENCES "budget_allocations"("budget_id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "invoices_posted_at_idx" ON "invoices"("posted_at");

ALTER TABLE "invoice_payments" ADD COLUMN "currency" CHAR(3);
ALTER TABLE "invoice_payments" ADD COLUMN "exchange_rate_to_usd" DECIMAL(18,8);
ALTER TABLE "invoice_payments" ADD COLUMN "amount_usd" DECIMAL(18,2);
ALTER TABLE "invoice_payments" ADD COLUMN "budget_id" BIGINT;

UPDATE "invoice_payments" p
SET
  "currency" = i."currency",
  "exchange_rate_to_usd" = 1,
  "amount_usd" = p."amount"
FROM "invoices" i
WHERE i."invoice_id" = p."invoice_id";

ALTER TABLE "invoice_payments" ALTER COLUMN "currency" SET NOT NULL;
ALTER TABLE "invoice_payments" ALTER COLUMN "exchange_rate_to_usd" SET NOT NULL;
ALTER TABLE "invoice_payments" ALTER COLUMN "amount_usd" SET NOT NULL;

ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_budget_id_fkey"
  FOREIGN KEY ("budget_id") REFERENCES "budget_allocations"("budget_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "budget_transactions" ADD COLUMN "currency" CHAR(3);
ALTER TABLE "budget_transactions" ADD COLUMN "amount_usd_reporting" DECIMAL(18,2);
ALTER TABLE "budget_transactions" ADD COLUMN "exchange_rate_to_usd" DECIMAL(18,8);
ALTER TABLE "budget_transactions" ADD COLUMN "invoice_payment_id" BIGINT;

CREATE UNIQUE INDEX "budget_transactions_invoice_payment_id_key"
  ON "budget_transactions"("invoice_payment_id") WHERE "invoice_payment_id" IS NOT NULL;

ALTER TABLE "budget_transactions" ADD CONSTRAINT "budget_transactions_invoice_payment_id_fkey"
  FOREIGN KEY ("invoice_payment_id") REFERENCES "invoice_payments"("invoice_payment_id") ON DELETE RESTRICT ON UPDATE CASCADE;
