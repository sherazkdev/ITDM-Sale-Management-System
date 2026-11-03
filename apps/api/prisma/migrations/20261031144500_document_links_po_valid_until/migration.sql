-- Document ownership links + optional PO valid_until (PROPOSED D04 semantics)

ALTER TABLE "purchase_orders" ADD COLUMN "valid_until" DATE;

CREATE TABLE "document_links" (
    "document_link_id" BIGSERIAL NOT NULL,
    "stored_document_id" BIGINT NOT NULL,
    "owner_type" VARCHAR(64) NOT NULL,
    "owner_id" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_links_pkey" PRIMARY KEY ("document_link_id")
);

CREATE UNIQUE INDEX "document_links_stored_document_id_key" ON "document_links"("stored_document_id");
CREATE INDEX "document_links_owner_type_owner_id_idx" ON "document_links"("owner_type", "owner_id");

ALTER TABLE "document_links" ADD CONSTRAINT "document_links_stored_document_id_fkey" FOREIGN KEY ("stored_document_id") REFERENCES "stored_documents"("stored_document_id") ON DELETE RESTRICT ON UPDATE CASCADE;
