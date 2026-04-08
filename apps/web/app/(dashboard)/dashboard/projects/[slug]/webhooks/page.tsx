import { prisma } from '@/lib/prisma';
import { getAuthUser, getActiveOrganization } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { WebhookManager, AddWebhookButton } from './webhook-manager';

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
      <div className="mb-8">
        <Link
          href={`/dashboard/projects/${slug}`}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to {project.name}
        </Link>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
            <p className="text-gray-600">Receive real-time notifications when feedback comes in</p>
          </div>
          {isPro && <AddWebhookButton />}
        </div>
      </div>

      {!isPro ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">PRO Feature</h3>
          <p className="text-gray-600 mb-4">
            Integrations are available on the Pro plan. Connect Slack, Discord, and custom webhooks
            for real-time notifications.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800"
          >
            Upgrade to Pro
          </Link>
        </div>
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
