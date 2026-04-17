'use client';

import { Gotcha } from 'gotcha-feedback';
import Link from 'next/link';

export default function DemoPage() {
  return (
    <main className="editorial min-h-screen bg-editorial-paper text-editorial-ink">
      <div className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-24">
        {/* Page header */}
        <header className="mb-16 border-b border-editorial-neutral-2 pb-10">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-editorial-accent" aria-hidden="true" />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
              SDK Playground
            </span>
          </div>
          <h1 className="max-w-3xl font-display text-[2.5rem] font-normal leading-[1.05] tracking-[-0.02em] text-editorial-ink sm:text-5xl">
            Every variant. <span className="italic text-editorial-neutral-3">In one place</span>
            <span className="text-editorial-accent">.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-[1.55] text-editorial-neutral-3">
            Click any G to see the widget in action. Modes, sizes, themes, positions, and triggers —
            this is the full surface area you can drop into a product.
          </p>
        </header>

        <SectionHeader eyebrow="Modes" title="Five widget shapes" />
        <div className="mb-20 grid grid-cols-1 gap-px bg-editorial-neutral-2 sm:grid-cols-2 [&>*]:bg-editorial-paper">
          <DemoCard
            label="Feedback"
            hint="Star rating + text"
            widget={
              <Gotcha
                elementId="mode-test-feedback"
                mode="feedback"
                size="sm"
                position="inline"
                showOnHover={false}
                promptText="What do you think?"
              />
            }
          />
          <DemoCard
            label="Vote"
            hint="Thumbs up / down"
            widget={
              <Gotcha
                elementId="mode-test-vote"
                mode="vote"
                size="sm"
                position="inline"
                showOnHover={false}
                promptText="Do you like this?"
              />
            }
          />
          <DemoCard
            label="Poll"
            hint="Custom options"
            widget={
              <Gotcha
                elementId="mode-test-poll"
                mode="poll"
                options={['Yes', 'No']}
                size="sm"
                position="inline"
                showOnHover={false}
                promptText="Should we ship this feature?"
              />
            }
          />
          <DemoCard
            label="Poll — multi"
            hint="Multiple selections allowed"
            widget={
              <Gotcha
                elementId="mode-test-poll-multi"
                mode="poll"
                options={['Analytics', 'Segments', 'Exports', 'API']}
                allowMultiple
                size="sm"
                position="inline"
                showOnHover={false}
                promptText="Which features matter most?"
              />
            }
          />
          <DemoCard
            label="NPS"
            hint="0–10 Net Promoter Score"
            widget={
              <Gotcha
                elementId="mode-test-nps"
                mode="nps"
                size="sm"
                position="inline"
                showOnHover={false}
                promptText="How likely are you to recommend us?"
              />
            }
          />
        </div>

        <SectionHeader eyebrow="Smart behaviors" title="Conditional triggers" />
        <div className="mb-20 grid grid-cols-1 gap-px bg-editorial-neutral-2 sm:grid-cols-2 [&>*]:bg-editorial-paper">
          <DemoCard
            label="Follow-up questions"
            hint="Give 1–2 stars to see the follow-up prompt"
            widget={
              <Gotcha
                elementId="demo-follow-up"
                mode="feedback"
                size="sm"
                position="inline"
                showOnHover={false}
                promptText="Rate this feature"
                followUp={{
                  ratingThreshold: 2,
                  promptText: 'What could we improve?',
                  placeholder: 'Tell us more…',
                }}
              />
            }
          />
          <DemoCard
            label="Bug report + screenshot"
            hint="Toggle the bug flag to see screenshot capture"
            widget={
              <Gotcha
                elementId="demo-bug-screenshot"
                mode="feedback"
                size="sm"
                position="inline"
                showOnHover={false}
                promptText="Report a bug"
                enableBugFlag
                enableScreenshot
              />
            }
          />
          <DemoCard
            label="Delayed trigger"
            hint="Widget appears after 3 seconds"
            widget={
              <Gotcha
                elementId="demo-delayed"
                mode="feedback"
                size="sm"
                position="inline"
                showOnHover={false}
                promptText="Delayed feedback"
                showAfterSeconds={3}
              />
            }
          />
          <DemoCard
            label="Scroll trigger"
            hint="Appears after scrolling 50% of the page"
            widget={
              <Gotcha
                elementId="demo-scroll-trigger"
                mode="feedback"
                size="sm"
                position="inline"
                showOnHover={false}
                promptText="Scroll-triggered feedback"
                showAfterScrollPercent={50}
              />
            }
          />
        </div>

        <SectionHeader eyebrow="Sizes" title="Three footprints" />
        <div className="mb-20 rounded-md border border-editorial-neutral-2 bg-editorial-paper p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
            <SizeRow label="sm — 24px" size="sm" id="size-sm" />
            <SizeRow label="md — 32px" size="md" id="size-md" />
            <SizeRow label="lg — 40px" size="lg" id="size-lg" />
          </div>
        </div>

        <SectionHeader eyebrow="Themes" title="Light. Dark. Auto." />
        <div className="mb-20 grid grid-cols-1 gap-px bg-editorial-neutral-2 sm:grid-cols-3">
          <ThemeCard label="Light" tone="paper" id="theme-light" theme="light" />
          <ThemeCard label="Dark" tone="ink" id="theme-dark" theme="dark" />
          <ThemeCard label="Auto" tone="neutral" id="theme-auto" theme="auto" />
        </div>

        <SectionHeader eyebrow="Positions" title="Where the G lives" />
        <div className="mb-4 rounded-md border border-editorial-neutral-2 bg-editorial-paper">
          <div className="flex items-center justify-between gap-6 p-6 md:p-8">
            <div className="min-w-0">
              <h3 className="text-[15px] text-editorial-ink">Inline</h3>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-editorial-neutral-3">
                Flows with text — the G sits wherever you drop it in the DOM.
              </p>
            </div>
            <Gotcha
              elementId="pos-inline"
              mode="feedback"
              size="sm"
              position="inline"
              showOnHover={false}
            />
          </div>
        </div>
        <div className="mb-20 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5">
          <PositionCard label="top-left" id="pos-top-left" position="top-left" />
          <PositionCard label="top-right" id="pos-top-right" position="top-right" />
          <PositionCard label="bottom-left" id="pos-bottom-left" position="bottom-left" />
          <PositionCard label="bottom-right" id="pos-bottom-right" position="bottom-right" />
        </div>

        <SectionHeader eyebrow="Visibility" title="Show on hover" />
        <div className="mb-20 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <VisibilityCard
            label="Always visible"
            hint="Default behaviour — the G sits in the corner at all times."
            id="hover-false"
            showOnHover={false}
          />
          <VisibilityCard
            label="Hover to reveal"
            hint="Hover anywhere in this card — the G fades in and stays until you move off."
            id="hover-true"
            showOnHover={true}
          />
        </div>

        <SectionHeader eyebrow="In context" title="Real-world placements" />
        <div className="mb-24 space-y-px bg-editorial-neutral-2">
          {/* Feature card */}
          <div className="flex items-center justify-between gap-6 bg-editorial-paper p-6 md:p-8">
            <div className="min-w-0">
              <h3 className="font-display text-[1.25rem] font-normal leading-[1.3] tracking-[-0.01em] text-editorial-ink">
                New analytics dashboard
              </h3>
              <p className="mt-2 text-[14px] leading-[1.55] text-editorial-neutral-3">
                Track user engagement, conversion rates, and more.
              </p>
            </div>
            <Gotcha
              elementId="example-analytics"
              mode="feedback"
              size="sm"
              position="inline"
              showOnHover={false}
              promptText="How useful is the new analytics dashboard?"
            />
          </div>

          {/* Pricing option — inverted ink card */}
          <div className="flex items-center justify-between gap-6 bg-editorial-ink p-6 text-editorial-paper md:p-8">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-paper/60">
                  Pro
                </span>
                <span className="h-px w-6 bg-editorial-paper/20" aria-hidden="true" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-paper/60">
                  $29/mo
                </span>
              </div>
              <h3 className="font-display text-[1.25rem] font-normal leading-[1.3] tracking-[-0.01em] text-editorial-paper">
                Unlimited projects, priority support, advanced analytics
              </h3>
            </div>
            <Gotcha
              elementId="example-pricing"
              mode="vote"
              size="sm"
              theme="dark"
              position="inline"
              showOnHover={false}
              promptText="Is this pricing fair?"
            />
          </div>

          {/* NPS example */}
          <div className="flex items-center justify-between gap-6 bg-editorial-paper p-6 md:p-8">
            <div className="min-w-0">
              <h3 className="font-display text-[1.25rem] font-normal leading-[1.3] tracking-[-0.01em] text-editorial-ink">
                NPS survey
              </h3>
              <p className="mt-2 text-[14px] leading-[1.55] text-editorial-neutral-3">
                Track Net Promoter Score at any touchpoint.
              </p>
            </div>
            <Gotcha
              elementId="example-nps"
              mode="nps"
              size="sm"
              position="inline"
              showOnHover={false}
              promptText="How likely are you to recommend this product?"
            />
          </div>

          {/* Settings item */}
          <div className="flex items-center justify-between gap-6 bg-editorial-paper p-6 md:p-8">
            <div className="min-w-0">
              <h3 className="text-[15px] text-editorial-ink">Dark mode</h3>
              <p className="mt-1 text-[13px] text-editorial-neutral-3">
                Enable dark theme across the app
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <div className="relative h-6 w-12 rounded-full bg-editorial-ink">
                <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-editorial-paper" />
              </div>
              <Gotcha
                elementId="example-setting"
                mode="feedback"
                size="sm"
                position="inline"
                showOnHover={false}
                promptText="How do you like dark mode?"
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <section className="border-t border-editorial-neutral-2 pt-16 text-center">
          <span
            className="mx-auto mb-6 block h-1.5 w-1.5 rounded-full bg-editorial-accent"
            aria-hidden="true"
          />
          <h2 className="font-display text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-editorial-ink sm:text-5xl">
            Ready to ship a feedback loop<span className="text-editorial-accent">?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-[1.55] text-editorial-neutral-3">
            Five minutes to install. Zero cookies, zero third-party scripts.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-md bg-editorial-ink px-6 py-3 text-[15px] font-medium text-editorial-paper transition-all duration-240 ease-page-turn hover:bg-editorial-ink/90"
            >
              Start for free
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3 8H13M13 8L9 4M13 8L9 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-md border border-editorial-neutral-2 bg-editorial-paper px-6 py-3 text-[15px] font-medium text-editorial-ink transition-colors duration-240 ease-page-turn hover:border-editorial-ink/20 hover:bg-editorial-ink/[0.03]"
            >
              View pricing
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

/** Section header — accent hairline + mono eyebrow + Fraunces title + bottom rule. */
function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8 border-b border-editorial-neutral-2 pb-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px w-6 bg-editorial-neutral-3/60" aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
          {eyebrow}
        </span>
      </div>
      <h2 className="font-display text-[1.75rem] font-normal leading-[1.15] tracking-[-0.01em] text-editorial-ink sm:text-[2rem]">
        {title}
      </h2>
    </div>
  );
}

