-- Response screenshot storage
--
-- Adds two nullable columns to track bug-report screenshots. The actual
-- image lives in the Supabase Storage bucket `gotcha-screenshots` under
-- the path <projectId>/<responseId>.jpg (see the upload handler in
-- app/api/v1/responses/route.ts). The columns on Response just index
-- the storage object and record when the capture happened.
--
-- Both columns are nullable — screenshots are strictly opt-in (requires
-- the SDK to be configured with enableScreenshot AND the end user to
-- toggle the bug flag at submission AND the capture to succeed).

ALTER TABLE "Response"
  ADD COLUMN "screenshotPath" TEXT,
  ADD COLUMN "screenshotCapturedAt" TIMESTAMP(3);
