-- Stripe webhook event deduplication.
--
-- A row per delivered event.id from Stripe's webhook stream. Inserting
-- with ON CONFLICT DO NOTHING at the top of the webhook handler tells
-- us cheaply whether this event.id has been processed before. If the
-- insert succeeds, we own the event and run the handler body. If the
-- insert is a no-op (conflict), we return 200 immediately and skip all
-- side effects.
--
-- `processedAt` index supports the eventual cleanup job that deletes
-- rows older than 30 days (Stripe retries for 3 days — anything older
-- is forensic-only).
CREATE TABLE "ProcessedStripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedStripeEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProcessedStripeEvent_processedAt_idx" ON "ProcessedStripeEvent"("processedAt");
