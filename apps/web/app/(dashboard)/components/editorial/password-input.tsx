'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { EditorialInput } from './form-field';

export type EditorialPasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const EditorialPasswordInput = React.forwardRef<
  HTMLInputElement,
  EditorialPasswordInputProps
>(function EditorialPasswordInput({ className, ...rest }, ref) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <EditorialInput
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn('pr-16', className)}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex items-center gap-1 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
});
