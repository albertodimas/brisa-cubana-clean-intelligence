-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TestimonialStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_REMINDER_24H';
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_REMINDER_1H';
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_STATUS_CHANGED';

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "bookingId" TEXT,
ADD COLUMN     "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "subject" TEXT;

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "status" "TestimonialStatus" NOT NULL DEFAULT 'PENDING',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingTier" (
    "id" TEXT NOT NULL,
    "tierCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "description" TEXT,
    "price" TEXT NOT NULL,
    "priceSuffix" TEXT,
    "features" JSONB NOT NULL,
    "addons" JSONB,
    "highlighted" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioStats" (
    "id" TEXT NOT NULL,
    "activeProperties" INTEGER NOT NULL,
    "averageRating" DECIMAL(3,2) NOT NULL,
    "totalTurnovers" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketStat" (
    "id" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "valueMax" DECIMAL(10,2),
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "period" TEXT,
    "notes" TEXT,
    "presentation" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Testimonial_status_isActive_order_idx" ON "Testimonial"("status", "isActive", "order");

-- CreateIndex
CREATE INDEX "FAQ_isActive_order_idx" ON "FAQ"("isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PricingTier_tierCode_key" ON "PricingTier"("tierCode");

-- CreateIndex
CREATE INDEX "PricingTier_isActive_order_idx" ON "PricingTier"("isActive", "order");

-- CreateIndex
CREATE INDEX "PortfolioStats_createdAt_idx" ON "PortfolioStats"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "MarketStat_metricId_key" ON "MarketStat"("metricId");

-- CreateIndex
CREATE INDEX "MarketStat_metricId_idx" ON "MarketStat"("metricId");

-- CreateIndex
CREATE INDEX "Invoice_stripePaymentIntentId_idx" ON "Invoice"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Notification_status_createdAt_idx" ON "Notification"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_bookingId_idx" ON "Notification"("bookingId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
