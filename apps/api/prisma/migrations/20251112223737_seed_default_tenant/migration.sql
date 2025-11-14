
-- Seed default tenant and backfill existing data
DO $$
DECLARE
  tenant_id CONSTANT text := 'tenant_brisa_cubana';
BEGIN
  INSERT INTO "Tenant" ("id", "slug", "name", "plan", "status", "createdAt", "updatedAt")
  VALUES (
    tenant_id,
    'brisa-cubana',
    'Brisa Cubana Clean Intelligence',
    'SCALE',
    'ACTIVE',
    NOW(),
    NOW()
  )
  ON CONFLICT ("slug") DO UPDATE
    SET "updatedAt" = NOW();

  UPDATE "Property" SET "tenantId" = tenant_id WHERE "tenantId" IS NULL;
  UPDATE "Service" SET "tenantId" = tenant_id WHERE "tenantId" IS NULL;
  UPDATE "Booking" SET "tenantId" = tenant_id WHERE "tenantId" IS NULL;
  UPDATE "Notification" SET "tenantId" = tenant_id WHERE "tenantId" IS NULL;
  UPDATE "PortalSession" SET "tenantId" = tenant_id WHERE "tenantId" IS NULL;
  UPDATE "Lead" SET "tenantId" = tenant_id WHERE "tenantId" IS NULL;
  UPDATE "Invoice" SET "tenantId" = tenant_id WHERE "tenantId" IS NULL;

  INSERT INTO "UserTenant" ("id", "userId", "tenantId", "role", "createdAt")
  SELECT
    CONCAT('ut_', substr(md5(random()::text || clock_timestamp()::text), 1, 24)),
    "User"."id",
    tenant_id,
    "User"."role",
    NOW()
  FROM "User"
  WHERE NOT EXISTS (
    SELECT 1 FROM "UserTenant" ut
    WHERE ut."userId" = "User"."id" AND ut."tenantId" = tenant_id
  );
END $$;
-- This is an empty migration.
