-- CleanScore v2 migration (generated manually)

-- CreateEnum
CREATE TYPE "public"."CleanScoreStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "public"."cleanscore_reports"
ADD COLUMN IF NOT EXISTS "status" "public"."CleanScoreStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN IF NOT EXISTS "videos" JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "checklist" JSONB NOT NULL DEFAULT '[]'::jsonb,
ALTER COLUMN "teamMembers" SET DATA TYPE JSONB USING "teamMembers"::jsonb,
ALTER COLUMN "teamMembers" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "photos" SET DATA TYPE JSONB USING "photos"::jsonb,
ALTER COLUMN "photos" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "recommendations" SET DATA TYPE JSONB USING "recommendations"::jsonb,
ALTER COLUMN "recommendations" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "metrics" SET DATA TYPE JSONB USING "metrics"::jsonb,
ALTER COLUMN "score" SET DATA TYPE DOUBLE PRECISION;

-- Indexes to speed up queries
CREATE INDEX IF NOT EXISTS "cleanscore_reports_createdAt_idx" ON "public"."cleanscore_reports" ("createdAt");
CREATE INDEX IF NOT EXISTS "cleanscore_reports_status_idx" ON "public"."cleanscore_reports" ("status");
