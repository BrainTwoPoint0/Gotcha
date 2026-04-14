import * as React from 'react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  subtext,
  accent,
  className,
}: {
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-md border border-editorial-neutral-2 bg-editorial-paper p-6',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {accent && (
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-editorial-accent" />
        )}
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
          {label}
        </p>
      </div>
      <p className="mt-4 font-display text-4xl font-normal leading-[1] tracking-[-0.02em] text-editorial-ink tabular-nums">
        {value}
      </p>
      {subtext && (
        <p className="mt-3 text-[13px] leading-[1.55] text-editorial-neutral-3">{subtext}</p>
      )}
    </div>
  );
}