/** Default playground card — label, hint, widget on the right. Hairline borders via parent gap. */
function DemoCard({
  label,
  hint,
  widget,
}: {
  label: string;
  hint?: string;
  widget: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 p-6 md:p-8">
      <div className="min-w-0">
        <h3 className="text-[15px] text-editorial-ink">{label}</h3>
        {hint && (
          <p className="mt-1.5 text-[13px] leading-[1.55] text-editorial-neutral-3">{hint}</p>
        )}
      </div>
      <div className="shrink-0">{widget}</div>
    </div>
  );
}

/** Sizes row — small-caps label + widget inline. */
function SizeRow({ label, size, id }: { label: string; size: 'sm' | 'md' | 'lg'; id: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
        {label}
      </span>
      <Gotcha elementId={id} mode="feedback" size={size} position="inline" showOnHover={false} />
    </div>
  );
}

/** Theme card — paper / ink / neutral tone to contrast the three widget themes. */
function ThemeCard({
  label,
  tone,
  id,
  theme,
}: {
  label: string;
  tone: 'paper' | 'ink' | 'neutral';
  id: string;
  theme: 'light' | 'dark' | 'auto';
}) {
  const toneCls = {
    paper: 'bg-editorial-paper text-editorial-ink',
    ink: 'bg-editorial-ink text-editorial-paper',
    neutral: 'bg-[rgb(var(--editorial-neutral-2)/0.4)] text-editorial-ink',
  }[tone];

  const eyebrowCls = tone === 'ink' ? 'text-editorial-paper/60' : 'text-editorial-neutral-3';

  return (
    <div className={`flex items-center justify-between gap-6 p-6 md:p-8 ${toneCls}`}>
      <span className={`font-mono text-[11px] uppercase tracking-[0.18em] ${eyebrowCls}`}>
        {label}
      </span>
      <Gotcha
        elementId={id}
        mode="feedback"
        size="sm"
        theme={theme}
        position="inline"
        showOnHover={false}
      />
    </div>
  );
}

