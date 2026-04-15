import * as React from 'react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  /** Optional period-over-period delta. Positive = success tone, negative = alert tone, zero = muted. */
  delta?: number | null;
  /** Suffix for the delta number (e.g. "%", "pp"). */
  deltaLabel?: string;
  accent?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  delta,
  deltaLabel = '',
  accent,
  className,
}: StatCardProps) {
  const hasDelta = delta !== null && delta !== undefined;
  const deltaTone =
    !hasDelta || delta === 0
      ? 'text-editorial-neutral-3'
      : delta! > 0
        ? 'text-editorial-success'
        : 'text-editorial-alert';

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
      <div className="mt-4 flex items-baseline gap-2">
        <p className="font-display text-4xl font-normal leading-[1] tracking-[-0.02em] text-editorial-ink tabular-nums">
          {value}
        </p>
        {hasDelta && (
          <span className={`font-mono text-[11px] uppercase tracking-[0.14em] ${deltaTone}`}>
            {delta! > 0 ? '↑' : delta! < 0 ? '↓' : ''}
            {delta! > 0 ? '+' : ''}
            {delta}
            {deltaLabel}
          </span>
        )}
      </div>
      {subtext && (
        <p className="mt-3 text-[13px] leading-[1.55] text-editorial-neutral-3">{subtext}</p>
      )}
    </div>
  );
}
