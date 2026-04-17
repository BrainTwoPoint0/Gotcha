import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendProActivatedEmail } from '@/lib/emails/send';
import { invalidateApiKeyCacheByOrganization } from '@/lib/api-auth';

// Stripe subscription.status → our internal SubStatus enum. Extracted so
// the `subscription.created` and `subscription.updated` handlers stay
// consistent — they must map the same way or the PAST_DUE gating logic in
// `validateApiKey` breaks.
const STATUS_MAP: Record<string, 'ACTIVE' | 'PAST_DUE' | 'TRIALING' | 'CANCELED'> = {
  active: 'ACTIVE',
  past_due: 'PAST_DUE',
  trialing: 'TRIALING',
  canceled: 'CANCELED',
  unpaid: 'PAST_DUE',
  incomplete: 'PAST_DUE',
  incomplete_expired: 'CANCELED',
  paused: 'CANCELED',
};

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency dedup. Stripe retries webhooks for up to 3 days on non-2xx
  // responses. Without dedup at the front door, every retry re-fires our
  // side effects (PRO activation email, cache invalidations, future webhook
  // fan-out). Handlers' DB writes are idempotent on their own — but the
  // side-effect surface grows over time, so we dedup once here rather than
  // audit every handler forever.
  //
  // INSERT succeeds on first-ever delivery; ON CONFLICT DO NOTHING means a
  // retry returns `count=0`. The `count` tells us cheaply whether we own
  // the event. Postgres guarantees atomicity so two concurrent deliveries
  // of the same id race-safely resolve to exactly one winner.
  try {
    const inserted = await prisma.$executeRaw`
      INSERT INTO "ProcessedStripeEvent" ("id", "type", "processedAt")
      VALUES (${event.id}, ${event.type}, NOW())
      ON CONFLICT ("id") DO NOTHING
    `;
    if (inserted === 0) {
      // Already processed — return 200 so Stripe stops retrying.
      return NextResponse.json({ received: true, duplicate: true });
    }
  } catch (err) {
    // If dedup is down (DB unavailable), fall through and let the handler
    // run. Better to risk a duplicate side effect than silently drop real
    // state changes. Log so we notice if this keeps firing.
    console.error('Stripe event dedup check failed, proceeding anyway:', err);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Guard: only subscription-mode checkout with a paid session flips
        // plan to PRO. A one-time-payment session or an unpaid session
        // shouldn't accidentally upgrade the org.
        if (session.mode !== 'subscription' || session.payment_status === 'unpaid') {
          break;
        }
        const organizationId = session.metadata?.organizationId;
        if (organizationId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await upsertSubscriptionFromStripe(organizationId, subscription, session.customer as string);
          invalidateApiKeyCacheByOrganization(organizationId);
          sendProActivatedEmail(organizationId).catch(console.error);
        }
        break;
      }

      case 'customer.subscription.created': {
        // Covers subscription creation paths that don't go through our
        // Checkout flow — Stripe dashboard, Billing Portal plan switch,
        // trial auto-conversion, direct API calls. Without this handler
        // such subscriptions never flip the org to PRO.
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Resolve organizationId. Prefer subscription metadata; fall back
        // to an existing Subscription row keyed by stripeCustomerId (set
        // by a prior checkout.session.completed for this customer).
        const organizationId =
          subscription.metadata?.organizationId ||
          (
            await prisma.subscription.findFirst({
              where: { stripeCustomerId: customerId },
              select: { organizationId: true },
            })
          )?.organizationId;

        if (organizationId) {
          await upsertSubscriptionFromStripe(organizationId, subscription, customerId);
          invalidateApiKeyCacheByOrganization(organizationId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const sub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (sub) {
          const status = STATUS_MAP[subscription.status] || 'CANCELED';

          const periodEnd = (subscription as unknown as { current_period_end: number })
            .current_period_end;

          const cancelAtPeriodEnd = (subscription as unknown as { cancel_at_period_end: boolean })
            .cancel_at_period_end;

          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status,
              stripePriceId: subscription.items.data[0]?.price.id ?? sub.stripePriceId,
              cancelAtPeriodEnd: cancelAtPeriodEnd ?? false,
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
            },
          });
          // Status may have flipped to CANCELED / PAST_DUE — evict cached
          // ApiKeyData so the next submission re-reads fresh plan state.
          invalidateApiKeyCacheByOrganization(sub.organizationId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const sub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              plan: 'FREE',
              status: 'CANCELED',
              stripeSubId: null,
              stripePriceId: null,
              cancelAtPeriodEnd: false,
              currentPeriodEnd: null,
            },
          });
          // Plan just dropped PRO → FREE. Cached ApiKeyData carries the
          // stale PRO plan; evict so over-quota submissions start gating
          // on the next request instead of after TTL expiry.
          invalidateApiKeyCacheByOrganization(sub.organizationId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const sub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'PAST_DUE' },
          });
          // Status flipped to PAST_DUE. validateApiKey now downgrades the
          // cached plan to FREE for non-ACTIVE/TRIALING subscriptions, so
          // eviction makes the new gating kick in on the next submission.
          invalidateApiKeyCacheByOrganization(sub.organizationId);
        }
        break;
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    // Rollback the dedup row so Stripe's retry actually re-runs the
    // handler instead of hitting the dedup short-circuit on retry. This
    // preserves at-least-once semantics on handler failure.
    try {
      await prisma.processedStripeEvent.delete({ where: { id: event.id } });
    } catch {
      // Dedup row already gone — nothing to roll back.
    }
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Shared subscription upsert used by both `checkout.session.completed` and
 * `customer.subscription.created`. Kept centralised so the two entry points
 * stay in sync — whichever fires first wins, the other is a no-op overwrite
 * with identical data.
 */
async function upsertSubscriptionFromStripe(
  organizationId: string,
  subscription: Stripe.Subscription,
  customerId: string
): Promise<void> {
  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  const cancelAtPeriodEnd = (subscription as unknown as { cancel_at_period_end: boolean })
    .cancel_at_period_end;
  const status = STATUS_MAP[subscription.status] || 'ACTIVE';
  const priceId = subscription.items.data[0]?.price.id ?? null;

  await prisma.subscription.upsert({
    where: { organizationId },
    update: {
      stripeSubId: subscription.id,
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      plan: 'PRO',
      status,
      cancelAtPeriodEnd: cancelAtPeriodEnd ?? false,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
    create: {
      organizationId,
      stripeSubId: subscription.id,
      stripePriceId: priceId,
      stripeCustomerId: customerId,
      plan: 'PRO',
      status,
      cancelAtPeriodEnd: cancelAtPeriodEnd ?? false,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });
}
