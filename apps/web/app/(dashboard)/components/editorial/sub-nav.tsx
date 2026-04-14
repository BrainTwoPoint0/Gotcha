'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface EditorialSubNavItem {
  href: string;
  label: string;
  match?: 'exact' | 'prefix';
}

export function EditorialSubNav({
  items,
  className,
}: {
  items: EditorialSubNavItem[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div className={cn('flex items-center gap-1 border-b border-editorial-neutral-2', className)}>
      {items.map((item) => {
        const active =
          item.match === 'prefix'
            ? pathname === item.href || pathname.startsWith(item.href + '/')
            : pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative inline-flex h-11 items-center px-3 text-[14px] transition-colors duration-240 ease-page-turn',
              active ? 'text-editorial-ink' : 'text-editorial-neutral-3 hover:text-editorial-ink'
            )}
          >
            {item.label}
            {active && (
              <span
                className="absolute inset-x-3 -bottom-px h-px bg-editorial-ink"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
