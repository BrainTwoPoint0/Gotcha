import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { generateSignature } from '@/lib/webhooks';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
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
    if (!organization || organization.subscription?.plan !== 'PRO') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: { slug, organizationId: organization.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const webhook = await prisma.webhook.findFirst({
      where: { id, projectId: project.id },
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const testPayload = {
      id: 'test_' + crypto.randomUUID(),
      elementId: 'test-element',
      mode: 'feedback',
      content: 'This is a test webhook delivery from Gotcha.',
      rating: 5,
      vote: null,
      createdAt: new Date().toISOString(),
    };

    const body = JSON.stringify(testPayload);
    const signature = generateSignature(webhook.secret, body);
    const timestamp = Date.now().toString();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const start = Date.now();
    let statusCode: number | null = null;
    let success = false;
    let error: string | null = null;

    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gotcha-Signature': signature,
          'X-Gotcha-Event': 'test',
          'X-Gotcha-Timestamp': timestamp,
        },
        body,
        signal: controller.signal,
      });

      statusCode = res.status;
      success = res.ok;
      if (!res.ok) error = `HTTP ${res.status}`;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      clearTimeout(timeout);
    }

    const responseMs = Date.now() - start;

    // Log the test delivery
    await prisma.webhookLog.create({
      data: {
        webhookId: id,
        event: 'test',
        payload: testPayload,
        statusCode,
        responseMs,
        error,
        success,
      },
    });

    return NextResponse.json({ success, statusCode, responseMs, error });
  } catch (error) {
    console.error('POST /api/projects/[slug]/webhooks/[id]/test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
