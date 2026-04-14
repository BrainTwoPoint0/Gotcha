import Link from 'next/link';
import { Suspense } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="editorial flex min-h-screen bg-editorial-paper text-editorial-ink">
      {/* Left panel — editorial quote, inverted */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-editorial-ink p-12 text-editorial-paper lg:flex lg:w-[45%]">
        {/* Hairline top rule */}
        <div className="absolute inset-x-0 top-0 h-px bg-editorial-paper/10" aria-hidden="true" />

        <div className="relative z-10 flex items-baseline gap-[2px] font-display text-2xl leading-none tracking-[-0.01em]">
          <Link href="/" className="transition-colors hover:text-editorial-accent">
            Gotcha
          </Link>
          <span className="text-editorial-accent">.</span>
        </div>

        <div className="relative z-10 max-w-md space-y-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-paper/50">
            What the loop sounds like
          </span>
          <blockquote className="font-display text-[1.875rem] font-normal leading-[1.2] tracking-[-0.01em]">
            &ldquo;Your users ask. <span className="italic text-editorial-paper/70">You ship.</span>{' '}
            They hear back — the feedback loop that closes itself.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3 text-[13px] text-editorial-paper/60">
            <span className="h-px w-8 bg-editorial-accent" aria-hidden="true" />
            <span>No analytics. No cookies. No tracking.</span>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-[12px] text-editorial-paper/40">
          <Link href="/terms" className="transition-colors hover:text-editorial-paper/80">
            Terms
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-editorial-paper/80">
            Privacy
          </Link>
        </div>
      </aside>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col">
        <div className="lg:hidden">
          <div className="flex items-center justify-between border-b border-editorial-neutral-2 px-6 py-5">
            <Link
              href="/"
              className="flex items-baseline gap-[2px] font-display text-xl leading-none tracking-[-0.01em] text-editorial-ink"
            >
              Gotcha
              <span className="text-editorial-accent">.</span>
            </Link>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <Suspense>{children}</Suspense>
        </div>
      </div>
    </div>
  );
}
