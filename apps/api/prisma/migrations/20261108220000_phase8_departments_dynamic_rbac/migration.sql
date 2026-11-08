-- Phase 8 — Department master data, legacy labels, role metadata

CREATE TABLE "departments" (
    "department_id" BIGSERIAL NOT NULL,
    "department_code" VARCHAR(64) NOT NULL,
    "department_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("department_id")
);

CREATE UNIQUE INDEX "departments_department_code_key" ON "departments"("department_code");

CREATE TABLE "department_legacy_labels" (
    "legacy_label" VARCHAR(128) NOT NULL,
    "department_id" BIGINT,
    "review_status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "department_legacy_labels_pkey" PRIMARY KEY ("legacy_label")
);

ALTER TABLE "department_legacy_labels"
ADD CONSTRAINT "department_legacy_labels_department_id_fkey"
FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employees" ADD COLUMN "department_id" BIGINT;

ALTER TABLE "employees"
ADD CONSTRAINT "employees_department_id_fkey"
FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");

ALTER TABLE "roles" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "roles" ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "roles" ADD COLUMN "color_key" VARCHAR(32);

-- Seed legacy label inventory (exact strings only — no synonym merge)
INSERT INTO "department_legacy_labels" ("legacy_label", "review_status", "updated_at")
SELECT DISTINCT trim("department"), 'pending', CURRENT_TIMESTAMP
FROM "employees"
WHERE "department" IS NOT NULL AND trim("department") <> ''
ON CONFLICT ("legacy_label") DO NOTHING;

-- One department row per distinct legacy label (department_name = exact legacy text)
INSERT INTO "departments" ("department_code", "department_name", "is_active", "updated_at")
SELECT
    'dept_' || substr(md5(l."legacy_label"), 1, 12),
    l."legacy_label",
    true,
    CURRENT_TIMESTAMP
FROM "department_legacy_labels" AS l
WHERE NOT EXISTS (
  SELECT 1 FROM "departments" AS d WHERE d."department_name" = l."legacy_label"
);

UPDATE "department_legacy_labels" AS l
SET "department_id" = d."department_id",
    "review_status" = 'linked',
    "updated_at" = CURRENT_TIMESTAMP
FROM "departments" AS d
WHERE d."department_name" = l."legacy_label";

UPDATE "employees" AS e
SET "department_id" = l."department_id"
FROM "department_legacy_labels" AS l
WHERE trim(e."department") = l."legacy_label"
  AND l."department_id" IS NOT NULL;

UPDATE "roles" SET "is_system" = true WHERE "role_key" IN ('it_admin_proposed', 'admin');

INSERT INTO "permissions" ("permission_key", "description")
VALUES
  ('departments.read', 'View department directory'),
  ('departments.manage', 'Create and maintain departments'),
  ('roles.manage', 'Manage custom roles and permission assignments')
ON CONFLICT ("permission_key") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."role_id", p."permission_id"
FROM "roles" AS r
CROSS JOIN "permissions" AS p
WHERE r."role_key" = 'it_admin_proposed'
  AND p."permission_key" IN ('departments.read', 'departments.manage', 'roles.manage')
ON CONFLICT DO NOTHING;
