'use client';

import * as React from 'react';
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
  const pathname = usePathname();

  // Close on route change
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while open
  React.useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <>
      <button
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

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-editorial-ink/30 transition-opacity duration-240 ease-page-turn',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      {/* Drawer */}
      <div
        className={cn(
          'editorial fixed inset-y-0 right-0 z-50 flex w-[min(88vw,340px)] flex-col border-l border-editorial-neutral-2 bg-editorial-paper transition-transform duration-240 ease-page-turn',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <div className="flex h-16 items-center justify-between border-b border-editorial-neutral-2 px-5">
          <span className="flex items-baseline gap-[2px] font-display text-xl leading-none tracking-[-0.01em] text-editorial-ink">
            Gotcha
            <span className="text-editorial-accent">.</span>
          </span>
          <button
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

        {topSlot && <div className="border-b border-editorial-neutral-2 px-5 py-4">{topSlot}</div>}

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {links.map((link) => {
            const active =
              link.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === link.href || pathname.startsWith(link.href + '/');
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
          <div className="border-t border-editorial-neutral-2 px-5 py-4">{bottomSlot}</div>
        )}
      </div>
    </>
  );
}
