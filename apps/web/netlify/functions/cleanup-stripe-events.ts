// Scheduled function — daily at 03:17 UTC (quiet hour, off-the-hour to
// avoid cron-second-thundering-herd with every other :00 scheduled job
// on the Netlify fleet).
//
// Fires an authenticated POST at the cleanup route; the route owns the
// actual DELETE so the schedule and the work are separable (route can
// be triggered manually for ad-hoc cleanup, scheduler can be swapped
// without touching the DB code).
export default async () => {
  const url = process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  const secret = process.env.CRON_SECRET;

  // Fail closed rather than defaulting to a hard-coded prod URL. Without
  // this guard, a misconfigured preview deploy (no SITE_URL, no
  // NEXT_PUBLIC_APP_URL) would happily hammer production.
  if (!url) {
    console.error('[cron:cleanup-stripe-events] SITE_URL / NEXT_PUBLIC_APP_URL not set — skipping run');
    return new Response('site URL not set', { status: 500 });
  }

  if (!secret) {
    console.error('[cron:cleanup-stripe-events] CRON_SECRET not set — skipping run');
    return new Response('CRON_SECRET not set', { status: 500 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${url}/api/internal/cron/cleanup-stripe-events`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}` },
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`[cron:cleanup-stripe-events] route returned ${res.status}`);
      return new Response(`route ${res.status}`, { status: 500 });
    }

    const body = await res.text();
    console.log(`[cron:cleanup-stripe-events] ok: ${body}`);
    return new Response('OK');
  } catch (err) {
    console.error(
      '[cron:cleanup-stripe-events] fetch failed:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return new Response('fetch failed', { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
};

export const config = {
  // Daily at 03:17 UTC
  schedule: '17 3 * * *',
};
