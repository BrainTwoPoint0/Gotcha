import Link from 'next/link';

export function CtaSection() {
  return (
    <section className="editorial relative bg-editorial-paper py-24 sm:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-editorial-neutral-2" aria-hidden="true" />

      <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
        {/* One accent mark — the whole section is quiet except for this */}
        <span
          className="mx-auto mb-8 block h-1.5 w-1.5 rounded-full bg-editorial-accent"
          aria-hidden="true"
        />

        <h2 className="font-display text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-editorial-ink sm:text-5xl">
          Open the line
          <span className="text-editorial-accent">.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-[1.55] text-editorial-neutral-3">
          Five minutes to install. No credit card. Free on every plan until your users keep talking
          back.
        </p>

        <div className="mt-10">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-md bg-editorial-ink px-7 py-3 text-[15px] font-medium text-editorial-paper transition-all duration-240 ease-page-turn hover:bg-editorial-ink/90"
          >
            Start listening
            <span
              aria-hidden="true"
              className="transition-transform duration-240 group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
          npm install gotcha-feedback
        </p>
      </div>
    </section>
  );
}
