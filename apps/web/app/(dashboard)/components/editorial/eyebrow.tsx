import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EditorialEyebrowProps {
  children: React.ReactNode;
  /** Accent hairline rule. Omit to render just the text. */
  rule?: 'leading' | 'none';
  /** Letter tracking. `wide` is 0.18em (section headers); `tight` is 0.14em (metadata). */
  tracking?: 'wide' | 'tight';
  /** Override the tone of the eyebrow text. Defaults to neutral-3. */
  tone?: 'neutral' | 'ink' | 'accent' | 'success' | 'alert';
  className?: string;
}

const TONE_MAP = {
  neutral: 'text-editorial-neutral-3',
  ink: 'text-editorial-ink',
  accent: 'text-editorial-accent',
  success: 'text-editorial-success',
  alert: 'text-editorial-alert',
} as const;

export function EditorialEyebrow({
  children,
  rule = 'leading',
  tracking = 'wide',
  tone = 'neutral',
  className,
}: EditorialEyebrowProps) {
  const trackingClass = tracking === 'wide' ? 'tracking-[0.18em]' : 'tracking-[0.14em]';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {rule === 'leading' && <span aria-hidden="true" className="h-px w-6 bg-editorial-accent" />}
      <span className={cn('font-mono text-[11px] uppercase', trackingClass, TONE_MAP[tone])}>
        {children}
      </span>
    </div>
  );
}
