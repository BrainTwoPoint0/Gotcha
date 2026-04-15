import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const alt = 'Roadmap';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface ProjectSettings {
  roadmapEnabled?: boolean;
}

interface Props {
  params: { slug: string };
}

/**
 * OG card for /roadmap/[slug]. Editorial palette only — paper background
 * with burnt-sienna accent rule. No third-party fonts (matches the page's
 * privacy posture); uses the system serif fallback that all OG renderers
 * honor consistently.
 */
export default async function Image({ params }: Props) {
  // Same partial-unique-aware lookup as the page route. Filter by enabled
  // flag at query time; expect at most one match (DB index enforced). On
  // ambiguous results, fall back to the neutral "Roadmap" card.
  const candidates = await prisma.project.findMany({
    where: {
      slug: params.slug,
      settings: {
        path: ['roadmapEnabled'],
        equals: true,
      },
    },
    select: { name: true },
    take: 2,
  });
  const project = candidates.length === 1 ? candidates[0] : null;
  const title = project ? project.name : 'Roadmap';

  return new ImageResponse(
    <div
      style={{
        background: '#FAF8F4',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '80px',
        fontFamily: 'Georgia, serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '20px',
          color: '#6b6660',
          textTransform: 'uppercase',
          letterSpacing: '4px',
        }}
      >
        <span style={{ width: '48px', height: '2px', background: '#D4532A' }} />
        Roadmap
      </div>
      <div
        style={{
          marginTop: '40px',
          fontSize: '96px',
          color: '#1A1714',
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        {title}
      </div>
      <div style={{ flex: 1 }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontSize: '22px',
          color: '#6b6660',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontFamily: 'monospace',
        }}
      >
        <span>Planned · In progress · Shipped</span>
        <span>Powered by Gotcha</span>
      </div>
    </div>,
    { ...size }
  );
}
