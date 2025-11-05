-- Create table to persist Stripe webhook processing state
CREATE TABLE "StripeWebhookEvent" (
  "id" TEXT NOT NULL,
  "stripeEventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "processedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- Ensure deduplication of incoming webhooks
CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key"
  ON "StripeWebhookEvent"("stripeEventId");

-- Support lookups by status/type and chronological ordering
CREATE INDEX "StripeWebhookEvent_eventType_processed_idx"
  ON "StripeWebhookEvent"("eventType", "processed");
CREATE INDEX "StripeWebhookEvent_createdAt_idx"
  ON "StripeWebhookEvent"("createdAt");
CREATE INDEX "StripeWebhookEvent_stripeEventId_idx"
  ON "StripeWebhookEvent"("stripeEventId");
