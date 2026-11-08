-- Phase 7: user profile, avatar storage key, and theme preferences
ALTER TABLE "users" ADD COLUMN "profile_phone" VARCHAR(64);
ALTER TABLE "users" ADD COLUMN "profile_location" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN "profile_bio" TEXT;
ALTER TABLE "users" ADD COLUMN "avatar_storage_key" VARCHAR(512);
ALTER TABLE "users" ADD COLUMN "theme_preferences" JSONB;
