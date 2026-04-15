import { prisma } from '@/lib/prisma';
import { getAuthUser, getActiveOrganization } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { WebhookManager, AddWebhookButton } from './webhook-manager';
import { EditorialPageHeader } from '../../../../components/editorial/page-header';
import { EditorialCard } from '../../../../components/editorial/card';
import { EditorialEmptyState } from '../../../../components/editorial/empty-state';
import { EditorialLinkButton } from '../../../../components/editorial/button';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function WebhooksPage({ params }: Props) {
  const { slug } = await params;
  const user = await getAuthUser();

  const activeOrg = user?.email ? await getActiveOrganization(user.email) : null;
  const organization = activeOrg?.organization;
  if (!organization) notFound();

  const isPro = activeOrg?.isPro ?? false;

  const project = await prisma.project.findUnique({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug,
      },
    },
  });

  if (!project) notFound();

  const webhooks = isPro
    ? await prisma.webhook.findMany({
        where: { projectId: project.id },
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
      })
    : [];

  return (
    <div>
      <Link
        href={`/dashboard/projects/${slug}`}
        className="mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
      >
        <span aria-hidden="true">←</span>
        Back to {project.name}
      </Link>

      <EditorialPageHeader
        eyebrow={`Project · ${slug}`}
        title="Integrations"
        subtitle="Push feedback to Slack, Discord, or a custom endpoint the moment it comes in."
        action={isPro ? <AddWebhookButton /> : undefined}
      />

      {!isPro ? (
        <EditorialCard>
          <EditorialEmptyState
            title="Integrations are a Pro feature"
            body="Connect Slack, Discord, and custom webhooks for real-time delivery. Upgrade to Pro to enable."
            action={
              <EditorialLinkButton href="/dashboard/settings" variant="ink">
                Upgrade to Pro →
              </EditorialLinkButton>
            }
          />
        </EditorialCard>
      ) : (
        <WebhookManager
          projectSlug={slug}
          webhooks={webhooks.map((w) => ({
            ...w,
            lastTriggeredAt: w.lastTriggeredAt?.toISOString() || null,
            createdAt: w.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
