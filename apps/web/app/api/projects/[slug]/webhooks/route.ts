import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { generateSecret } from '@/lib/webhooks';
import { z } from 'zod';

const VALID_EVENTS = ['response.created'];

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(['response.created'])).min(1),
  description: z.string().max(200).optional(),
});

async function getOrgAndProject(request: NextRequest, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

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
  if (!organization) return null;

  const project = await prisma.project.findFirst({
    where: { slug, organizationId: organization.id },
  });

  if (!project) return null;

  return { organization, project };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const result = await getOrgAndProject(request, slug);

    if (!result) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (result.organization.subscription?.plan !== 'PRO') {
      return NextResponse.json({ error: 'PRO plan required' }, { status: 403 });
    }

    const webhooks = await prisma.webhook.findMany({
      where: { projectId: result.project.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
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

    if (result.organization.subscription?.plan !== 'PRO') {
      return NextResponse.json({ error: 'PRO plan required' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createWebhookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const secret = generateSecret();

    const webhook = await prisma.webhook.create({
      data: {
        projectId: result.project.id,
        url: validation.data.url,
        secret,
        events: validation.data.events,
        description: validation.data.description,
      },
    });

    // Return secret only on creation
    return NextResponse.json({
      webhook: {
        id: webhook.id,
        url: webhook.url,
        secret,
        events: webhook.events,
        active: webhook.active,
        description: webhook.description,
        createdAt: webhook.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[slug]/webhooks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
