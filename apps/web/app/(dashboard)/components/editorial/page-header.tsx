import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EditorialPageHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EditorialPageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: EditorialPageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-6 pb-10 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-6 bg-editorial-accent" aria-hidden="true" />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="font-display text-3xl font-normal leading-[1.1] tracking-[-0.02em] text-editorial-ink sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-[15px] leading-[1.6] text-editorial-neutral-3">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
    </header>
  );
}
