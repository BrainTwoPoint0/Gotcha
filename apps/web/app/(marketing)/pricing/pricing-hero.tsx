export function PricingHero() {
  return (
    <section className="editorial relative bg-editorial-paper pt-24 pb-16 sm:pt-32 sm:pb-20">
      <div className="absolute inset-x-0 top-0 h-px bg-editorial-neutral-2" />
      <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
        <div className="mb-5 inline-flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-editorial-accent" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            Pricing
          </span>
        </div>
        <h1 className="mx-auto max-w-3xl font-display text-[2.5rem] font-normal leading-[1.05] tracking-[-0.02em] text-editorial-ink sm:text-5xl">
          Simple, transparent pricing
          <span className="text-editorial-accent">.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-[1.55] text-editorial-neutral-3 sm:text-xl">
          Add feedback to any component in 5 minutes. No credit card required. Start free, upgrade
          when you need.
        </p>
      </div>
    </section>
  );
}
