import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';
import { z } from 'zod';

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.enum(['response.created'])).min(1).optional(),
  active: z.boolean().optional(),
  description: z.string().max(200).optional(),
});

async function getOrgProjectWebhook(request: NextRequest, slug: string, webhookId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const activeOrg = await getActiveOrganization(user.email);
  if (!activeOrg || !activeOrg.isPro) return null;

  const project = await prisma.project.findFirst({
    where: { slug, organizationId: activeOrg.organization.id },
  });

  if (!project) return null;

  const webhook = await prisma.webhook.findFirst({
    where: { id: webhookId, projectId: project.id },
  });

  if (!webhook) return null;

  return { organization: activeOrg.organization, project, webhook };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const result = await getOrgProjectWebhook(request, slug, id);

    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateWebhookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const data = validation.data;

    // If re-enabling, reset failure count
    const updates: Record<string, unknown> = { ...data };
    if (data.active === true) {
      updates.failureCount = 0;
    }

    const webhook = await prisma.webhook.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        description: webhook.description,
        failureCount: webhook.failureCount,
        lastTriggeredAt: webhook.lastTriggeredAt,
        lastStatusCode: webhook.lastStatusCode,
      },
    });
  } catch (error) {
    console.error('PATCH /api/projects/[slug]/webhooks/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const result = await getOrgProjectWebhook(request, slug, id);

    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.webhook.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/projects/[slug]/webhooks/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
