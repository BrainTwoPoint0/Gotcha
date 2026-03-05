'use client';

import { Spotlight } from '@/app/components/ui/aceternity/spotlight';

export function PricingHero() {
  return (
    <div className="relative bg-gradient-to-b from-white to-gray-50 py-20 sm:py-28 overflow-hidden">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#475569" />
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-gray-600 mb-2">Add feedback to any component in 5 minutes.</p>
        <p className="text-lg text-gray-500">
          No credit card required. Start free, upgrade when you need.
        </p>
      </div>
    </div>
  );
}