/** Position preview — widget anchored to the named corner of its own card. */
function PositionCard({
  label,
  id,
  position,
}: {
  label: string;
  id: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  // Anchor the label to the corner OPPOSITE the widget so the two never collide.
  const labelCornerCls = {
    'top-left': 'bottom-4 right-5',
    'top-right': 'bottom-4 left-5',
    'bottom-left': 'top-4 right-5',
    'bottom-right': 'top-4 left-5',
  }[position];

  return (
    <div className="relative h-36 rounded-md border border-editorial-neutral-2 bg-editorial-paper">
      <span
        className={`absolute ${labelCornerCls} font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3`}
      >
        {label}
      </span>
      <Gotcha elementId={id} mode="feedback" size="sm" position={position} showOnHover={false} />
    </div>
  );
}

/** Visibility preview — demonstrates showOnHover with a hint line. */
function VisibilityCard({
  label,
  hint,
  id,
  showOnHover,
}: {
  label: string;
  hint: string;
  id: string;
  showOnHover: boolean;
}) {
  return (
    <div className="relative h-36 rounded-md border border-editorial-neutral-2 bg-editorial-paper p-6 md:p-7">
      <h3 className="text-[15px] text-editorial-ink">{label}</h3>
      <p className="mt-1.5 max-w-[32ch] text-[13px] leading-[1.55] text-editorial-neutral-3">
        {hint}
      </p>
      <Gotcha
        elementId={id}
        mode="feedback"
        size="sm"
        position="top-right"
        showOnHover={showOnHover}
      />
    </div>
  );
}
