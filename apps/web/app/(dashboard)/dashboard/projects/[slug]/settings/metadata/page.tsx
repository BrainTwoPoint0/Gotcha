import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MetadataFieldsManager } from './metadata-fields-manager';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function MetadataSettingsPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({
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
      })
    : null;

  const organization = dbUser?.memberships[0]?.organization;
  const isPro = organization?.subscription?.plan === 'PRO';

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

  // Discover fields from responses
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
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-gray-900">Metadata Fields</h1>
          <p className="text-gray-600">Configure user attributes for segmentation</p>
        </div>
      </div>

      {!isPro && (
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-700">
            Metadata configuration is available on all plans, but{' '}
            <Link href="/dashboard/settings" className="font-medium underline">
              upgrade to Pro
            </Link>{' '}
            to unlock user segmentation analytics.
          </p>
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
