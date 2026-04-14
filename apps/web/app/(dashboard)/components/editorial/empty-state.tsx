import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EditorialEmptyStateProps {
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EditorialEmptyState({ title, body, action, className }: EditorialEmptyStateProps) {
  return (
    <div
      className={cn(
        'mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-20 text-center',
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-editorial-accent" aria-hidden="true" />
      <h2 className="font-display text-2xl font-normal leading-[1.2] tracking-[-0.01em] text-editorial-ink sm:text-[1.75rem]">
        {title}
      </h2>
      {body && <p className="text-[14px] leading-[1.6] text-editorial-neutral-3">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
