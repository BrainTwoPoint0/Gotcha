import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EditorialAlertProps {
  children: React.ReactNode;
  tone?: 'accent' | 'success' | 'alert' | 'neutral';
  className?: string;
  /** Defaults to `role="alert"` for the `alert` tone, `role="status"` otherwise. */
  role?: 'alert' | 'status' | 'note';
  'aria-live'?: 'polite' | 'assertive' | 'off';
}

const TONE_MAP = {
  accent: 'border-editorial-accent bg-editorial-accent/[0.04] text-editorial-ink',
  success: 'border-editorial-success bg-editorial-success/[0.04] text-editorial-ink',
  alert: 'border-editorial-alert bg-editorial-alert/[0.04] text-editorial-alert',
  neutral: 'border-editorial-neutral-3 bg-editorial-ink/[0.02] text-editorial-ink',
} as const;

/** Hairline-left-border notice strip. Use for CSRF-style banners, free-tier
 *  warnings, "copy this key now" advisories, PATCH failure messages. */
export function EditorialAlert({
  children,
  tone = 'accent',
  className,
  role,
  'aria-live': ariaLive,
}: EditorialAlertProps) {
  const resolvedRole = role ?? (tone === 'alert' ? 'alert' : 'status');
  return (
    <div
      role={resolvedRole}
      aria-live={ariaLive ?? (resolvedRole === 'alert' ? undefined : 'polite')}
      className={cn('border-l-2 px-4 py-3 text-[13px]', TONE_MAP[tone], className)}
    >
      {children}
    </div>
  );
}
