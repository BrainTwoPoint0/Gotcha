import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'accent' | 'ink' | 'ghost' | 'link';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-240 ease-page-turn ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-editorial-paper ' +
  'disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  accent:
    'rounded-md bg-editorial-accent text-editorial-paper hover:bg-editorial-accent/90 active:bg-editorial-accent',
  ink: 'rounded-md bg-editorial-ink text-editorial-paper hover:bg-editorial-ink/90 active:bg-editorial-ink',
  ghost:
    'rounded-md border border-editorial-neutral-2 bg-transparent text-editorial-ink hover:bg-editorial-ink/[0.03] active:bg-editorial-ink/[0.05]',
  link: 'text-editorial-ink underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 hover:decoration-editorial-accent',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-[14px]',
  lg: 'h-12 px-6 text-[15px]',
};

export interface EditorialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const EditorialButton = React.forwardRef<HTMLButtonElement, EditorialButtonProps>(
  function EditorialButton({ variant = 'ink', size = 'md', className, ...rest }, ref) {
    return (
      <button
        ref={ref}
        className={cn(base, variant !== 'link' && sizes[size], variants[variant], className)}
        {...rest}
      />
    );
  }
);

export interface EditorialLinkButtonProps extends React.ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function EditorialLinkButton({
  variant = 'ink',
  size = 'md',
  className,
  ...rest
}: EditorialLinkButtonProps) {
  return (
    <Link
      className={cn(base, variant !== 'link' && sizes[size], variants[variant], className)}
      {...rest}
    />
  );
}
