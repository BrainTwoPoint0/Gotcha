'use client';

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: { wrapper: 'h-4 w-4', dot: 'h-1 w-1' },
  md: { wrapper: 'h-8 w-8', dot: 'h-1.5 w-1.5' },
  lg: { wrapper: 'h-10 w-10', dot: 'h-2 w-2' },
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn(config.wrapper, 'relative', className)} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            config.dot,
            'absolute rounded-full bg-gray-400',
            'animate-[pulse_1.2s_ease-in-out_infinite]'
          )}
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translateX(${(i - 1) * (size === 'sm' ? 6 : size === 'md' ? 10 : 14)}px)`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-gray-300 animate-[pulse_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      {message && <p className="text-gray-400 text-sm">{message}</p>}
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="md" />
        {message && <p className="text-muted-foreground text-sm">{message}</p>}
      </div>
    </div>
  );
}
