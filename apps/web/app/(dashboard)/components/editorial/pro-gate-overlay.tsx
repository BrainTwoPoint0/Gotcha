import * as React from 'react';
import { EditorialLinkButton } from './button';
import { EditorialSectionTitle } from './section-title';
import { EditorialEyebrow } from './eyebrow';

export interface ProGateOverlayProps {
  /** Decorative preview shown at reduced opacity behind the CTA card. */
  preview?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  upgradeHref?: string;
  upgradeLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

/**
 * Pro-gated surface wrapper. Renders a dimmed, non-interactive preview
 * behind a centered editorial CTA card. Matches the Linear / Vercel / PostHog
 * pattern of showing-not-telling what's behind the paywall.
 *
 * Compared to a flat EditorialEmptyState upgrade prompt, this:
 *  - Lets the user see the shape of the feature.
 *  - Avoids the "three identical upgrade walls in a row" repetition that
 *    happens when multiple pro-gated pages sit next to each other in nav.
 *  - Preserves the editorial register — no gradient, no shadow, just a
 *    hairline-bordered card centered over a muted preview.
 */
export function ProGateOverlay({
  preview,
  eyebrow = 'Pro feature',
  title,
  body,
  upgradeHref = '/dashboard/settings',
  upgradeLabel = 'Upgrade to Pro →',
  secondaryHref,
  secondaryLabel,
}: ProGateOverlayProps) {
  return (
    <div className="relative overflow-hidden rounded-md border border-editorial-neutral-2 bg-editorial-paper">
      <div
        aria-hidden="true"
        className="pointer-events-none select-none opacity-[0.35] blur-[0.5px]"
      >
        {preview ?? <DefaultPreview />}
      </div>

      {/* Soft vignette so the CTA card reads as the foreground without a heavy overlay. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-editorial-paper/30 via-editorial-paper/70 to-editorial-paper"
      />

      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-md border border-editorial-neutral-2 bg-editorial-paper p-8 text-center shadow-[0_8px_24px_rgba(26,23,20,0.08)]">
          <EditorialEyebrow className="justify-center" tone="accent">
            {eyebrow}
          </EditorialEyebrow>
          <div className="mt-4">
            <EditorialSectionTitle size="lg">{title}</EditorialSectionTitle>
          </div>
          {body && (
            <p className="mx-auto mt-3 max-w-sm text-[14px] leading-[1.6] text-editorial-neutral-3">
              {body}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <EditorialLinkButton href={upgradeHref} variant="ink">
              {upgradeLabel}
            </EditorialLinkButton>
            {secondaryHref && secondaryLabel && (
              <EditorialLinkButton href={secondaryHref} variant="ghost">
                {secondaryLabel}
              </EditorialLinkButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Neutral chart-shaped placeholder used when a specific surface doesn't
 * provide its own preview. Gives the overlay something to anchor to so the
 * CTA reads as "centered over real estate" rather than floating in whitespace.
 */
function DefaultPreview() {
  return (
    <div className="space-y-6 p-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border border-editorial-neutral-2 bg-editorial-paper p-5"
          >
            <div className="h-2.5 w-16 rounded-sm bg-editorial-neutral-2/60" />
            <div className="mt-3 h-7 w-20 rounded-sm bg-editorial-neutral-2/50" />
            <div className="mt-2 h-2 w-24 rounded-sm bg-editorial-neutral-2/40" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border border-editorial-neutral-2 bg-editorial-paper p-5"
          >
            <div className="mb-4 h-3 w-24 rounded-sm bg-editorial-neutral-2/60" />
            <div className="flex h-40 items-end gap-2">
              {Array.from({ length: 12 }).map((_, j) => (
                <div
                  key={j}
                  className="flex-1 rounded-sm bg-editorial-neutral-2/50"
                  style={{ height: `${30 + ((j * 17) % 70)}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
