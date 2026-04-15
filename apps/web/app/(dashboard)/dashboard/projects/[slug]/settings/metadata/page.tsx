import { prisma } from '@/lib/prisma';
import { getAuthUser, getActiveOrganization } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MetadataFieldsManager } from './metadata-fields-manager';
import { EditorialPageHeader } from '../../../../../components/editorial/page-header';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function MetadataSettingsPage({ params }: Props) {
  const { slug } = await params;
  const user = await getAuthUser();

  const activeOrg = user?.email ? await getActiveOrganization(user.email) : null;
  const organization = activeOrg?.organization;
  const isPro = activeOrg?.isPro ?? false;

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
      metadataFields: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const responses = await prisma.response.findMany({
    where: {
      projectId: project.id,
      NOT: {
        endUserMeta: { equals: {} },
      },
    },
    select: { endUserMeta: true },
    take: 500,
    orderBy: { createdAt: 'desc' },
  });

  const fieldStats: Record<string, { count: number; samples: unknown[] }> = {};

  responses.forEach((r) => {
    const meta = r.endUserMeta as Record<string, unknown>;
    if (!meta || typeof meta !== 'object') return;

    Object.entries(meta).forEach(([key, value]) => {
      if (key === 'id') return;

      if (!fieldStats[key]) {
        fieldStats[key] = { count: 0, samples: [] };
      }

      fieldStats[key].count++;

      if (fieldStats[key].samples.length < 3 && value !== null) {
        if (!fieldStats[key].samples.includes(value)) {
          fieldStats[key].samples.push(value);
        }
      }
    });
  });

  const discoveredFields = Object.entries(fieldStats)
    .map(([key, stats]) => ({
      key,
      occurrences: stats.count,
      samples: stats.samples,
    }))
    .sort((a, b) => b.occurrences - a.occurrences);

  const configuredFieldKeys = new Set(project.metadataFields.map((f) => f.fieldKey));

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
        title="Metadata fields"
        subtitle="Configure the user attributes that travel with every response — for segmentation and filtering later."
      />

      {!isPro && (
        <div className="mb-6 flex items-center gap-3 border-t border-editorial-neutral-2 pt-4 text-[13px] text-editorial-neutral-3">
          <span className="h-1 w-1 shrink-0 rounded-full bg-editorial-accent" aria-hidden="true" />
          <span>
            <span className="text-editorial-ink">Configuration is available on all plans.</span>{' '}
            <Link
              href="/dashboard/settings"
              className="underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent"
            >
              Upgrade to Pro
            </Link>{' '}
            to unlock segmentation analytics on top of these fields.
          </span>
        </div>
      )}

      <MetadataFieldsManager
        projectSlug={slug}
        configuredFields={project.metadataFields.map((f) => ({
          id: f.id,
          fieldKey: f.fieldKey,
          displayName: f.displayName,
          fieldType: f.fieldType,
          isActive: f.isActive,
        }))}
        discoveredFields={discoveredFields.filter((f) => !configuredFieldKeys.has(f.key))}
      />
    </div>
  );
}
