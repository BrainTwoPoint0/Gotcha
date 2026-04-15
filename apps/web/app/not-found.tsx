import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="editorial flex min-h-screen items-center justify-center bg-editorial-paper px-6 text-editorial-ink">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="h-px w-6 bg-editorial-accent" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            404 · Not found
          </span>
          <span className="h-px w-6 bg-editorial-accent" aria-hidden="true" />
        </div>
        <h1 className="font-display text-5xl font-normal leading-[1.05] tracking-[-0.02em] text-editorial-ink">
          The page you were looking for{' '}
          <span className="italic text-editorial-neutral-3">is not here</span>
          <span className="text-editorial-accent">.</span>
        </h1>
        <p className="mt-6 text-[15px] leading-[1.6] text-editorial-neutral-3">
          Wrong link, stale bookmark, or we moved it. Head back to known ground.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-editorial-ink px-5 py-3 text-[14px] font-medium text-editorial-paper transition-all duration-240 ease-page-turn hover:bg-editorial-ink/90"
          >
            Home
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-editorial-neutral-2 bg-editorial-paper px-5 py-3 text-[14px] text-editorial-ink transition-colors duration-240 ease-page-turn hover:bg-editorial-ink/[0.03]"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
