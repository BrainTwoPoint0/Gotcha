/**
 * One-shot seed for the Gotcha self-roadmap at /roadmap/gotcha.
 *
 * Finds (or creates) a project with slug "gotcha" under the caller's
 * organization, flips `settings.roadmapEnabled`, and inserts a handful
 * of lifecycle responses — each with an admin-curated title so it
 * qualifies for the public surface.
 *
 * Usage:
 *   cd apps/web
 *   npx tsx scripts/seed-gotcha-roadmap.ts <your-email@domain>
 *
 * Safe to re-run: uses upserts keyed on (projectId, elementIdRaw + title)
 * so repeated runs don't double-insert the seed rows.
 */

import { prisma } from '@/lib/prisma';

type SeedItem = {
  title: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED';
  elementId: string;
  shippedDaysAgo?: number;
  shippedNote?: string | null;
};

const SEED_ITEMS: SeedItem[] = [
  // Shipped recently — proof the loop works end-to-end.
  {
    title: 'Public roadmap with anonymous upvoting',
    status: 'SHIPPED',
    elementId: 'roadmap-upvotes',
    shippedDaysAgo: 0,
    shippedNote: 'Cookieless, no third-party JS, dedup by salted hash.',
  },
  {
    title: 'Notify-back email when a response ships',
    status: 'SHIPPED',
    elementId: 'notify-back',
    shippedDaysAgo: 1,
    shippedNote: 'RFC 8058 one-click unsubscribe, per-project quota.',
  },
  {
    title: 'Response lifecycle: Planned / In progress / Shipped',
    status: 'SHIPPED',
    elementId: 'status-lifecycle',
    shippedDaysAgo: 1,
  },
  {
    title: 'Editorial dashboard — Fraunces + warm palette',
    status: 'SHIPPED',
    elementId: 'editorial-ui',
    shippedDaysAgo: 7,
  },
  {
    title: 'No-cookies posture on the marketing site',
    status: 'SHIPPED',
    elementId: 'privacy-wedge',
    shippedDaysAgo: 14,
  },

  // In progress — what we're actively building.
  {
    title: 'Vote-weighted synthesis card on the dashboard',
    status: 'IN_PROGRESS',
    elementId: 'vote-synthesis',
  },

  // Planned — committed but not started.
  {
    title: 'Cross-project roadmap embed (<iframe> allowlist)',
    status: 'PLANNED',
    elementId: 'roadmap-embed',
  },
  {
    title: 'Admin merge for duplicate feedback submissions',
    status: 'PLANNED',
    elementId: 'admin-merge',
  },
  {
    title: 'Vote-threshold admin filter on /dashboard/responses',
    status: 'PLANNED',
    elementId: 'vote-filter',
  },
];

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx tsx scripts/seed-gotcha-roadmap.ts <your-email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { include: { organization: true } } },
  });
  if (!user || user.memberships.length === 0) {
    console.error(`No user or organization found for ${email}`);
    process.exit(1);
  }

  // Use the first org (adjust if you have multiple and want a specific one).
  const org = user.memberships[0].organization;
  console.log(`Seeding into organization: ${org.name} (${org.id})`);

  // Find-or-create the "gotcha" project.
  let project = await prisma.project.findUnique({
    where: {
      organizationId_slug: {
        organizationId: org.id,
        slug: 'gotcha',
      },
    },
  });
  if (!project) {
    project = await prisma.project.create({
      data: {
        organizationId: org.id,
        name: 'Gotcha',
        slug: 'gotcha',
        description: 'The feedback tool that closes the loop.',
      },
    });
    console.log(`Created project: ${project.name} (${project.id})`);
  } else {
    console.log(`Using existing project: ${project.name} (${project.id})`);
  }

  // Enable the public roadmap with an intro blurb.
  const existingSettings = (project.settings as Record<string, unknown> | null) ?? {};
  await prisma.project.update({
    where: { id: project.id },
    data: {
      settings: {
        ...existingSettings,
        roadmapEnabled: true,
        roadmapIntro:
          'What we are planning, building, and have just shipped. Based on feedback from people who use Gotcha.',
      },
    },
  });
  console.log('Roadmap enabled with intro.');

  // Insert (or refresh) each seed item.
  let created = 0;
  let skipped = 0;
  for (const item of SEED_ITEMS) {
    const existing = await prisma.response.findFirst({
      where: {
        projectId: project.id,
        elementIdRaw: item.elementId,
        title: item.title,
      },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    const now = new Date();
    const shippedAt =
      item.status === 'SHIPPED' && item.shippedDaysAgo !== undefined
        ? new Date(now.getTime() - item.shippedDaysAgo * 24 * 60 * 60 * 1000)
        : null;
    const createdAt = shippedAt ?? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    await prisma.response.create({
      data: {
        projectId: project.id,
        elementIdRaw: item.elementId,
        mode: 'FEATURE_REQUEST',
        title: item.title,
        content: null,
        status: item.status,
        statusUpdatedAt: now,
        ...(shippedAt && { shippedAt }),
        ...(item.shippedNote && { shippedNote: item.shippedNote }),
        createdAt,
      },
    });
    created += 1;
  }

  console.log(`Seed complete: ${created} created, ${skipped} skipped.`);
  console.log(`Visit: http://localhost:3000/roadmap/gotcha (dev) or /roadmap/gotcha in prod.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
