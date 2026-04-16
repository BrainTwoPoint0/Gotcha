'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { EditorialNavLink } from './top-nav';

export interface EditorialMobileDrawerProps {
  links: EditorialNavLink[];
  topSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
}

export function EditorialMobileDrawer({ links, topSlot, bottomSlot }: EditorialMobileDrawerProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();

  // Portal target is document.body — required because the parent top-nav
  // is `sticky + z-30` which creates a stacking context that scopes any
  // `z-40` / `z-50` children. Without the portal, page content was
  // visible through the backdrop and the drawer panel rendered on top of
  // the sticky nav's own row rather than over the full viewport.
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close on route change
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll + mark non-drawer content as inert while open. `inert`
  // hides the main content from the accessibility tree and blocks keyboard
  // focus from escaping the drawer.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const main = document.querySelector('main');
    main?.setAttribute('inert', '');
    return () => {
      document.body.style.overflow = prev;
      main?.removeAttribute('inert');
    };
  }, [open]);

  // ESC to close + focus the close affordance when the drawer opens so
  // keyboard users can dismiss without a mouse.
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);
  const toggleBtnRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        toggleBtnRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    closeBtnRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        ref={toggleBtnRef}
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-editorial-ink transition-colors hover:bg-editorial-ink/[0.04]"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          )}
        </svg>
      </button>

      {mounted &&
        createPortal(
          <>
            {/* Backdrop — 50% ink wash (was 30%; looked thin behind the
                drawer) + subtle blur. pointer-events-none while closed so
                clicks reach the page below after close animation. */}
            <div
              aria-hidden="true"
              onClick={() => setOpen(false)}
              className={cn(
                'fixed inset-0 z-[1000] bg-editorial-ink/50 backdrop-blur-sm transition-opacity duration-240 ease-page-turn',
                open ? 'opacity-100' : 'pointer-events-none opacity-0'
              )}
            />

            {/* Drawer panel — fixed on the right, slides in from off-screen */}
            <div
              className={cn(
                'editorial fixed inset-y-0 right-0 z-[1001] flex w-[min(88vw,340px)] flex-col border-l border-editorial-neutral-2 bg-editorial-paper shadow-[0_24px_64px_-12px_rgba(26,23,20,0.2)] transition-transform duration-240 ease-page-turn',
                open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
              )}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-editorial-neutral-2 px-5">
                <span className="font-display text-xl leading-none tracking-[-0.01em] text-editorial-ink">
                  Gotcha
                </span>
                <button
                  ref={closeBtnRef}
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-editorial-ink transition-colors hover:bg-editorial-ink/[0.04]"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {topSlot && (
                <div className="shrink-0 border-b border-editorial-neutral-2 px-5 py-4">{topSlot}</div>
              )}

              <nav className="flex-1 overflow-y-auto px-2 py-3">
                {links.map((link) => {
                  // Same most-specific-match logic as the desktop top-nav
                  // so /analytics/segments lights up Segments only, not
                  // Analytics too.
                  const matchesPath = (href: string) =>
                    href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname === href || pathname.startsWith(href + '/');
                  const winnerHref = links
                    .filter((l) => matchesPath(l.href))
                    .reduce<string | null>(
                      (best, l) => (best === null || l.href.length > best.length ? l.href : best),
                      null
                    );
                  const active = link.href === winnerHref;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'flex items-center justify-between rounded-md px-3 py-3 text-[15px] transition-colors',
                        active
                          ? 'bg-editorial-ink/[0.05] text-editorial-ink'
                          : 'text-editorial-neutral-3 hover:bg-editorial-ink/[0.03] hover:text-editorial-ink'
                      )}
                    >
                      <span>{link.label}</span>
                      {link.proLocked && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-editorial-accent">
                          Pro
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {bottomSlot && (
                <div className="shrink-0 border-t border-editorial-neutral-2 px-5 py-4">
                  {bottomSlot}
                </div>
              )}
            </div>
          </>,
          document.body
        )}
    </>
  );
}
