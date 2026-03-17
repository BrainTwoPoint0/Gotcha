import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getActiveOrganization } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { checkDashboardRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  if (!request.headers.get('x-requested-with')) {
    return NextResponse.json({ error: 'Missing required header' }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success: rateLimitOk } = await checkDashboardRateLimit(user.id);
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const activeOrg = await getActiveOrganization(user.email!);
    if (!activeOrg) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const { membership } = activeOrg;
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only owners and admins can manage billing' },
        { status: 403 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: activeOrg.organization.id },
    });

    const customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gotcha.cx';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
