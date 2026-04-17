import Link from 'next/link';
import { PricingToggle } from './pricing-toggle';
import { CtaSection } from '../cta-section';
import { PricingHero } from './pricing-hero';

const programs = [
  {
    eyebrow: 'Education',
    title: 'Students & universities',
    benefits: [
      'Validate thesis projects with real user feedback',
      'Run usability studies on class assignments',
      'Collect NPS from beta testers before demo day',
    ],
  },
  {
    eyebrow: 'Startups',
    title: 'Early-stage teams',
    benefits: [
      'Measure product-market fit with NPS scores',
      'Prioritise your roadmap with actual user votes',
      'Export feedback data to share with investors',
    ],
  },
  {
    eyebrow: 'Product teams',
    title: 'Growing organisations',
    benefits: [
      'Track satisfaction across features as a team',
      'Route bug reports and feedback to Slack',
      'Segment feedback by user type for insights',
    ],
  },
];

const buildVsBuy = {
  build: {
    title: 'Build it yourself',
    items: [
      { label: 'Engineering time (20–40 hours)', cost: '$3,000+' },
      { label: 'Database & infrastructure', cost: '$20/mo' },
      { label: 'Ongoing maintenance', cost: '$100/mo' },
    ],
    total: '$3,000+ upfront · $120/mo',
    time: '1–3 weeks to build',
  },
  buy: {
    title: 'Use Gotcha',
    items: [
      { label: 'npm install gotcha-feedback', cost: '2 min' },
      { label: 'Add <Gotcha /> component', cost: '1 min' },
      { label: 'Start collecting feedback', cost: 'Instant' },
    ],
    total: 'From $0/mo',
    time: '5 minutes to integrate',
  },
};

