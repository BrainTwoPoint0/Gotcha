import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Editorial skeleton — a flat neutral-2 block at reduced opacity. No shimmer
 * animation (breaks the turning-a-page motion language, and shimmers become
 * visual noise at scale). Reads as "content still settling." Respects
 * reduced-motion implicitly because it doesn't animate.
 */
export function EditorialSkeleton({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-sm bg-editorial-neutral-2/50', className)}
      aria-hidden="true"
      {...rest}
    />
  );
}

export function EditorialSkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <EditorialSkeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-3/4' : 'w-full')} />
      ))}
    </div>
  );
}

/**
 * A table-shaped skeleton row used inside an EditorialCard container.
 * Renders six columns matching the responses / bugs table grid.
 */
export function EditorialSkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <div
      className="flex items-center gap-6 border-b border-editorial-neutral-2 px-6 py-4 last:border-b-0"
      aria-hidden="true"
    >
      <EditorialSkeleton className="h-4 flex-1" />
      {Array.from({ length: cols - 1 }).map((_, i) => (
        <EditorialSkeleton key={i} className={cn('h-4', i % 2 === 0 ? 'w-24' : 'w-16')} />
      ))}
    </div>
  );
}
