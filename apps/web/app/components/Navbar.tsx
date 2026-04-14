import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="editorial sticky top-0 z-50 border-b border-editorial-neutral-2 bg-editorial-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 lg:px-8">
        <Link
          href="/"
          className="flex items-baseline gap-[2px] font-display text-xl leading-none tracking-[-0.01em] text-editorial-ink"
        >
          Gotcha
          <span className="text-editorial-accent">.</span>
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          <Link
            href="/demo"
            className="text-[14px] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
          >
            Demo
          </Link>
          <Link
            href="/pricing"
            className="text-[14px] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
          >
            Pricing
          </Link>
        </div>

        {user ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-editorial-ink px-4 py-2 text-[14px] font-medium text-editorial-paper transition-colors hover:bg-editorial-ink/90"
          >
            Dashboard
          </Link>
        ) : (
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-[14px] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-md bg-editorial-ink px-4 py-2 text-[14px] font-medium text-editorial-paper transition-colors hover:bg-editorial-ink/90"
            >
              Start free
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
