-- Wave 3: non-asset stock metadata (PO link, receipt date, item type) — backward compatible.

ALTER TABLE "non_asset_stock_items" ADD COLUMN "item_type" VARCHAR(64);
ALTER TABLE "non_asset_stock_items" ADD COLUMN "purchase_order_id" BIGINT;
ALTER TABLE "non_asset_stock_items" ADD COLUMN "stock_received_date" DATE;

UPDATE "non_asset_stock_items"
SET "stock_received_date" = ("created_at" AT TIME ZONE 'UTC')::date
WHERE "stock_received_date" IS NULL;

ALTER TABLE "non_asset_stock_items" ALTER COLUMN "stock_received_date" SET NOT NULL;

ALTER TABLE "non_asset_stock_items" ADD CONSTRAINT "non_asset_stock_items_purchase_order_id_fkey"
  FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("purchase_order_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "non_asset_stock_items_purchase_order_id_idx" ON "non_asset_stock_items"("purchase_order_id");
CREATE INDEX "non_asset_stock_items_stock_received_date_idx" ON "non_asset_stock_items"("stock_received_date");
