-- Wave 1: non-asset quantity inventory (D09 partial) — does not alter serialized assets.

CREATE TABLE "non_asset_stock_items" (
    "stock_item_id" BIGSERIAL NOT NULL,
    "stock_code" VARCHAR(64) NOT NULL,
    "item_name" VARCHAR(255) NOT NULL,
    "category_id" BIGINT NOT NULL,
    "quantity_on_hand" DECIMAL(18,4) NOT NULL,
    "unit_of_measure" VARCHAR(32) NOT NULL,
    "current_location" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "non_asset_stock_items_pkey" PRIMARY KEY ("stock_item_id")
);

CREATE UNIQUE INDEX "non_asset_stock_items_stock_code_key" ON "non_asset_stock_items"("stock_code");
CREATE INDEX "non_asset_stock_items_category_id_idx" ON "non_asset_stock_items"("category_id");
CREATE INDEX "non_asset_stock_items_unit_of_measure_idx" ON "non_asset_stock_items"("unit_of_measure");

ALTER TABLE "non_asset_stock_items" ADD CONSTRAINT "non_asset_stock_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "asset_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;
