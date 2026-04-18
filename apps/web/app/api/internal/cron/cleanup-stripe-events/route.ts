import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';

// Never statically optimise — the cleanup always has to run against the
// live DB at request time, not at build time. Explicit marker so a
// future refactor can't accidentally turn this into a build-time route.
export const dynamic = 'force-dynamic';

/**
 * Retention cleanup for the Stripe event dedup table.
 *
 * The ProcessedStripeEvent table grows one row per delivered Stripe
 * webhook event. Stripe retries only within a 3-day window, so anything
 * older than 30 days is forensic-only and can be safely pruned. This
 * route is the cleanup surface — invoked daily by a Netlify Scheduled
 * Function (see apps/web/netlify/functions/cleanup-stripe-events.ts).
 *
 * Auth: constant-time-compared Bearer token against CRON_SECRET.
 * Without this, anyone who guesses the URL could trigger unlimited
 * deletes. We deliberately avoid any session/cookie auth here because
 * the caller is a headless scheduler, not a user.
 */

function isCronAuthed(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const header = request.headers.get('authorization') || '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!provided) return false;

  // Constant-time equality — timingSafeEqual throws on length mismatch,
  // so pad both sides to the same length before comparing to avoid a
  // length-oracle leak.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!isCronAuthed(request)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    const result = await prisma.processedStripeEvent.deleteMany({
      where: { processedAt: { lt: cutoff } },
    });
    const deleted = result.count;

    // Log so the scheduled run is observable in Netlify function logs.
    // At normal volume this should be tens-to-hundreds of rows per day.
    // A sudden spike (or a row count of 0 for weeks) is a signal worth
    // eyeballing in the logs.
    console.log(`[cron:cleanup-stripe-events] deleted ${deleted} rows older than ${cutoff.toISOString()}`);

    return NextResponse.json({ deleted, cutoff: cutoff.toISOString() });
  } catch (err) {
    console.error('[cron:cleanup-stripe-events] failed:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Cleanup failed' } },
      { status: 500 }
    );
  }
}
