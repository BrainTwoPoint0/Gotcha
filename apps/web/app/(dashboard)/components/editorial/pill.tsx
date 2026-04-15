import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EditorialPillProps {
  children: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'alert' | 'ink' | 'muted';
  /** `solid` = filled background. `outline` = hairline border only. */
  variant?: 'solid' | 'outline';
  /** Leading glyph — accent dot, status icon, etc. */
  leading?: React.ReactNode;
  className?: string;
}

const TONE_MAP = {
  neutral: {
    solid: 'bg-editorial-ink/[0.04] text-editorial-ink',
    outline: 'border border-editorial-neutral-2 bg-editorial-paper text-editorial-ink',
  },
  accent: {
    solid: 'bg-editorial-accent/[0.08] text-editorial-accent',
    outline: 'border border-editorial-accent/30 bg-editorial-accent/[0.04] text-editorial-accent',
  },
  success: {
    solid: 'bg-editorial-success/[0.08] text-editorial-success',
    outline:
      'border border-editorial-success/30 bg-editorial-success/[0.04] text-editorial-success',
  },
  alert: {
    solid: 'bg-editorial-alert/[0.08] text-editorial-alert',
    outline: 'border border-editorial-alert/30 bg-editorial-alert/[0.04] text-editorial-alert',
  },
  ink: {
    solid: 'bg-editorial-ink text-editorial-paper',
    outline: 'border border-editorial-ink/40 bg-editorial-paper text-editorial-ink',
  },
  muted: {
    solid: 'bg-editorial-neutral-2/60 text-editorial-neutral-3',
    outline: 'border border-editorial-neutral-2 bg-editorial-paper text-editorial-neutral-3/80',
  },
} as const;

/**
 * Status / type / category pill. Mono uppercase micro-type.
 * Unifies the inline ad-hoc badges that existed in status-badge, response-row
 * type column, bug status/priority labels, team role labels, etc.
 */
export function EditorialPill({
  children,
  tone = 'neutral',
  variant = 'outline',
  leading,
  className,
}: EditorialPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]',
        TONE_MAP[tone][variant],
        className
      )}
    >
      {leading}
      {children}
    </span>
  );
}
