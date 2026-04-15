import Link from 'next/link';
import type { SynthesisSignal } from '@/lib/synthesis';

interface SynthesisCardProps {
  signal: SynthesisSignal;
}

/**
 * The signature dashboard card — the "what you see on a Tuesday morning"
 * line that the marketing site has been promising. Renders only when the
 * synthesis module returns a real signal (≥3 responses on the same element
 * in the last 7 days).
 *
 * Mirrors the editorial blockquote on /loop-section.tsx so the dashboard
 * delivers visually on the landing page's promise.
 */
export function SynthesisCard({ signal }: SynthesisCardProps) {
  const delta = signal.count - signal.prevCount;
  const deltaLine =
    signal.prevCount === 0
      ? 'new this week'
      : delta > 0
        ? `up from ${signal.prevCount} last week`
        : delta < 0
          ? `down from ${signal.prevCount} last week`
          : `holding steady at ${signal.count}`;

  return (
    <figure className="mb-10 border-l-2 border-editorial-accent py-5 pl-6 sm:pl-8">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
        What people are asking about this week
      </span>
      <blockquote className="mt-3 font-display text-[1.5rem] font-normal leading-[1.25] tracking-[-0.01em] text-editorial-ink sm:text-[1.875rem]">
        <span className="italic text-editorial-neutral-3">{signal.count} responses</span> on{' '}
        <code className="rounded-md bg-editorial-ink/[0.04] px-2 py-0.5 font-mono text-[0.85em] text-editorial-ink">
          {signal.label}
        </code>{' '}
        — {deltaLine}.
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3 text-[12px] text-editorial-neutral-3">
        <span className="h-1.5 w-1.5 rounded-full bg-editorial-accent" aria-hidden="true" />
        <span className="font-mono uppercase tracking-[0.14em]">
          Synthesised theme · last 7 days
        </span>
        <Link
          href={`/dashboard/responses?elementId=${encodeURIComponent(signal.label)}`}
          className="ml-auto text-[12px] text-editorial-neutral-3 underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:text-editorial-ink hover:decoration-editorial-accent"
        >
          See all →
        </Link>
      </figcaption>
    </figure>
  );
}
