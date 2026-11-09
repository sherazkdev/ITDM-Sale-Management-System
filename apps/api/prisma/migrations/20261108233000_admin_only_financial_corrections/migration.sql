-- Enforce client-approved Admin role as sole holder of financial.corrections (remove from it_admin_proposed).

INSERT INTO "roles" ("role_key", "display_name", "description", "is_system", "is_active")
SELECT
  'admin',
  'Administrator',
  'Client-approved administrative role',
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "role_key" = 'admin');

DELETE FROM "role_permissions" rp
USING "roles" r, "permissions" p
WHERE rp."role_id" = r."role_id"
  AND rp."permission_id" = p."permission_id"
  AND r."role_key" = 'it_admin_proposed'
  AND p."permission_key" = 'financial.corrections';

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."role_id", p."permission_id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."role_key" = 'admin'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
