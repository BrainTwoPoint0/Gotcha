import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * Public roadmap page — opt-in per project via `project.settings.roadmapEnabled`.
 *
 * Renders three editorial columns (Planned / In progress / Shipped recently)
 * for the last 90 days. Privacy posture is the wedge: the page emits zero
 * cookies, no third-party scripts, no Gotcha branding chrome, and never
 * leaks PII. Specifically: `submitterEmail`, `endUserMeta`, `endUserId`,
 * `userAgent`, `contextMeta`, `submitterEmail`, `shippedNote` (which may
 * contain customer-internal context) — none of these are surfaced.
 *
 * ISR with revalidate=3600 so a status flip in the dashboard propagates
 * within an hour without hammering the DB on every roadmap pageview.
 */
export const revalidate = 3600;

const NINETY_DAYS_MS = 1000 * 60 * 60 * 24 * 90;
const TITLE_MAX_LEN = 80;

interface Props {
  params: Promise<{ slug: string }>;
}

interface RoadmapItem {
  id: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED';
  title: string;
  createdAt: Date;
  shippedAt: Date | null;
}

interface ProjectSettings {
  roadmapEnabled?: boolean;
  roadmapIntro?: string;
}

const STATUS_COLUMNS = [
  { key: 'PLANNED' as const, label: 'Planned' },
  { key: 'IN_PROGRESS' as const, label: 'In progress' },
  { key: 'SHIPPED' as const, label: 'Shipped recently' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function truncate(s: string | null, n: number): string {
  const t = (s ?? '').trim();
  if (!t) return '';
  return t.length > n ? `${t.slice(0, n).trimEnd()}…` : t;
}

async function loadProject(slug: string) {
  // CRITICAL: Project.slug is unique only per organization, NOT globally.
  // Two orgs can have a project with the same slug. The partial unique
  // index `Project_public_slug_unique` enforces that AT MOST ONE of those
  // can have `settings.roadmapEnabled = true` at a time. We use findMany
  // here rather than findFirst because:
  //   1. We must filter by the enabled flag at query time (Prisma doesn't
  //      support partial-unique constraints in its client API, so we cannot
  //      lean on `findUnique`)
  //   2. If the index is somehow violated (manual DB edit, race during
  //      migration), returning >1 fails closed by treating as not-found.
  const candidates = await prisma.project.findMany({
    where: {
      slug,
      settings: {
        path: ['roadmapEnabled'],
        equals: true,
      },
    },
    select: {
      id: true,
      name: true,
      settings: true,
    },
    take: 2,
  });
  if (candidates.length !== 1) return null;
  return candidates[0];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await loadProject(slug);
  // loadProject already enforces roadmapEnabled — a null result means the
  // page will 404. Send noindex on the metadata so search engines drop the
  // URL even before they get the 404 response.
  if (!project) {
    return { title: 'Roadmap', robots: { index: false, follow: false } };
  }

  return {
    title: `${project.name} · Roadmap`,
    description: `What's planned, in progress, and shipped on ${project.name}.`,
    openGraph: {
      title: `${project.name} · Roadmap`,
      description: `What's planned, in progress, and shipped on ${project.name}.`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicRoadmapPage({ params }: Props) {
  const { slug } = await params;
  const project = await loadProject(slug);

  // 404 (not 403) when disabled or missing — disabled projects must look
  // identical to non-existent ones to prevent slug enumeration. loadProject
  // already filters by roadmapEnabled, so a non-null result is guaranteed
  // public.
  if (!project) notFound();
  const settings = (project.settings as ProjectSettings | null) ?? {};

  const cutoff = new Date(Date.now() - NINETY_DAYS_MS);

  // Public surface — selects ONLY admin-curated fields. We deliberately do
  // NOT select `content`: that's the verbatim end-user submission, which can
  // contain PII the submitter never expected to be public ("our CEO Jane
  // said the checkout broke at example.com/u/123…"). Admin-curated `title`
  // only; rows without a title fall back to a neutral placeholder rather
  // than leaking raw content.
  const items = (await prisma.response.findMany({
    where: {
      projectId: project.id,
      status: { in: ['PLANNED', 'IN_PROGRESS', 'SHIPPED'] },
      createdAt: { gte: cutoff },
    },
    orderBy: [{ shippedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      status: true,
      title: true,
      createdAt: true,
      shippedAt: true,
    },
    take: 300,
  })) as Array<{
    id: string;
    status: 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED';
    title: string | null;
    createdAt: Date;
    shippedAt: Date | null;
  }>;

  const cards: RoadmapItem[] = items.map((r) => ({
    id: r.id,
    status: r.status,
    title: truncate(r.title, TITLE_MAX_LEN) || 'Untitled feedback',
    createdAt: r.createdAt,
    shippedAt: r.shippedAt,
  }));

  const grouped: Record<RoadmapItem['status'], RoadmapItem[]> = {
    PLANNED: [],
    IN_PROGRESS: [],
    SHIPPED: [],
  };
  for (const c of cards) grouped[c.status].push(c);

  const intro = settings.roadmapIntro?.trim().slice(0, 280) || null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 sm:py-24">
      <header className="mb-12 sm:mb-16">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-editorial-accent" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            Roadmap
          </span>
        </div>
        <h1 className="font-display text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-editorial-ink sm:text-5xl">
          {project.name}
        </h1>
        {intro && (
          <p className="mt-6 max-w-2xl text-[16px] leading-[1.6] text-editorial-neutral-3">
            {intro}
          </p>
        )}
        <p className="mt-6 max-w-2xl text-[14px] leading-[1.6] text-editorial-neutral-3/80">
          What we&rsquo;re building, what&rsquo;s next, what just shipped — based on feedback from
          people who use the product.
        </p>
      </header>

      <div className="grid gap-px border-y border-editorial-neutral-2 bg-editorial-neutral-2 sm:grid-cols-3">
        {STATUS_COLUMNS.map((col) => {
          const colItems = grouped[col.key];
          return (
            <section key={col.key} className="bg-editorial-paper p-6 sm:p-8">
              <div className="mb-6 flex items-baseline justify-between">
                <h2 className="font-display text-[1.25rem] font-normal leading-[1.2] tracking-[-0.01em] text-editorial-ink">
                  {col.label}
                </h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                  {colItems.length}
                </span>
              </div>
              {colItems.length === 0 ? (
                <p className="text-[13px] text-editorial-neutral-3/70">Nothing here yet.</p>
              ) : (
                <ul className="space-y-3">
                  {colItems.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-md border border-editorial-neutral-2 bg-editorial-paper px-4 py-3"
                    >
                      <p className="text-[14px] leading-[1.5] text-editorial-ink">{item.title}</p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3">
                        {col.key === 'SHIPPED' && item.shippedAt
                          ? `Shipped ${fmtDate(item.shippedAt)}`
                          : `Suggested ${fmtDate(item.createdAt)}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <footer className="mt-16 flex items-center justify-between border-t border-editorial-neutral-2 pt-6 text-[12px] text-editorial-neutral-3">
        <span className="font-mono uppercase tracking-[0.14em]">Last 90 days</span>
        <span className="font-mono uppercase tracking-[0.14em]">
          Powered by{' '}
          <a
            href="https://gotcha.cx"
            className="text-editorial-neutral-3 underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:text-editorial-ink hover:decoration-editorial-accent"
          >
            Gotcha
          </a>
        </span>
      </footer>
    </div>
  );
}
