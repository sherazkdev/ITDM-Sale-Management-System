-- Prompt #25: per-recipient expiry notifications (Super Admin only).
ALTER TABLE "notification_events" ADD COLUMN "recipient_user_id" BIGINT;

ALTER TABLE "notification_events"
  ADD CONSTRAINT "notification_events_recipient_user_id_fkey"
  FOREIGN KEY ("recipient_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "notification_events_recipient_user_id_idx" ON "notification_events"("recipient_user_id");
