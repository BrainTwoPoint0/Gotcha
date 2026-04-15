import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';
import { sendShippedNotification } from '@/lib/emails/send';

// Triage values are pre-existing inbox states. Lifecycle values are the
// Canny-style loop the public roadmap renders. Both groups are valid
// targets — the dashboard surfaces them under separate dropdown headings.
const TRIAGE_STATUSES = ['NEW', 'REVIEWED', 'ADDRESSED', 'ARCHIVED'] as const;
const LIFECYCLE_STATUSES = [
  'UNDER_REVIEW',
  'PLANNED',
  'IN_PROGRESS',
  'SHIPPED',
  'DECLINED',
] as const;
const VALID_STATUSES = [...TRIAGE_STATUSES, ...LIFECYCLE_STATUSES] as const;
type ResponseStatus = (typeof VALID_STATUSES)[number];

// Cap matches Twitter — defensible default that fits cleanly in a notify-back
// email body block without wrapping. Bumping this beyond ~500 starts breaking
// the email layout, so keep the constant pinned with the rationale.
const NOTE_MAX_LEN = 280;

// Per-project monthly cap on shipped-notification emails. Protects Gotcha's
// sending reputation from a malicious customer seeding many submitter emails
// then spamming SHIPPED transitions. Generous enough that it never bites
// honest customers (most projects ship < 200 features/month).
const NOTIFIES_MONTHLY_CAP = 200;

function startOfCurrentMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!request.headers.get('x-requested-with')) {
    return NextResponse.json({ error: 'Missing required header' }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeOrg = await getActiveOrganization(user.email);
    if (!activeOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization, membership } = activeOrg;

    if (membership.role === 'VIEWER') {
      return NextResponse.json({ error: 'Viewers cannot update response status' }, { status: 403 });
    }

    // Validate body
    const body = await request.json();
    const { status, note } = body as { status?: string; note?: string };

    if (!status || !VALID_STATUSES.includes(status as ResponseStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Note is only meaningful on →SHIPPED transitions. Reject loudly when
    // sent on other statuses so client bugs surface instead of being silently
    // discarded.
    let trimmedNote: string | null = null;
    if (typeof note === 'string') {
      if (status !== 'SHIPPED') {
        return NextResponse.json(
          { error: 'Note is only accepted when transitioning to SHIPPED' },
          { status: 400 }
        );
      }
      const t = note.trim();
      if (t.length > NOTE_MAX_LEN) {
        return NextResponse.json(
          { error: `Note too long (max ${NOTE_MAX_LEN} characters)` },
          { status: 400 }
        );
      }
      trimmedNote = t.length === 0 ? null : t;
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    if (!dbUser) {
      // Supabase session exists but no Prisma User row — partial signup or
      // stale session. Surface as 401 instead of crashing.
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify response belongs to this organization. Pull the fields needed
    // for the notify-back decision in the same query to avoid a second
    // roundtrip. shippedAt is read so we can preserve the original
    // first-ship timestamp on subsequent SHIPPED transitions.
    const response = await prisma.response.findFirst({
      where: {
        id,
        project: { organizationId: organization.id },
      },
      select: {
        id: true,
        status: true,
        content: true,
        elementIdRaw: true,
        submitterEmail: true,
        notifiedAt: true,
        shippedAt: true,
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            notifiesSentThisMonth: true,
            notifiesResetAt: true,
          },
        },
      },
    });

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    const now = new Date();
    const isShipping = status === 'SHIPPED';
    const isLifecycle = (LIFECYCLE_STATUSES as readonly string[]).includes(status);

    const updated = await prisma.response.update({
      where: { id },
      data: {
        status: status as ResponseStatus,
        statusUpdatedAt: now,
        statusUpdatedBy: dbUser.id,
        // shippedAt is sticky — preserve the first-ship timestamp across any
        // re-ship (SHIPPED→PLANNED→SHIPPED keeps the original date so the
        // public roadmap doesn't surprise users with a new "shipped on" line).
        ...(isShipping && { shippedAt: response.shippedAt ?? now }),
        // shippedNote is overwritten on a fresh SHIPPED transition (so the
        // admin's new note replaces the old one) but preserved on transitions
        // *away* from SHIPPED so the audit trail of what was emailed stays
        // intact.
        ...(isShipping && { shippedNote: trimmedNote }),
        // Legacy reviewed* fields kept in sync with non-NEW transitions for
        // back-compat with anything still reading them.
        ...(status !== 'NEW'
          ? { reviewedAt: now, reviewedBy: dbUser.id }
          : { reviewedAt: null, reviewedBy: null }),
      },
      select: {
        id: true,
        status: true,
        statusUpdatedAt: true,
        shippedAt: true,
        notifiedAt: true,
      },
    });

    // Notify-back: fire only on the first →SHIPPED transition for which we
    // have a submitterEmail. The send slot is claimed atomically via a
    // conditional updateMany on `notifiedAt IS NULL` — only the call that
    // wins the row update actually sends, even under concurrent PATCHes.
    let notifyOutcome: 'sent' | 'skipped' | 'suppressed' | 'capped' | 'failed' | null = null;
    if (
      isShipping &&
      response.status !== 'SHIPPED' &&
      response.submitterEmail &&
      !response.notifiedAt
    ) {
      const submitterEmail = response.submitterEmail;

      // 1. Suppression check — recipient previously unsubscribed.
      const suppressed = await prisma.submitterSuppression.findUnique({
        where: {
          projectId_email: {
            projectId: response.project.id,
            email: submitterEmail,
          },
        },
        select: { id: true },
      });
      if (suppressed) {
        notifyOutcome = 'suppressed';
      } else {
        // 2. Atomic quota slot claim. The conditional updateMany increments
        // the per-project counter ONLY when it's still under the cap and the
        // current period hasn't rolled over. Two concurrent SHIPPED edges
        // straddling the cap cannot both bypass — at most one wins.
        const monthStart = startOfCurrentMonth(now);
        const needsReset =
          !response.project.notifiesResetAt || response.project.notifiesResetAt < monthStart;

        const quotaClaim = needsReset
          ? // First send of a new period — reset counter to 1 only if the
            // stored reset timestamp is still stale (someone else hasn't
            // already rolled the period under us).
            await prisma.project.updateMany({
              where: {
                id: response.project.id,
                OR: [{ notifiesResetAt: null }, { notifiesResetAt: { lt: monthStart } }],
              },
              data: {
                notifiesSentThisMonth: 1,
                notifiesResetAt: monthStart,
              },
            })
          : // In-period — increment only while under the cap.
            await prisma.project.updateMany({
              where: {
                id: response.project.id,
                notifiesSentThisMonth: { lt: NOTIFIES_MONTHLY_CAP },
                notifiesResetAt: { gte: monthStart },
              },
              data: { notifiesSentThisMonth: { increment: 1 } },
            });

        // If the in-period bump didn't take, fall back to checking whether
        // the reason is rollover (race) vs cap (real). Cheapest correct path
        // is to re-read and try once more under the alternate branch — but
        // for simplicity, treat any zero-count as 'capped' if we already
        // believed in-period, and as a lost race otherwise.
        if (quotaClaim.count === 0) {
          notifyOutcome = needsReset ? 'skipped' : 'capped';
        } else {
          // 3. Atomic notify slot claim. updateMany returns the affected row
          // count — only proceed if we won the race against any concurrent
          // PATCH on the same row.
          const claim = await prisma.response.updateMany({
            where: { id, notifiedAt: null },
            data: { notifiedAt: now },
          });

          if (claim.count === 1) {
            const sent = await sendShippedNotification({
              to: submitterEmail,
              projectId: response.project.id,
              projectName: response.project.name,
              projectSlug: response.project.slug,
              excerpt: response.content?.slice(0, 140) ?? null,
              elementLabel: response.elementIdRaw,
              adminNote: trimmedNote,
            });

            if (sent) {
              notifyOutcome = 'sent';
            } else {
              // Send failed — release the notify slot AND the quota slot so
              // a subsequent admin action can retry.
              await Promise.all([
                prisma.response.update({
                  where: { id },
                  data: { notifiedAt: null },
                }),
                prisma.project.update({
                  where: { id: response.project.id },
                  data: { notifiesSentThisMonth: { decrement: 1 } },
                }),
              ]);
              notifyOutcome = 'failed';
            }
          } else {
            // Lost the race on the notify slot — another PATCH already
            // claimed and sent. Release the quota slot we just reserved so
            // the cap stays accurate.
            await prisma.project.update({
              where: { id: response.project.id },
              data: { notifiesSentThisMonth: { decrement: 1 } },
            });
            notifyOutcome = 'skipped';
          }
        }
      }
    }

    return NextResponse.json({
      ...updated,
      lifecycle: isLifecycle,
      notify: notifyOutcome,
    });
  } catch (error) {
    console.error('PATCH /api/responses/[id]/status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
