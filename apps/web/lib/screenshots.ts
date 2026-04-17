import { createServiceClient } from '@/lib/supabase/server';

/**
 * Bug-report screenshot storage.
 *
 * Screenshots are written to the private Supabase Storage bucket
 * `gotcha-screenshots` under the path `<projectId>/<responseId>.<ext>`. The
 * bucket is locked down by RLS (see migration 20260417000001) — the service
 * role (bypassing RLS) is the only writer and reader. The dashboard never
 * reads objects directly; it asks for a short-lived signed URL via
 * `GET /api/responses/[id]/screenshot`.
 */

export const SCREENSHOT_BUCKET = 'gotcha-screenshots';

// Base64 data URL expansion overhead is ~4/3. Reject before decoding to
// avoid spending CPU on anything that can't fit the 2MB binary cap.
const MAX_BASE64_LEN = 2_800_000;
const MAX_BINARY_BYTES = 2 * 1024 * 1024;

// Signed URL lifetime when the dashboard requests a view URL. Short
// enough that a leaked devtools / HAR-export / screenshare URL stops
// working quickly; long enough to cover slow image loads on flaky
// mobile networks. Screenshots can contain bystander PII (names,
// emails visible in the captured page) so 5 min is the conservative
// choice — refetch cost on the dashboard is negligible.
export const SIGNED_URL_TTL_SECONDS = 60 * 5; // 5 min

type MimeType = 'image/jpeg' | 'image/png';
const MIME_EXTENSIONS: Record<MimeType, 'jpg' | 'png'> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export interface ParsedScreenshot {
  mimeType: MimeType;
  extension: 'jpg' | 'png';
  bytes: Buffer;
}

/**
 * Validate and decode a base64 data URL. Returns null (plus a reason) on any
 * bad input — the route uses the null case to log-and-skip rather than
 * rejecting the whole response submission. We never want a malformed
 * screenshot to lose the user's actual feedback content.
 */
export function parseScreenshotDataUrl(
  dataUrl: string
): { ok: true; value: ParsedScreenshot } | { ok: false; reason: string } {
  if (dataUrl.length > MAX_BASE64_LEN) {
    return { ok: false, reason: 'payload-too-large' };
  }

  const match = dataUrl.match(/^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    return { ok: false, reason: 'invalid-data-url' };
  }

  const mimeType = match[1] as MimeType;
  const base64 = match[2];

  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, 'base64');
  } catch {
    return { ok: false, reason: 'base64-decode-failed' };
  }

  if (bytes.length > MAX_BINARY_BYTES) {
    return { ok: false, reason: 'binary-too-large' };
  }

  // MIME sniff — reject anything that claims JPEG/PNG but doesn't start with
  // the right magic bytes. Stops a caller from smuggling arbitrary binary
  // payloads through the image field.
  const magicOk =
    (mimeType === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (mimeType === 'image/png' &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47);
  if (!magicOk) {
    return { ok: false, reason: 'mime-magic-mismatch' };
  }

  return {
    ok: true,
    value: {
      mimeType,
      extension: MIME_EXTENSIONS[mimeType],
      bytes,
    },
  };
}

/**
 * Upload a decoded screenshot to the private bucket and return the object
 * path. Uses upsert so a re-submit (rare — idempotency usually catches it
 * upstream) overwrites in place instead of creating orphans.
 */
export async function uploadScreenshot(
  projectId: string,
  responseId: string,
  screenshot: ParsedScreenshot
): Promise<string | null> {
  const path = `${projectId}/${responseId}.${screenshot.extension}`;
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(SCREENSHOT_BUCKET).upload(path, screenshot.bytes, {
    contentType: screenshot.mimeType,
    upsert: true,
  });
  if (error) {
    console.warn('screenshot upload failed', {
      projectId,
      responseId,
      code: error.name,
      message: error.message,
    });
    return null;
  }
  return path;
}

/**
 * Exchange a stored object path for a short-lived signed URL. Returns null
 * if Supabase Storage reports an error (missing object, policy failure) so
 * callers can render a clean "unavailable" state instead of a 500.
 */
export async function createScreenshotSignedUrl(
  path: string
): Promise<{ url: string; expiresAt: string } | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    console.warn('screenshot signed-url failed', {
      path,
      code: error?.name,
      message: error?.message,
    });
    return null;
  }
  return {
    url: data.signedUrl,
    expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString(),
  };
}
