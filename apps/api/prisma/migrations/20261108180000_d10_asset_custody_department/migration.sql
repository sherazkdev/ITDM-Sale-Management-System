-- D10: historical receiving department at issuance time (nullable for legacy rows).

ALTER TABLE "asset_movement_documents" ADD COLUMN "receiving_department" VARCHAR(128);

ALTER TABLE "asset_transactions" ADD COLUMN "receiving_department" VARCHAR(128);
