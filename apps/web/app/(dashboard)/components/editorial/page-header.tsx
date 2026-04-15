import * as React from 'react';
import { cn } from '@/lib/utils';
import { EditorialEyebrow } from './eyebrow';

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
          <EditorialEyebrow rule="none" className="mb-3">
            {eyebrow}
          </EditorialEyebrow>
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
