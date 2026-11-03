-- Phase 02: indexes aligned to expiry scans, dashboard aggregates, and notification unread filters.
-- Evidence: notification expiry range queries, dashboard groupBy status fields, unread notification counts.

CREATE INDEX "contracts_expiry_date_idx" ON "contracts"("expiry_date");
CREATE INDEX "purchase_orders_valid_until_idx" ON "purchase_orders"("valid_until");
CREATE INDEX "assets_asset_status_idx" ON "assets"("asset_status");
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");
CREATE INDEX "maintenance_records_status_idx" ON "maintenance_records"("status");
CREATE INDEX "notification_events_read_at_idx" ON "notification_events"("read_at");
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");
CREATE INDEX "invoices_payment_status_idx" ON "invoices"("payment_status");
