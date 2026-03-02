'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type OldVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ShadcnVariant = 'default' | 'secondary' | 'destructive' | 'ghost' | 'outline' | 'link';
type OldSize = 'sm' | 'md' | 'lg';
type ShadcnSize = 'sm' | 'default' | 'lg' | 'icon';

const variantMap: Record<OldVariant, ShadcnVariant> = {
  primary: 'default',
  secondary: 'outline',
  danger: 'destructive',
  ghost: 'ghost',
};

const sizeMap: Record<OldSize, ShadcnSize> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: OldVariant;
  size?: OldSize;
  loading?: boolean;
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <ShadcnButton
        ref={ref}
        variant={variantMap[variant]}
        size={sizeMap[size]}
        disabled={disabled || loading}
        className={cn(className)}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading && loadingText ? loadingText : children}
      </ShadcnButton>
    );
  }
);

Button.displayName = 'Button';
