import * as React from 'react';
import { cn } from '@/lib/utils';

export function EditorialTable({ className, ...rest }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-[14px]', className)} {...rest} />
    </div>
  );
}

export function EditorialTHead({
  className,
  ...rest
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('border-b border-editorial-neutral-2 text-left', className)} {...rest} />
  );
}

export function EditorialTBody({
  className,
  ...rest
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn(className)} {...rest} />;
}

export function EditorialTR({ className, ...rest }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-editorial-neutral-2 transition-colors duration-240 ease-page-turn hover:bg-editorial-ink/[0.02]',
        className
      )}
      {...rest}
    />
  );
}

export function EditorialTH({ className, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3 font-mono text-[10px] font-normal uppercase tracking-[0.14em] text-editorial-neutral-3',
        className
      )}
      {...rest}
    />
  );
}

export function EditorialTD({ className, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-4 align-middle text-editorial-ink', className)} {...rest} />;
}