export default function PricingPage() {
  return (
    <main className="editorial min-h-screen bg-editorial-paper text-editorial-ink">
      <PricingHero />

      {/* Tiers */}
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20 lg:px-8">
        <PricingToggle />

        {/* Need more? — centred editorial aside, hairline above + below
            so it reads as a margin note, not a boxed system banner. */}
        <div className="mt-12 border-y border-editorial-neutral-2 py-6 text-center">
          <p className="text-[14px] leading-[1.55] text-editorial-neutral-3">
            Need SSO, SLA, or custom integrations?{' '}
            <a
              href="mailto:info@braintwopoint0.com"
              className="text-editorial-ink underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>

      {/* Programs */}
      <section className="border-t border-editorial-neutral-2 bg-editorial-paper py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-3">
              <span className="h-px w-6 bg-editorial-neutral-3/60" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                Who uses Gotcha
              </span>
            </div>
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-editorial-ink sm:text-5xl">
              From solo founders to product teams
              <span className="text-editorial-accent">.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-[1.55] text-editorial-neutral-3">
              Three patterns that come up the most.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px bg-editorial-neutral-2 md:grid-cols-3 [&>*]:bg-editorial-paper">
            {programs.map((program) => (
              <article key={program.eyebrow} className="p-8">
                {/* Neutral eyebrow rule — sienna reserved for 2 jobs per
                    section; Programs cadence uses the neutral one. */}
                <div className="mb-3 flex items-center gap-3">
                  <span className="h-px w-6 bg-editorial-neutral-3/60" aria-hidden="true" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                    {program.eyebrow}
                  </span>
                </div>
                <h3 className="font-display text-[1.375rem] font-normal leading-[1.25] tracking-[-0.01em] text-editorial-ink">
                  {program.title}
                </h3>
                <ul className="mt-5 space-y-2.5">
                  {program.benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-2.5 text-[14px] leading-[1.55] text-editorial-neutral-3"
                    >
                      <svg
                        className="mt-1 h-3 w-3 shrink-0 text-editorial-neutral-3"
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
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-ink underline decoration-editorial-neutral-2 decoration-1 underline-offset-[6px] transition-colors hover:decoration-editorial-accent"
                >
                  Get started
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
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Build vs Buy */}
      <section className="border-t border-editorial-neutral-2 bg-editorial-paper py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-3">
              <span className="h-px w-6 bg-editorial-neutral-3/60" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                Build vs buy
              </span>
            </div>
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-editorial-ink sm:text-5xl">
              Weeks of engineering, or five minutes
              <span className="text-editorial-accent">.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {/* Build */}
            <article className="rounded-md border border-editorial-neutral-2 bg-editorial-paper p-6 md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-6 bg-editorial-neutral-3/60" aria-hidden="true" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                  Build
                </span>
              </div>
              <h3 className="font-display text-[1.5rem] font-normal leading-[1.2] tracking-[-0.01em] text-editorial-ink">
                {buildVsBuy.build.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {buildVsBuy.build.items.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-4 border-b border-editorial-neutral-2 pb-3 text-[14px] text-editorial-neutral-3 last:border-b-0 last:pb-0"
                  >
                    <span className="min-w-0">{item.label}</span>
                    <span className="shrink-0 font-mono text-[13px] tabular-nums text-editorial-ink">
                      {item.cost}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-5 space-y-2 border-t border-editorial-neutral-2 pt-5">
                <div className="flex items-center justify-between">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                    Total cost
                  </dt>
                  <dd className="font-display text-[1rem] text-editorial-ink">
                    {buildVsBuy.build.total}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                    Time to launch
                  </dt>
                  <dd className="text-[13px] text-editorial-ink">{buildVsBuy.build.time}</dd>
                </div>
              </dl>
            </article>

            {/* Buy — single brand moment for this section. One solid
                sienna border instead of a doubled border+shadow combo so
                the edge reads as one clean stroke at every DPI. Eyebrow
                rule + label stay neutral — the border already says
                "this one". */}
            <article className="rounded-md border border-editorial-accent/70 bg-editorial-paper p-6 md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-6 bg-editorial-neutral-3/60" aria-hidden="true" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                  Buy
                </span>
              </div>
              <h3 className="font-display text-[1.5rem] font-normal leading-[1.2] tracking-[-0.01em] text-editorial-ink">
                {buildVsBuy.buy.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {buildVsBuy.buy.items.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-4 border-b border-editorial-neutral-2 pb-3 text-[14px] text-editorial-neutral-3 last:border-b-0 last:pb-0"
                  >
                    <span>{item.label}</span>
                    <span className="font-mono text-[13px] tabular-nums text-editorial-ink">
                      {item.cost}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-5 space-y-2 border-t border-editorial-neutral-2 pt-5">
                <div className="flex items-center justify-between">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                    Total cost
                  </dt>
                  <dd className="font-display text-[1rem] text-editorial-ink">
                    {buildVsBuy.buy.total}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                    Time to launch
                  </dt>
                  <dd className="text-[13px] text-editorial-ink">{buildVsBuy.buy.time}</dd>
                </div>
              </dl>
            </article>
          </div>

          {/* Code example — editorial paper frame. Ink slab removed; the
              rest of the marketing site stays on paper, this does too.
              Neutral eyebrow rule so sienna stays disciplined. */}
          <figure className="mt-12 overflow-hidden rounded-md border border-editorial-neutral-2 bg-editorial-paper">
            <figcaption className="flex items-center gap-3 border-b border-editorial-neutral-2 bg-editorial-paper px-5 py-3">
              <span className="h-px w-6 bg-editorial-neutral-3/60" aria-hidden="true" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                It&rsquo;s this simple
              </span>
            </figcaption>
            <pre className="overflow-x-auto bg-editorial-ink/[0.02] p-5 font-mono text-[13px] leading-[1.6] text-editorial-ink">
              <code>{`npm install gotcha-feedback

import { GotchaProvider, Gotcha } from 'gotcha-feedback';

function App() {
  return (
    <GotchaProvider apiKey="your-api-key">
      <FeatureCard>
        <Gotcha elementId="feature-card" />
      </FeatureCard>
    </GotchaProvider>
  );
}`}</code>
            </pre>
          </figure>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-editorial-neutral-2 bg-editorial-paper py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-3">
              <span className="h-px w-6 bg-editorial-neutral-3/60" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                FAQ
              </span>
            </div>
            <h2 className="font-display text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-editorial-ink sm:text-5xl">
              Frequently asked questions
            </h2>
          </div>

          <dl className="divide-y divide-editorial-neutral-2 border-y border-editorial-neutral-2">
            <FaqItem
              q="Is there a trial of Pro?"
              a="The Free plan is the trial — 500 responses/month, forever, no credit card. It's the full widget, the full dashboard, and every SDK feature. Upgrade to Pro only when you need unlimited responses, team workspaces, or advanced analytics."
            />
            <FaqItem
              q="What counts as a response?"
              a="Any feedback submission from your users — a star rating, thumbs up/down vote, poll selection, NPS score, bug report, or written feedback. Each unique submission counts as one response."
            />
            <FaqItem
              q="Can I upgrade or downgrade anytime?"
              a="Yes. Upgrade from Free to Pro takes effect immediately. Downgrades apply at the start of your next billing cycle. No refunds for partial billing periods."
            />
            <FaqItem
              q="What happens if I exceed the free limit?"
              a="We notify you at 80% of your 500 responses. Past the cap, new responses are still collected but marked as gated — you'll need to upgrade to Pro to access them. Pro has unlimited responses."
            />
            <FaqItem
              q="What happens to my data if I cancel?"
              a="Cancelling Pro drops you back to Free — all your historical responses stay in the dashboard, but anything collected above the 500/month Free limit becomes gated (visible in summary, content redacted) until you re-upgrade. If you fully terminate your account, we keep your data exportable for 30 days (CSV or JSON via the dashboard or the export API), then delete it."
            />
            <FaqItem
              q="Do you offer an SLA?"
              a={
                <>
                  Not on Free or Pro — we strive for high availability but don&rsquo;t commit to an
                  uptime number on self-serve plans. If you need a formal SLA, SSO, DPA, or a custom
                  contract,{' '}
                  <a
                    href="mailto:info@braintwopoint0.com"
                    className="text-editorial-ink underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent"
                  >
                    contact us
                  </a>
                  .
                </>
              }
            />
            <FaqItem
              q="Where is data stored? Is it GDPR-compliant?"
              a={
                <>
                  Yes. Data is stored in managed Supabase Postgres (EU region) and screenshots in
                  private Supabase Storage. We provide data-export and deletion APIs scoped per
                  project so customers can fulfil GDPR data-subject requests from their own users.
                  See the{' '}
                  <a
                    href="/privacy"
                    className="text-editorial-ink underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent"
                  >
                    Privacy Policy
                  </a>{' '}
                  for the full detail.
                </>
              }
            />
            <FaqItem
              q="How do the special programs work?"
              a="We offer custom pricing for students, universities, accelerators, and investors. Contact us to discuss partnership opportunities for your organisation."
            />
          </dl>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div className="grid gap-3 py-6 md:grid-cols-[220px_1fr] md:gap-10">
      <dt className="font-display text-[1.125rem] font-normal leading-[1.3] tracking-[-0.01em] text-editorial-ink">
        {q}
      </dt>
      <dd className="text-[15px] leading-[1.6] text-editorial-neutral-3">{a}</dd>
    </div>
  );
}
