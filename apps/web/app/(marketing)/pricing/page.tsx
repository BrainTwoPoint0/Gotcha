import Link from 'next/link';
import { PricingToggle } from './pricing-toggle';
import { CtaSection } from '../cta-section';
import { PricingHero } from './pricing-hero';
import { SpotlightCard } from '@/app/components/ui/aceternity/spotlight';

const programs = [
  {
    name: 'Education',
    icon: '🎓',
    description: 'Students & universities',
    benefits: [
      'Validate thesis projects with real user feedback',
      'Run usability studies on class assignments',
      'Collect NPS from beta testers before demo day',
    ],
  },
  {
    name: 'Startups',
    icon: '🚀',
    description: 'Early-stage teams',
    benefits: [
      'Measure product-market fit with NPS scores',
      'Prioritize your roadmap with actual user votes',
      'Export feedback data to share with investors',
    ],
  },
  {
    name: 'Product Teams',
    icon: '🏢',
    description: 'Growing organizations',
    benefits: [
      'Track satisfaction across features as a team',
      'Route bug reports and feedback to Slack',
      'Segment feedback by user type for insights',
    ],
  },
];

const buildVsBuy = {
  build: {
    title: 'Build It Yourself',
    items: [
      { label: 'Engineering time (20-40 hours)', cost: '$3,000+' },
      { label: 'Database & infrastructure', cost: '$20/mo' },
      { label: 'Ongoing maintenance', cost: '$100/mo' },
    ],
    total: '$3,000+ upfront + $120/mo',
    time: '1-3 weeks to build',
  },
  buy: {
    title: 'Use Gotcha',
    items: [
      { label: 'npm install gotcha-feedback', cost: '2 min' },
      { label: 'Add <Gotcha /> component', cost: '1 min' },
      { label: 'Start collecting feedback', cost: 'Instant' },
    ],
    total: 'From $0/mo',
    time: '5 minutes to integrate',
  },
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <PricingHero />

      {/* Pricing Tiers */}
      <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-8 py-20">
        <PricingToggle />

        {/* Need more? */}
        <div className="mt-8 bg-slate-100 rounded-2xl p-6 text-center">
          <p className="text-gray-600">
            Need SSO, SLA, or custom integrations?{' '}
            <a
              href="mailto:info@braintwopoint0.com"
              className="text-slate-700 font-medium hover:underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>

      {/* Special Programs */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Who uses Gotcha?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From solo founders to product teams — here&apos;s how people use Gotcha.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {programs.map((program) => (
              <SpotlightCard
                key={program.name}
                className="p-6"
                spotlightColor="rgba(148, 163, 184, 0.1)"
              >
                <div className="text-4xl mb-4">{program.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900">{program.name}</h3>
                <p className="text-gray-500 text-sm mt-2">{program.description}</p>
                <ul className="space-y-2 mt-4 mb-6">
                  {program.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm">
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
                      <span className="text-gray-600">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block text-center py-2 px-4 rounded-lg font-medium bg-gray-100 text-gray-900 hover:bg-gray-200 transition"
                >
                  Get Started
                </Link>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </div>

      {/* Build vs Buy */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Build vs Buy</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Why spend weeks building when you can integrate in minutes?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Build */}
            <div className="bg-white rounded-2xl p-6 border border-red-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{buildVsBuy.build.title}</h3>
              </div>
              <ul className="space-y-3 mb-6">
                {buildVsBuy.build.items.map((item) => (
                  <li key={item.label} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium text-red-600">{item.cost}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-gray-900">Total Cost</span>
                  <span className="font-bold text-red-600">{buildVsBuy.build.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time to launch</span>
                  <span className="text-gray-900">{buildVsBuy.build.time}</span>
                </div>
              </div>
            </div>

            {/* Buy */}
            <div className="bg-white rounded-2xl p-6 border-2 border-green-500 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
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
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{buildVsBuy.buy.title}</h3>
              </div>
              <ul className="space-y-3 mb-6">
                {buildVsBuy.buy.items.map((item) => (
                  <li key={item.label} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium text-green-600">{item.cost}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-gray-900">Total Cost</span>
                  <span className="font-bold text-green-600">{buildVsBuy.buy.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time to launch</span>
                  <span className="text-gray-900">{buildVsBuy.buy.time}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Code Example */}
          <div className="mt-12 bg-gray-800 rounded-2xl p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-gray-400 text-sm">It&apos;s this simple</span>
            </div>
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{`npm install gotcha-feedback

import { GotchaProvider, Gotcha } from 'gotcha-feedback';

function App() {
  return (
    <GotchaProvider apiKey="your-api-key">
      <FeatureCard>
        <Gotcha elementId="feature-card" />
      </FeatureCard>
    </GotchaProvider>
  );
}`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What counts as a response?</h3>
              <p className="text-gray-600">
                A response is any feedback submission from your users — whether it&apos;s a star
                rating, thumbs up/down vote, poll selection, NPS score, bug report, or written
                feedback. Each unique submission counts as one response.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I upgrade or downgrade anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade from Free to Pro at any time and it takes effect immediately.
                If you want to downgrade, changes apply at the start of your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens if I exceed my free tier limit?
              </h3>
              <p className="text-gray-600">
                We&apos;ll notify you when you reach 80% of your 500 responses. If you exceed it,
                responses are still collected but you&apos;ll need to upgrade to Pro to access new
                data. Pro has unlimited responses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                How do the special programs work?
              </h3>
              <p className="text-gray-600">
                We offer special pricing for students, universities, accelerators, and investors.
                Contact us to discuss partnership opportunities and custom pricing for your
                organization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <CtaSection />
    </main>
  );
}
