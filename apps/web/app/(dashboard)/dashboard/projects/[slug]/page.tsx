import { prisma } from '@/lib/prisma';
import { getAuthUser, getActiveOrganization } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ApiKeyCard } from './api-key-card';
import { DeleteProjectCard } from './delete-project-card';
import { EditorialPageHeader } from '../../../components/editorial/page-header';
import { EditorialLinkButton } from '../../../components/editorial/button';
import {
  EditorialCard,
  EditorialCardHeader,
  EditorialCardBody,
} from '../../../components/editorial/card';
import { StatCard } from '../../stat-card';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  allowedDomains: string[];
  lastUsedAt: Date | null;
  createdAt: Date;
}

interface ResponseItem {
  id: string;
  mode: string;
  content: string | null;
  rating: number | null;
  vote: string | null;
  elementIdRaw: string;
  createdAt: Date;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const user = await getAuthUser();

  const activeOrg = user?.email ? await getActiveOrganization(user.email) : null;
  const organization = activeOrg?.organization;

  if (!organization) {
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug,
      },
    },
    include: {
      apiKeys: {
        where: { revokedAt: null },
        orderBy: { createdAt: 'desc' },
        // Explicitly select only the fields the UI needs. Critically, omit
        // `key` and `keyHash` — the full key was visible at creation only and
        // the detail page must never re-display it. We derive a masked
        // identifier on the server before sending to the client.
        select: {
          id: true,
          name: true,
          key: true,
          allowedDomains: true,
          lastUsedAt: true,
          createdAt: true,
        },
      },
      responses: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: {
        select: { responses: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Mask the API key so the project detail page only ever shows the prefix
  // and a fixed-width tail of dots. The full key is shown ONCE at creation
  // (in NewProjectForm's success state) and never again — if the user lost
  // it they regenerate, which revokes the old one and shows the new one once.
  const safeApiKeys = project.apiKeys.map((apiKey) => ({
    ...apiKey,
    key: maskApiKey(apiKey.key),
  }));

  function maskApiKey(key: string): string {
    // Show the prefix (gtch_live_ or gtch_test_) plus the next 4 chars of
    // the secret, then a fixed-width mask. Enough to disambiguate which key
    // is which without leaking the secret.
    const match = key.match(/^(gtch_(?:live|test)_)(.{0,4})/);
    if (!match) return '••••••••';
    return `${match[1]}${match[2]}${'•'.repeat(24)}`;
  }

  return (
    <div>
      <Link
        href="/dashboard/projects"
        className="mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
      >
        <span aria-hidden="true">←</span>
        Back to projects
      </Link>

      <EditorialPageHeader
        eyebrow={`Project · ${slug}`}
        title={project.name}
        subtitle={project.description || undefined}
        action={
          <>
            <EditorialLinkButton
              href={`/dashboard/projects/${slug}/webhooks`}
              variant="ghost"
              size="md"
            >
              Integrations
            </EditorialLinkButton>
            <EditorialLinkButton
              href={`/dashboard/projects/${slug}/settings/metadata`}
              variant="ghost"
              size="md"
            >
              Metadata
            </EditorialLinkButton>
          </>
        }
      />

      <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Responses"
          value={project._count.responses.toLocaleString()}
          subtext="All time"
        />
        <StatCard
          label="API Keys"
          value={project.apiKeys.length.toString()}
          subtext={project.apiKeys.length === 1 ? 'Active' : 'Active keys'}
        />
        <StatCard label="Created" value={formatDate(new Date(project.createdAt))} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <EditorialCard>
          <EditorialCardHeader className="flex items-center justify-between">
            <h2 className="font-display text-[1.25rem] font-normal leading-[1.15] tracking-[-0.01em] text-editorial-ink">
              API Keys
            </h2>
          </EditorialCardHeader>
          <EditorialCardBody className="space-y-4">
            {safeApiKeys.length === 0 ? (
              <p className="text-[14px] text-editorial-neutral-3">
                No API keys yet — create one to install the SDK.
              </p>
            ) : (
              (safeApiKeys as ApiKeyItem[]).map((apiKey) => (
                <ApiKeyCard key={apiKey.id} apiKey={apiKey} projectSlug={slug} />
              ))
            )}
          </EditorialCardBody>
          <div className="border-t border-editorial-neutral-2 bg-editorial-ink">
            <div className="flex items-center justify-between px-5 py-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-paper/50">
                Quick start
              </span>
              <span className="font-mono text-[10px] text-editorial-paper/40">app.tsx</span>
            </div>
            <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-[1.7] text-editorial-paper/90">
              <code>{`npm install gotcha-feedback

import { GotchaProvider, Gotcha } from 'gotcha-feedback';

<GotchaProvider apiKey="YOUR_API_KEY">
  <Gotcha elementId="checkout" mode="nps" />
</GotchaProvider>`}</code>
            </pre>
          </div>
        </EditorialCard>

        <EditorialCard>
          <EditorialCardHeader className="flex items-center justify-between">
            <h2 className="font-display text-[1.25rem] font-normal leading-[1.15] tracking-[-0.01em] text-editorial-ink">
              Recent responses
            </h2>
            <Link
              href="/dashboard/responses"
              className="text-[13px] text-editorial-neutral-3 underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:text-editorial-ink hover:decoration-editorial-accent"
            >
              View all →
            </Link>
          </EditorialCardHeader>
          <EditorialCardBody>
            {project.responses.length === 0 ? (
              <p className="py-6 text-center text-[14px] text-editorial-neutral-3">
                No responses yet. Install the SDK and drop a{' '}
                <code className="font-mono text-[12px]">&lt;Gotcha /&gt;</code> component to start
                collecting.
              </p>
            ) : (
              <ul className="-my-2 divide-y divide-editorial-neutral-2">
                {(project.responses as ResponseItem[]).map((response) => (
                  <li key={response.id} className="flex items-start gap-4 py-3">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-editorial-neutral-3/60"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] text-editorial-ink">
                        {response.content || `${response.mode.toLowerCase()} response`}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-editorial-neutral-3">
                        {response.elementIdRaw} · {formatTimeAgo(new Date(response.createdAt))}
                      </p>
                    </div>
                    {response.rating && response.mode === 'NPS' && (
                      <span className="shrink-0 font-display text-[14px] text-editorial-ink">
                        {response.rating}
                        <span className="text-editorial-neutral-3">/10</span>
                      </span>
                    )}
                    {response.rating && response.mode !== 'NPS' && (
                      <span className="shrink-0 font-display text-[14px] text-editorial-accent">
                        {'★'.repeat(response.rating)}
                      </span>
                    )}
                    {response.vote && (
                      <span
                        className={`shrink-0 text-[13px] ${response.vote === 'UP' ? 'text-editorial-success' : 'text-editorial-alert'}`}
                      >
                        {response.vote === 'UP' ? 'Up' : 'Down'}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </EditorialCardBody>
        </EditorialCard>
      </div>

      <div className="mt-16">
        <DeleteProjectCard projectName={project.name} projectSlug={slug} userEmail={user?.email} />
      </div>
    </div>
  );
}
