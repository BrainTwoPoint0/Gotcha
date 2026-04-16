import type { Metadata } from 'next';
import { DM_Sans, Carter_One, Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { NavProgress } from './components/NavProgress';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const carterOne = Carter_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-carter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz', 'SOFT'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

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
      <body
        className={`${dmSans.variable} ${carterOne.variable} ${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      >
        <NavProgress />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
