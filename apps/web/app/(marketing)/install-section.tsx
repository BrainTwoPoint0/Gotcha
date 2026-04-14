const snippet = `import { GotchaProvider, Gotcha } from 'gotcha-feedback';

<GotchaProvider apiKey="your-api-key">
  <App />
</GotchaProvider>

<Gotcha elementId="checkout" mode="nps" />
<Gotcha elementId="search" mode="vote" />
<Gotcha elementId="app" enableBugFlag enableScreenshot />`;

export function InstallSection() {
  return (
    <section className="editorial relative bg-editorial-paper py-24 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-editorial-neutral-2" aria-hidden="true" />

      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mb-10 flex items-center gap-3">
          <span className="h-px w-8 bg-editorial-accent" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            Five minutes
          </span>
        </div>

        <h2 className="max-w-2xl font-display text-3xl font-normal leading-[1.15] tracking-[-0.02em] text-editorial-ink sm:text-4xl">
          One provider, one component.{' '}
          <span className="italic text-editorial-neutral-3">That is the whole API.</span>
        </h2>

        {/* Editorial code block — no chrome dots, no gradient. Just ink on cream. */}
        <div className="mt-12 overflow-hidden rounded-md border border-editorial-neutral-2 bg-editorial-ink">
          <div className="flex items-center justify-between border-b border-editorial-paper/10 px-5 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-paper/50">
              app.tsx
            </span>
            <span className="font-mono text-[11px] text-editorial-paper/40">TypeScript</span>
          </div>
          <pre className="overflow-x-auto p-6 font-mono text-[13.5px] leading-[1.7] text-editorial-paper/90">
            <code>{snippet}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
