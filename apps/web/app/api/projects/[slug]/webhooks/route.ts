import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';
import { generateSecret, isPrivateUrl } from '@/lib/webhooks';
import { z } from 'zod';

const VALID_EVENTS = ['response.created', 'bug.created', 'bug.resolved', 'bug.updated'];

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(['response.created', 'bug.created', 'bug.resolved', 'bug.updated'])).min(1),
  description: z.string().max(200).optional(),
  type: z.enum(['custom', 'slack', 'discord']).default('custom'),
});

async function getOrgAndProject(request: NextRequest, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const activeOrg = await getActiveOrganization(user.email);
  if (!activeOrg) return null;

  const project = await prisma.project.findFirst({
    where: { slug, organizationId: activeOrg.organization.id },
  });

  if (!project) return null;

  return {
    organization: activeOrg.organization,
    project,
    isPro: activeOrg.isPro,
    role: activeOrg.membership.role,
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const result = await getOrgAndProject(request, slug);

    if (!result) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!result.isPro) {
      return NextResponse.json({ error: 'PRO plan required' }, { status: 403 });
    }

    const webhooks = await prisma.webhook.findMany({
      where: { projectId: result.project.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        url: true,
        events: true,
        active: true,
        description: true,
        lastTriggeredAt: true,
        lastStatusCode: true,
        failureCount: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('GET /api/projects/[slug]/webhooks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const result = await getOrgAndProject(request, slug);

    if (!result) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!result.isPro) {
      return NextResponse.json({ error: 'PRO plan required' }, { status: 403 });
    }

    if (result.role === 'VIEWER') {
      return NextResponse.json({ error: 'Viewers cannot create webhooks' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createWebhookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    if (isPrivateUrl(validation.data.url)) {
      return NextResponse.json(
        { error: 'Webhook URL cannot point to a private/internal address' },
        { status: 400 }
      );
    }

    const webhookType = validation.data.type;
    const secret = webhookType === 'custom' ? generateSecret() : null;

    const webhook = await prisma.webhook.create({
      data: {
        projectId: result.project.id,
        type: webhookType,
        url: validation.data.url,
        secret,
        events: validation.data.events,
        description: validation.data.description,
      },
    });

    // Return secret only on creation for custom type
    return NextResponse.json(
      {
        webhook: {
          id: webhook.id,
          type: webhook.type,
          url: webhook.url,
          ...(webhookType === 'custom' ? { secret } : {}),
          events: webhook.events,
          active: webhook.active,
          description: webhook.description,
          createdAt: webhook.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/projects/[slug]/webhooks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
