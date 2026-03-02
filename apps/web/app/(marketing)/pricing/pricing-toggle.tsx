'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SpotlightCard } from '@/app/components/ui/aceternity/spotlight';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const tiers = {
  monthly: [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out Gotcha',
      responses: '500',
      features: ['500 responses/month', '1 project', 'Basic analytics', '30-day analytics view'],
      cta: 'Get Started',
      href: '/signup',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      description: 'For individuals & teams',
      responses: 'Unlimited',
      features: [
        'Unlimited responses',
        'Unlimited projects',
        'Full analytics dashboard',
        'Poll results & element performance',
        'User segmentation',
        'Unlimited data retention',
        'Export to CSV',
      ],
      cta: 'Get Started',
      href: '/signup?plan=pro',
      highlighted: true,
    },
  ],
  annual: [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out Gotcha',
      responses: '500',
      features: ['500 responses/month', '1 project', 'Basic analytics', '30-day analytics view'],
      cta: 'Get Started',
      href: '/signup',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$24',
      period: '/month',
      description: 'Billed annually ($288/yr)',
      responses: 'Unlimited',
      features: [
        'Unlimited responses',
        'Unlimited projects',
        'Full analytics dashboard',
        'Poll results & element performance',
        'User segmentation',
        'Unlimited data retention',
        'Export to CSV',
      ],
      cta: 'Get Started',
      href: '/signup?plan=pro&billing=annual',
      highlighted: true,
    },
  ],
};

export function PricingToggle() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const currentTiers = tiers[billing];

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-12">
        <span
          className={`text-sm font-medium ${billing === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}
        >
          Monthly
        </span>
        <button
          onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            billing === 'annual' ? 'bg-slate-700' : 'bg-gray-300'
          }`}
          aria-label="Toggle annual billing"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              billing === 'annual' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium ${billing === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}
        >
          Annual
        </span>
        <Badge
          variant="secondary"
          className={`transition-opacity ${
            billing === 'annual'
              ? 'bg-green-100 text-green-700 opacity-100'
              : 'bg-green-100 text-green-700 opacity-0'
          }`}
        >
          Save 17%
        </Badge>
      </div>

      {/* Tier Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {currentTiers.map((tier) => (
          <SpotlightCard
            key={tier.name}
            className={`p-8 ${
              tier.highlighted ? 'ring-2 ring-slate-600 shadow-xl scale-105' : 'shadow-sm'
            }`}
            spotlightColor={
              tier.highlighted ? 'rgba(71, 85, 105, 0.15)' : 'rgba(148, 163, 184, 0.1)'
            }
          >
            {tier.highlighted && (
              <div className="text-center mb-4">
                <Badge className="bg-slate-700 text-white hover:bg-slate-700">Recommended</Badge>
              </div>
            )}
            <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
            <p className="text-gray-500 text-sm mt-1">{tier.description}</p>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
              <span className="text-gray-500 ml-1">{tier.period}</span>
            </div>
            <div className="mb-6">
              <div className="text-2xl font-semibold text-slate-600">{tier.responses}</div>
              <div className="text-sm text-gray-500">responses/month</div>
            </div>
            <ul className="space-y-3 mb-6">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant={tier.highlighted ? 'default' : 'secondary'} className="w-full" asChild>
              <Link href={tier.href}>{tier.cta}</Link>
            </Button>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}
