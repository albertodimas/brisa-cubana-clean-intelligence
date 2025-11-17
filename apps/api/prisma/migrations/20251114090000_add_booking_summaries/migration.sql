-- CreateTable
CREATE TABLE "BookingSummary" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "tenantId" TEXT,
    "summary" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingSummary_bookingId_key" ON "BookingSummary"("bookingId");

-- CreateIndex
CREATE INDEX "BookingSummary_tenantId_idx" ON "BookingSummary"("tenantId");

-- AddForeignKey
ALTER TABLE "BookingSummary" ADD CONSTRAINT "BookingSummary_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSummary" ADD CONSTRAINT "BookingSummary_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
