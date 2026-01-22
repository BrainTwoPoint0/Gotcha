'use client';

import { GotchaProvider } from 'gotcha-feedback';

export function Providers({ children }: { children: React.ReactNode }) {
  // Use internal endpoint - API key is handled server-side, not exposed to browser
  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/v1/internal`
      : '/api/v1/internal';

  return (
    <GotchaProvider
      apiKey="internal"
      baseUrl={baseUrl}
      debug={process.env.NODE_ENV === 'development'}
    >
      {children}
    </GotchaProvider>
  );
}
