-- CreateEnum
CREATE TYPE "asset_transaction_type" AS ENUM ('issue', 'return');

-- CreateEnum
CREATE TYPE "asset_movement_document_type" AS ENUM ('issuance', 'return');

-- CreateTable
CREATE TABLE "employees" (
    "employee_id" BIGSERIAL NOT NULL,
    "employee_number" VARCHAR(64) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "department" VARCHAR(128),
    "designation" VARCHAR(128),
    "contact_number" VARCHAR(64),
    "email" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "asset_categories" (
    "category_id" BIGSERIAL NOT NULL,
    "category_name" VARCHAR(128) NOT NULL,
    "description" TEXT,

    CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "vendor_id" BIGSERIAL NOT NULL,
    "vendor_name" VARCHAR(255) NOT NULL,
    "registration_number" VARCHAR(128),
    "contact_person" VARCHAR(255),
    "phone" VARCHAR(64),
    "email" VARCHAR(255),
    "address" TEXT,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("vendor_id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "contract_id" BIGSERIAL NOT NULL,
    "contract_number" VARCHAR(64) NOT NULL,
    "vendor_id" BIGINT NOT NULL,
    "start_date" DATE NOT NULL,
    "expiry_date" DATE NOT NULL,
    "contract_value" DECIMAL(18,2),
    "renewal_status" VARCHAR(64),
    "document_path" VARCHAR(512),

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("contract_id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "purchase_order_id" BIGSERIAL NOT NULL,
    "po_number" VARCHAR(64) NOT NULL,
    "vendor_id" BIGINT NOT NULL,
    "contract_id" BIGINT,
    "po_date" DATE NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "document_path" VARCHAR(512),

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("purchase_order_id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "invoice_id" BIGSERIAL NOT NULL,
    "invoice_number" VARCHAR(64) NOT NULL,
    "purchase_order_id" BIGINT NOT NULL,
    "invoice_date" DATE NOT NULL,
    "invoice_amount" DECIMAL(18,2) NOT NULL,
    "payment_status" VARCHAR(64) NOT NULL,
    "payment_date" DATE,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "assets" (
    "asset_id" BIGSERIAL NOT NULL,
    "asset_code" VARCHAR(64) NOT NULL,
    "asset_name" VARCHAR(255) NOT NULL,
    "category_id" BIGINT NOT NULL,
    "serial_number" VARCHAR(128),
    "purchase_order_id" BIGINT,
    "purchase_date" DATE,
    "purchase_cost" DECIMAL(18,2),
    "asset_status" VARCHAR(64) NOT NULL,
    "current_location" VARCHAR(255),
    "current_assignee_employee_id" BIGINT,
    "purchase_order_line_id" BIGINT,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("asset_id")
);

-- CreateTable
CREATE TABLE "asset_transactions" (
    "transaction_id" BIGSERIAL NOT NULL,
    "asset_id" BIGINT NOT NULL,
    "employee_id" BIGINT,
    "transaction_type" "asset_transaction_type" NOT NULL,
    "transaction_date" TIMESTAMPTZ(6) NOT NULL,
    "condition_notes" TEXT,
    "reference_number" VARCHAR(64),
    "processed_by_user_id" BIGINT,
    "movement_document_id" BIGINT,
    "remarks" TEXT,

    CONSTRAINT "asset_transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "maintenance_id" BIGSERIAL NOT NULL,
    "asset_id" BIGINT,
    "contract_id" BIGINT,
    "vendor_id" BIGINT,
    "maintenance_type" VARCHAR(128) NOT NULL,
    "request_date" DATE NOT NULL,
    "completion_date" DATE,
    "cost" DECIMAL(18,2),
    "status" VARCHAR(64) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("maintenance_id")
);

-- CreateTable
CREATE TABLE "software_licenses" (
    "license_id" BIGSERIAL NOT NULL,
    "software_name" VARCHAR(255) NOT NULL,
    "license_key_reference" VARCHAR(255),
    "vendor_id" BIGINT,
    "purchase_order_id" BIGINT,
    "start_date" DATE NOT NULL,
    "expiry_date" DATE NOT NULL,
    "license_quantity" INTEGER NOT NULL,
    "renewal_cost" DECIMAL(18,2),
    "status" VARCHAR(64) NOT NULL,

    CONSTRAINT "software_licenses_pkey" PRIMARY KEY ("license_id")
);

-- CreateTable
CREATE TABLE "financial_years" (
    "financial_year_id" BIGSERIAL NOT NULL,
    "year_name" VARCHAR(32) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" VARCHAR(64) NOT NULL,

    CONSTRAINT "financial_years_pkey" PRIMARY KEY ("financial_year_id")
);

-- CreateTable
CREATE TABLE "budget_allocations" (
    "budget_id" BIGSERIAL NOT NULL,
    "financial_year_id" BIGINT NOT NULL,
    "budget_category" VARCHAR(128) NOT NULL,
    "allocated_amount" DECIMAL(18,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,

    CONSTRAINT "budget_allocations_pkey" PRIMARY KEY ("budget_id")
);

-- CreateTable
CREATE TABLE "budget_transactions" (
    "budget_transaction_id" BIGSERIAL NOT NULL,
    "budget_id" BIGINT NOT NULL,
    "purchase_order_id" BIGINT,
    "invoice_id" BIGINT,
    "transaction_type" VARCHAR(64) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "transaction_date" DATE NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "budget_transactions_pkey" PRIMARY KEY ("budget_transaction_id")
);

-- CreateTable
CREATE TABLE "purchase_order_lines" (
    "purchase_order_line_id" BIGSERIAL NOT NULL,
    "purchase_order_id" BIGINT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "description" VARCHAR(512) NOT NULL,
    "line_type" VARCHAR(32) NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "line_subtotal" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("purchase_order_line_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" BIGSERIAL NOT NULL,
    "username" VARCHAR(128) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "employee_id" BIGINT,
    "password_changed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "role_id" BIGSERIAL NOT NULL,
    "role_key" VARCHAR(64) NOT NULL,
    "display_name" VARCHAR(128) NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "permission_id" BIGSERIAL NOT NULL,
    "permission_key" VARCHAR(128) NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "session_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "login_attempt_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "username_attempt" VARCHAR(128) NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ip_address" VARCHAR(64),
    "attempted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("login_attempt_id")
);

-- CreateTable
CREATE TABLE "invoice_payments" (
    "invoice_payment_id" BIGSERIAL NOT NULL,
    "invoice_id" BIGINT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "paid_at" TIMESTAMPTZ(6) NOT NULL,
    "reference_number" VARCHAR(64),
    "idempotency_key" VARCHAR(128),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("invoice_payment_id")
);

-- CreateTable
CREATE TABLE "asset_movement_documents" (
    "document_id" BIGSERIAL NOT NULL,
    "document_type" "asset_movement_document_type" NOT NULL,
    "reference_number" VARCHAR(64),
    "employee_id" BIGINT,
    "processed_by_user_id" BIGINT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_movement_documents_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "asset_movement_document_lines" (
    "document_line_id" BIGSERIAL NOT NULL,
    "document_id" BIGINT NOT NULL,
    "asset_id" BIGINT NOT NULL,
    "transaction_id" BIGINT,

    CONSTRAINT "asset_movement_document_lines_pkey" PRIMARY KEY ("document_line_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "audit_log_id" BIGSERIAL NOT NULL,
    "actor_user_id" BIGINT,
    "action" VARCHAR(128) NOT NULL,
    "target_type" VARCHAR(64) NOT NULL,
    "target_id" VARCHAR(64),
    "result" VARCHAR(32) NOT NULL,
    "metadata" JSONB,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "request_id" VARCHAR(128),

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("audit_log_id")
);

-- CreateTable
CREATE TABLE "stored_documents" (
    "stored_document_id" BIGSERIAL NOT NULL,
    "storage_key" VARCHAR(512) NOT NULL,
    "original_file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(128) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "uploaded_by_user_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stored_documents_pkey" PRIMARY KEY ("stored_document_id")
);

-- CreateTable
CREATE TABLE "notification_events" (
    "notification_event_id" BIGSERIAL NOT NULL,
    "event_type" VARCHAR(64) NOT NULL,
    "entity_type" VARCHAR(64) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "due_on" DATE NOT NULL,
    "dedupe_key" VARCHAR(255) NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_events_pkey" PRIMARY KEY ("notification_event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_number_key" ON "employees"("employee_number");

-- CreateIndex
CREATE UNIQUE INDEX "asset_categories_category_name_key" ON "asset_categories"("category_name");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contract_number_key" ON "contracts"("contract_number");

-- CreateIndex
CREATE INDEX "contracts_vendor_id_idx" ON "contracts"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

-- CreateIndex
CREATE INDEX "purchase_orders_vendor_id_idx" ON "purchase_orders"("vendor_id");

-- CreateIndex
CREATE INDEX "purchase_orders_contract_id_idx" ON "purchase_orders"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_purchase_order_id_idx" ON "invoices"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "assets_asset_code_key" ON "assets"("asset_code");

-- CreateIndex
CREATE INDEX "assets_category_id_idx" ON "assets"("category_id");

-- CreateIndex
CREATE INDEX "assets_purchase_order_id_idx" ON "assets"("purchase_order_id");

-- CreateIndex
CREATE INDEX "assets_purchase_order_line_id_idx" ON "assets"("purchase_order_line_id");

-- CreateIndex
CREATE INDEX "assets_current_assignee_employee_id_idx" ON "assets"("current_assignee_employee_id");

-- CreateIndex
CREATE INDEX "asset_transactions_asset_id_idx" ON "asset_transactions"("asset_id");

-- CreateIndex
CREATE INDEX "asset_transactions_employee_id_idx" ON "asset_transactions"("employee_id");

-- CreateIndex
CREATE INDEX "asset_transactions_transaction_date_idx" ON "asset_transactions"("transaction_date");

-- CreateIndex
CREATE INDEX "asset_transactions_processed_by_user_id_idx" ON "asset_transactions"("processed_by_user_id");

-- CreateIndex
CREATE INDEX "asset_transactions_movement_document_id_idx" ON "asset_transactions"("movement_document_id");

-- CreateIndex
CREATE INDEX "maintenance_records_asset_id_idx" ON "maintenance_records"("asset_id");

-- CreateIndex
CREATE INDEX "maintenance_records_contract_id_idx" ON "maintenance_records"("contract_id");

-- CreateIndex
CREATE INDEX "maintenance_records_vendor_id_idx" ON "maintenance_records"("vendor_id");

-- CreateIndex
CREATE INDEX "software_licenses_vendor_id_idx" ON "software_licenses"("vendor_id");

-- CreateIndex
CREATE INDEX "software_licenses_purchase_order_id_idx" ON "software_licenses"("purchase_order_id");

-- CreateIndex
CREATE INDEX "software_licenses_expiry_date_idx" ON "software_licenses"("expiry_date");

-- CreateIndex
CREATE UNIQUE INDEX "financial_years_year_name_key" ON "financial_years"("year_name");

-- CreateIndex
CREATE INDEX "budget_allocations_financial_year_id_idx" ON "budget_allocations"("financial_year_id");

-- CreateIndex
CREATE INDEX "budget_transactions_budget_id_idx" ON "budget_transactions"("budget_id");

-- CreateIndex
CREATE INDEX "budget_transactions_purchase_order_id_idx" ON "budget_transactions"("purchase_order_id");

-- CreateIndex
CREATE INDEX "budget_transactions_invoice_id_idx" ON "budget_transactions"("invoice_id");

-- CreateIndex
CREATE INDEX "purchase_order_lines_purchase_order_id_idx" ON "purchase_order_lines"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_lines_purchase_order_id_line_number_key" ON "purchase_order_lines"("purchase_order_id", "line_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_key_key" ON "roles"("role_key");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_key_key" ON "permissions"("permission_key");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "login_attempts_username_attempt_attempted_at_idx" ON "login_attempts"("username_attempt", "attempted_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_payments_idempotency_key_key" ON "invoice_payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "invoice_payments_invoice_id_idx" ON "invoice_payments"("invoice_id");

-- CreateIndex
CREATE INDEX "asset_movement_documents_employee_id_idx" ON "asset_movement_documents"("employee_id");

-- CreateIndex
CREATE INDEX "asset_movement_documents_reference_number_idx" ON "asset_movement_documents"("reference_number");

-- CreateIndex
CREATE UNIQUE INDEX "asset_movement_document_lines_transaction_id_key" ON "asset_movement_document_lines"("transaction_id");

-- CreateIndex
CREATE INDEX "asset_movement_document_lines_document_id_idx" ON "asset_movement_document_lines"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_movement_document_lines_document_id_asset_id_key" ON "asset_movement_document_lines"("document_id", "asset_id");

-- CreateIndex
CREATE INDEX "audit_logs_occurred_at_idx" ON "audit_logs"("occurred_at");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "stored_documents_storage_key_key" ON "stored_documents"("storage_key");

-- CreateIndex
CREATE UNIQUE INDEX "notification_events_dedupe_key_key" ON "notification_events"("dedupe_key");

-- CreateIndex
CREATE INDEX "notification_events_due_on_idx" ON "notification_events"("due_on");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("contract_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("purchase_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "asset_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("purchase_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_purchase_order_line_id_fkey" FOREIGN KEY ("purchase_order_line_id") REFERENCES "purchase_order_lines"("purchase_order_line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_current_assignee_employee_id_fkey" FOREIGN KEY ("current_assignee_employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transactions" ADD CONSTRAINT "asset_transactions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transactions" ADD CONSTRAINT "asset_transactions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transactions" ADD CONSTRAINT "asset_transactions_processed_by_user_id_fkey" FOREIGN KEY ("processed_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transactions" ADD CONSTRAINT "asset_transactions_movement_document_id_fkey" FOREIGN KEY ("movement_document_id") REFERENCES "asset_movement_documents"("document_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("contract_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_licenses" ADD CONSTRAINT "software_licenses_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_licenses" ADD CONSTRAINT "software_licenses_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("purchase_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_financial_year_id_fkey" FOREIGN KEY ("financial_year_id") REFERENCES "financial_years"("financial_year_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_transactions" ADD CONSTRAINT "budget_transactions_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budget_allocations"("budget_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_transactions" ADD CONSTRAINT "budget_transactions_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("purchase_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_transactions" ADD CONSTRAINT "budget_transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("purchase_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("permission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_movement_documents" ADD CONSTRAINT "asset_movement_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_movement_documents" ADD CONSTRAINT "asset_movement_documents_processed_by_user_id_fkey" FOREIGN KEY ("processed_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_movement_document_lines" ADD CONSTRAINT "asset_movement_document_lines_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "asset_movement_documents"("document_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_movement_document_lines" ADD CONSTRAINT "asset_movement_document_lines_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_movement_document_lines" ADD CONSTRAINT "asset_movement_document_lines_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "asset_transactions"("transaction_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_documents" ADD CONSTRAINT "stored_documents_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
