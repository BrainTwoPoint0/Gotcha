import * as React from 'react';
import { cn } from '@/lib/utils';

export function EditorialCard({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-md border border-editorial-neutral-2 bg-editorial-paper', className)}
      {...rest}
    />
  );
}

export function EditorialCardHeader({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-b border-editorial-neutral-2 px-6 py-5', className)} {...rest} />
  );
}

export function EditorialCardBody({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-5', className)} {...rest} />;
}

export function EditorialCardFooter({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-t border-editorial-neutral-2 px-6 py-4', className)} {...rest} />
  );
}
