import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EditorialDotProps {
  tone?: 'accent' | 'ink' | 'neutral' | 'success' | 'alert' | 'current';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const TONE_MAP = {
  accent: 'bg-editorial-accent',
  ink: 'bg-editorial-ink',
  neutral: 'bg-editorial-neutral-3',
  success: 'bg-editorial-success',
  alert: 'bg-editorial-alert',
  current: 'bg-current',
} as const;

const SIZE_MAP = {
  xs: 'h-1 w-1',
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
} as const;

/** Small round indicator — used as eyebrow punctuation, status prefix, and list bullet. */
export function EditorialDot({ tone = 'accent', size = 'sm', className }: EditorialDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block shrink-0 rounded-full',
        TONE_MAP[tone],
        SIZE_MAP[size],
        className
      )}
    />
  );
}
