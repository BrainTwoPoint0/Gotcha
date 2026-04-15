import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EditorialSectionTitleProps {
  children: React.ReactNode;
  /** Visual size. `md` matches inside-card section titles (1.25rem); `lg` matches larger empty-state and preview headings. */
  size?: 'md' | 'lg';
  as?: 'h2' | 'h3' | 'h4';
  className?: string;
}

const SIZE_MAP = {
  md: 'text-[1.25rem] leading-[1.15]',
  lg: 'text-[1.5rem] leading-[1.2]',
} as const;

export function EditorialSectionTitle({
  children,
  size = 'md',
  as = 'h2',
  className,
}: EditorialSectionTitleProps) {
  const Tag = as;
  return (
    <Tag
      className={cn(
        'font-display font-normal tracking-[-0.01em] text-editorial-ink',
        SIZE_MAP[size],
        className
      )}
    >
      {children}
    </Tag>
  );
}
