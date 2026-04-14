import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EditorialFormFieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function EditorialFormField({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
}: EditorialFormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-ink"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[13px] text-editorial-alert">{error}</p>
      ) : hint ? (
        <p className="text-[13px] text-editorial-neutral-3">{hint}</p>
      ) : null}
    </div>
  );
}

export const EditorialInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function EditorialInput({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-editorial-neutral-2 bg-editorial-paper px-3 text-[14px] text-editorial-ink',
        'placeholder:text-editorial-neutral-3/70',
        'transition-colors duration-240 ease-page-turn',
        'focus:border-editorial-accent focus:outline-none focus:ring-2 focus:ring-editorial-accent/25',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...rest}
    />
  );
});

export const EditorialTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function EditorialTextarea({ className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[96px] w-full rounded-md border border-editorial-neutral-2 bg-editorial-paper px-3 py-2 text-[14px] text-editorial-ink',
        'placeholder:text-editorial-neutral-3/70',
        'transition-colors duration-240 ease-page-turn',
        'focus:border-editorial-accent focus:outline-none focus:ring-2 focus:ring-editorial-accent/25',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...rest}
    />
  );
});
