'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface EditorialNavLink {
  href: string;
  label: string;
  proLocked?: boolean;
}

export interface EditorialTopNavProps {
  links: EditorialNavLink[];
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  mobileMenuSlot?: React.ReactNode;
}

export function EditorialTopNav({
  links,
  leftSlot,
  rightSlot,
  mobileMenuSlot,
}: EditorialTopNavProps) {
  const pathname = usePathname();

  return (
    <nav className="editorial sticky top-0 z-30 border-b border-editorial-neutral-2 bg-editorial-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-4">
          <Link
            href="/dashboard"
            className="font-display text-xl leading-none tracking-[-0.01em] text-editorial-ink"
          >
            Gotcha
          </Link>
          {leftSlot && (
            <>
              <span aria-hidden="true" className="text-editorial-neutral-2">
                /
              </span>
              {leftSlot}
            </>
          )}
        </div>

        <div className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
          {links.map((link, idx) => {
            const active =
              link.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === link.href || pathname.startsWith(link.href + '/');
            const prev = links[idx - 1];
            // Hairline + mono "Pro" eyebrow at the first pro-locked link so the
            // free items read as the primary set and the paywalled items read
            // as a distinct, quieter group.
            const isGroupBoundary = link.proLocked && !prev?.proLocked;
            return (
              <React.Fragment key={link.href}>
                {isGroupBoundary && (
                  <div className="mx-2 flex h-5 items-center gap-2" aria-hidden="true">
                    <span className="h-5 w-px bg-editorial-neutral-2" />
                  </div>
                )}
                <Link
                  href={link.href}
                  className={cn(
                    'relative flex h-16 items-center px-3 text-[14px] transition-colors duration-240 ease-page-turn',
                    link.proLocked && !active
                      ? 'text-editorial-neutral-3/80 hover:text-editorial-ink'
                      : active
                        ? 'text-editorial-ink'
                        : 'text-editorial-neutral-3 hover:text-editorial-ink'
                  )}
                >
                  {link.label}
                  {link.proLocked && (
                    <span className="ml-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-editorial-accent/80">
                      Pro
                    </span>
                  )}
                  {active && (
                    <span
                      className="absolute inset-x-3 bottom-0 h-px bg-editorial-ink"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </React.Fragment>
            );
          })}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          <div className="hidden items-center gap-4 md:flex">{rightSlot}</div>
          <div className="md:hidden">{mobileMenuSlot}</div>
        </div>
      </div>
    </nav>
  );
}
