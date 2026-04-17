const refusals = [
  {
    title: 'No trackers',
    body: 'The SDK talks to one origin — ours. No Segment, no PostHog, no Google, no Sentry. Nothing piggybacks.',
  },
  {
    title: 'No cookies',
    body: 'We set none. Not for auth, not for tracking, not for sessions. Your cookie banner does not need a new row.',
  },
  {
    title: 'No fingerprinting',
    body: 'No canvas hashing, no font probing, no audio context. No passive signal gathering while the button sits there.',
  },
  {
    title: 'No third-party fonts',
    body: 'The signature glyph is embedded inline. Everything else uses your system font. Google never sees a request.',
  },
];

export function PrivacySection() {
  return (
    <section className="editorial relative bg-editorial-ink py-24 text-editorial-paper sm:py-32">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        {/* Section eyebrow — inverted */}
        <div className="mb-8 flex items-center gap-3">
          <span className="h-px w-8 bg-editorial-accent" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-paper/60">
            Privacy posture
          </span>
        </div>

        {/* Headline */}
        <h2 className="max-w-3xl font-display text-4xl font-normal leading-[1.1] tracking-[-0.02em] sm:text-5xl">
          Feedback <span className="italic text-editorial-paper/70">without surveillance</span>.
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-[1.55] text-editorial-paper/70">
          Most &ldquo;lightweight&rdquo; SDKs smuggle in trackers. We audited ours so you can audit
          ours. Here&rsquo;s what the button does not do.
        </p>

        {/* Refusals — editorial list, not cards */}
        <dl className="mt-16 grid gap-x-12 gap-y-10 border-t border-editorial-paper/10 pt-12 sm:grid-cols-2">
          {refusals.map((item) => (
            <div key={item.title}>
              <dt className="flex items-baseline gap-3 font-display text-[1.375rem] font-normal leading-[1.2] tracking-[-0.01em]">
                <span className="font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-editorial-accent">
                  No
                </span>
                <span>{item.title.replace(/^No /, '')}</span>
              </dt>
              <dd className="mt-3 text-[15px] leading-[1.6] text-editorial-paper/70">
                {item.body}
              </dd>
            </div>
          ))}
        </dl>

        {/* Honest disclosure — plain inset paragraph, not a signature card.
            The synthesis-card pattern is reserved for the loop section; using it
            twice on the same page dilutes the signature. Here we just say the truth. */}
        <div className="mt-16 border-t border-editorial-paper/10 pt-8">
          <p className="max-w-2xl text-[15px] leading-[1.65] text-editorial-paper/70">
            <span className="text-editorial-paper">
              What we do collect, only when someone submits:
            </span>{' '}
            page URL, browser, viewport, language, timezone. Recent JS errors are{' '}
            <span className="italic">opt-in</span> and off by default — you choose what travels with
            a bug report. Nothing ships pre-emptively. If your user never submits, we never hear
            from their browser.{' '}
            <a
              href="https://www.npmjs.com/package/gotcha-feedback"
              className="underline decoration-editorial-paper/30 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent"
            >
              Audit the SDK on npm
            </a>
            .
          </p>
        </div>
      </div>

      {/* Hairline bottom rule — editorial signature */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-editorial-paper/10" aria-hidden="true" />
    </section>
  );
}
