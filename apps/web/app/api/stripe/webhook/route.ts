import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;
        console.log('checkout.session.completed - organizationId:', organizationId);
        console.log('checkout.session.completed - subscription:', session.subscription);

        if (organizationId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          console.log('Retrieved subscription:', subscription.id);

          // Get period end - handle both old and new Stripe API versions
          const periodEnd = (subscription as unknown as { current_period_end: number })
            .current_period_end;

          // Use upsert to handle case where subscription record might not exist
          await prisma.subscription.upsert({
            where: { organizationId },
            update: {
              stripeSubId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              plan: 'PRO',
              status: 'ACTIVE',
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
            },
            create: {
              organizationId,
              stripeSubId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              stripeCustomerId: session.customer as string,
              plan: 'PRO',
              status: 'ACTIVE',
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
            },
          });
          console.log('Subscription updated to PRO');
        } else {
          console.log('Missing organizationId or subscription in session');
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
          const status =
            subscription.status === 'active'
              ? 'ACTIVE'
              : subscription.status === 'past_due'
                ? 'PAST_DUE'
                : subscription.status === 'trialing'
                  ? 'TRIALING'
                  : 'CANCELED';

          const periodEnd = (subscription as unknown as { current_period_end: number })
            .current_period_end;

          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status,
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
            },
          });
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
            },
          });
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
        }
        break;
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
