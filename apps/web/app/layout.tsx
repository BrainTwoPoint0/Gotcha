import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://gotcha.cx'),
  title: 'Gotcha - Lightweight Feedback SDK for React',
  description:
    'A developer-first contextual feedback SDK for React. Add a feedback button to any component with a single line of code.',
  openGraph: {
    title: 'Gotcha - Lightweight Feedback SDK for React',
    description:
      'A developer-first contextual feedback SDK for React. Add a feedback button to any component with a single line of code.',
    url: 'https://gotcha.cx',
    siteName: 'Gotcha',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gotcha - Lightweight Feedback SDK for React',
    description:
      'A developer-first contextual feedback SDK for React. Add a feedback button to any component with a single line of code.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
