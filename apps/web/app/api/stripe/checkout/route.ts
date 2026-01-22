import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { stripe, STRIPE_PRO_PRICE_ID } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      include: {
        memberships: {
          include: {
            organization: {
              include: { subscription: true },
            },
          },
        },
      },
    });

    const organization = dbUser?.memberships[0]?.organization;
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    let customerId = organization.subscription?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { organizationId: organization.id },
      });
      customerId = customer.id;

      // Store customer ID
      await prisma.subscription.upsert({
        where: { organizationId: organization.id },
        update: { stripeCustomerId: customerId },
        create: {
          organizationId: organization.id,
          stripeCustomerId: customerId,
          plan: 'FREE',
          status: 'ACTIVE',
        },
      });
    }

    // Get the host for redirect URLs
    const headersList = await headers();
    const host = headersList.get('host') || 'gotcha.cx';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${baseUrl}/dashboard/settings?success=true`,
      cancel_url: `${baseUrl}/dashboard/settings?canceled=true`,
      metadata: { organizationId: organization.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
