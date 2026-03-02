'use client';

import Link from 'next/link';
import { Spotlight } from '@/app/components/ui/aceternity/spotlight';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-white to-gray-50 py-20 sm:py-32 overflow-hidden">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#475569" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            A direct line between <span className="text-slate-600">your users</span> and{' '}
            <span className="text-slate-600">your team</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Attach feedback to any component. Your users rate, vote, and respond — right where they
            experience your features. No surveys. No guessing.
          </p>
          <div className="inline-flex items-center gap-3 bg-gray-900 text-gray-100 px-5 py-3 rounded-lg font-mono text-sm mb-4">
            <span className="text-green-400">$</span>
            <code>npm install gotcha-feedback</code>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/signup">Add Feedback in 5 Minutes</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/demo">Try the Demo</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required. Free tier available.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            <a
              href="https://www.npmjs.com/package/gotcha-feedback"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-800 underline"
            >
              View on npm
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
