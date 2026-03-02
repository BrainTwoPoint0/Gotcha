'use client';

import Link from 'next/link';
import { BackgroundBeams } from '@/app/components/ui/aceternity/background-beams';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section className="relative py-20 bg-slate-700 overflow-hidden">
      <BackgroundBeams />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Your users have something to say
        </h2>
        <p className="text-xl text-slate-200 mb-8">
          Open the conversation. Ship what your users actually want.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-white text-slate-700 hover:bg-slate-50"
            asChild
          >
            <Link href="/signup">Get Started for Free</Link>
          </Button>
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-slate-600 text-white border border-slate-500 hover:bg-slate-500"
            asChild
          >
            <Link href="/demo">Try the Demo</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
