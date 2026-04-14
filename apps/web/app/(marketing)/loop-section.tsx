const steps = [
  {
    num: '01',
    title: 'A user says something',
    body: 'They tap the button in your product. Rate, vote, report a bug, answer a poll. One click. Their feedback is tied to the exact screen they were on.',
  },
  {
    num: '02',
    title: 'You see the theme, not the noise',
    body: 'The dashboard surfaces patterns — what people keep asking for, what keeps breaking, where the friction lives. You read a synthesis, not a spreadsheet.',
  },
  {
    num: '03',
    title: 'You triage and ship',
    body: 'Move feedback from new to planned to building to shipped. It reads like a changelog your users can follow. Public roadmap if you want one.',
  },
  {
    num: '04',
    title: 'They hear back',
    body: 'When you ship their request, they get a note. Not a newsletter. A personal line: you asked for this, we built it, here it is. That is the loop.',
  },
];

export function LoopSection() {
  return (
    <section className="editorial relative bg-editorial-paper py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        {/* Section eyebrow */}
        <div className="mb-8 flex items-center gap-3">
          <span className="h-px w-8 bg-editorial-accent" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            The Loop
          </span>
        </div>

        {/* Headline */}
        <h2 className="max-w-3xl font-display text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-editorial-ink sm:text-5xl">
          Your users ask. <span className="italic text-editorial-neutral-3">You ship.</span>{' '}
          <br className="hidden sm:block" />
          They hear back
          <span className="text-editorial-accent">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-[1.55] text-editorial-neutral-3">
          Most feedback tools stop at <span className="italic">capture</span>. Gotcha is built
          around what happens next — the conversation that turns a submission into a relationship.
        </p>

        {/* Steps — hairline-separated, editorial two-column grid */}
        <div className="mt-16 grid gap-px border-y border-editorial-neutral-2 bg-editorial-neutral-2 sm:grid-cols-2">
          {steps.map((step) => (
            <article
              key={step.num}
              className="group bg-editorial-paper p-8 transition-colors duration-240 hover:bg-editorial-ink/[0.015] sm:p-10"
            >
              <div className="mb-5 flex items-baseline gap-4">
                <span className="font-mono text-[13px] text-editorial-accent">{step.num}</span>
                <span className="h-px flex-1 bg-editorial-neutral-2" aria-hidden="true" />
              </div>
              <h3 className="font-display text-[1.5rem] font-normal leading-[1.2] tracking-[-0.01em] text-editorial-ink">
                {step.title}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-editorial-neutral-3">{step.body}</p>
            </article>
          ))}
        </div>

        {/* Signature synthesis card — the dashboard's equivalent of the glass G button.
            This is the thing people screenshot. */}
        <figure className="mt-20 border-l-2 border-editorial-accent py-6 pl-8 sm:pl-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            What you see on a Tuesday morning
          </span>
          <blockquote className="mt-4 font-display text-2xl font-normal leading-[1.25] tracking-[-0.01em] text-editorial-ink sm:text-[1.75rem]">
            &ldquo;Users are asking for recurring reminders —{' '}
            <span className="italic">fourteen mentions this week</span>, up from three last
            month.&rdquo;
          </blockquote>
          <figcaption className="mt-5 flex items-center gap-3 text-[13px] text-editorial-neutral-3">
            <span className="h-1.5 w-1.5 rounded-full bg-editorial-accent" aria-hidden="true" />
            <span className="font-mono uppercase tracking-[0.14em]">
              Synthesised theme · 14 submissions
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
