'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Tier {
  name: string;
  price: string;
  period: string;
  description: string;
  responses: string;
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
}

// Pro feature list lives in one place so the monthly and annual tiers
// can't drift when a new feature ships.
const proFeatures = [
  'Unlimited responses',
  'Unlimited projects',
  'Full analytics dashboard',
  'NPS & satisfaction tracking',
  'Bug tracking & flagging',
  'Follow-up questions on low scores',
  'Smart triggers (scroll, delay, visits)',
  'Auto-captured context & JS errors',
  'Team workspaces & roles',
  'Webhooks (Slack, Discord)',
  'Export to CSV & JSON',
  'User segmentation',
  'GDPR data export & deletion API',
];

const freeFeatures = ['500 responses/month', '1 project', 'Response viewer', 'Email support'];

const tiers: Record<'monthly' | 'annual', Tier[]> = {
  monthly: [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out Gotcha',
      responses: '500',
      features: freeFeatures,
      cta: 'Start free',
      href: '/signup',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      description: 'For individuals & teams',
      responses: 'Unlimited',
      features: proFeatures,
      cta: 'Go Pro',
      href: '/signup?plan=pro',
      highlighted: true,
    },
  ],
  annual: [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out Gotcha',
      responses: '500',
      features: freeFeatures,
      cta: 'Start free',
      href: '/signup',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$24',
      period: '/month',
      description: 'Billed annually ($288/yr)',
      responses: 'Unlimited',
      features: proFeatures,
      cta: 'Go Pro',
      href: '/signup?plan=pro&billing=annual',
      highlighted: true,
    },
  ],
};

export function PricingToggle() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const currentTiers = tiers[billing];

  return (
    <div>
      {/* Billing period selector — tablist semantics (Tab to focus, click
          or Enter/Space to activate). We previously used role=radiogroup
          here which requires arrow-key nav + single tab stop; the page's
          actual behaviour matches tablist, so the semantics follow.
          Stacks vertically on mobile so the annotation doesn't wrap
          awkwardly next to the toggle. */}
      <div className="mb-12 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
        <div
          role="tablist"
          aria-label="Billing period"
          className="inline-flex items-center rounded-md border border-editorial-neutral-2 bg-editorial-paper p-1"
        >
          <BillingTab
            active={billing === 'monthly'}
            onClick={() => setBilling('monthly')}
            label="Monthly"
          />
          <BillingTab
            active={billing === 'annual'}
            onClick={() => setBilling('annual')}
            label="Annual"
          />
        </div>
        {/* Always visible — the nudge pulls users toward annual. Copy flips
            on activation. Pointer-events-none + aria-hidden because the
            label is a decorative reinforcement of toggle state, not a
            second interaction target. */}
        <span
          aria-hidden="true"
          className="pointer-events-none font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-accent"
        >
          {billing === 'annual' ? 'Saving 17%' : 'Save 17% with annual'}
        </span>
      </div>

      {/* Tier cards */}
      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        {currentTiers.map((tier) => (
          <TierCard key={tier.name} tier={tier} />
        ))}
      </div>
    </div>
  );
}

function BillingTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-[4px] px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-240 ease-page-turn ${
        active
          ? 'bg-editorial-ink text-editorial-paper'
          : 'bg-transparent text-editorial-neutral-3 hover:text-editorial-ink'
      }`}
    >
      {label}
    </button>
  );
}

function TierCard({ tier }: { tier: Tier }) {
  // Pro gets a single hairline sienna top edge + an inline "Recommended"
  // label sibling to the tier name — no floating absolute pill. Accent
  // discipline: max 2 jobs on this card (top-edge + label).
  return (
    <article
      className={`relative flex flex-col rounded-md border border-editorial-neutral-2 bg-editorial-paper p-8 ${
        tier.highlighted ? 'border-t border-t-editorial-accent' : ''
      }`}
    >
      <header>
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-[1.75rem] font-normal leading-[1.15] tracking-[-0.01em] text-editorial-ink">
            {tier.name}
          </h3>
          {tier.highlighted && (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-accent">
              Recommended
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[13px] leading-[1.55] text-editorial-neutral-3">
          {tier.description}
        </p>
      </header>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="font-display text-5xl font-normal leading-none tracking-[-0.02em] text-editorial-ink">
          {tier.price}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
          {tier.period}
        </span>
      </div>

      <div className="mt-6 flex items-baseline gap-2 border-t border-editorial-neutral-2 pt-5">
        <span className="font-display text-[1.5rem] font-normal text-editorial-ink">
          {tier.responses}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
          responses / month
        </span>
      </div>

      <ul className="mt-6 flex-1 space-y-2.5">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-[14px] text-editorial-ink">
            <svg
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-editorial-neutral-3"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 7.5L6 10L11 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="leading-[1.5]">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA balance — Pro is the single button, Free is a text link
          (matches the Programs "Get started" pattern). One primary per
          visible area, not two equal-weight buttons. */}
      {tier.highlighted ? (
        <Link
          href={tier.href}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-md bg-editorial-ink px-6 py-3 text-[15px] font-medium text-editorial-paper transition-colors duration-240 ease-page-turn hover:bg-editorial-ink/90"
        >
          {tier.cta}
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
      ) : (
        <Link
          href={tier.href}
          className="mt-8 inline-flex items-center gap-2 self-start font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-ink underline decoration-editorial-neutral-2 decoration-1 underline-offset-[6px] transition-colors hover:decoration-editorial-accent"
        >
          {tier.cta}
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8H13M13 8L9 4M13 8L9 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      )}
    </article>
  );
}
