import Link from 'next/link';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out Gotcha',
    responses: '500',
    features: [
      '500 responses/month',
      '1 project',
      'Basic analytics',
      '30-day data retention',
    ],
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
      'Unlimited data retention',
      'Export to CSV',
    ],
    cta: 'Get Started',
    href: '/signup?plan=pro',
    highlighted: true,
  },
];

const programs = [
  {
    name: 'Gotcha for Education',
    icon: '🎓',
    description: 'For students & universities',
    benefits: [
      'Special pricing for .edu emails',
      'Perfect for capstone projects & theses',
      'Learn real user feedback practices',
      'Admin dashboard for universities',
    ],
  },
  {
    name: 'Gotcha for Startups',
    icon: '🚀',
    description: 'For accelerators & incubators',
    benefits: [
      'Discounted pricing for portfolio companies',
      'Cohort dashboard for accelerators',
      'Investor-ready feedback reports',
      'Priority onboarding support',
    ],
  },
  {
    name: 'Gotcha for Investors',
    icon: '📊',
    description: 'Portfolio-wide visibility',
    benefits: [
      'Dashboard across all portfolio companies',
      'Aggregated sentiment & feedback trends',
      'Early warning signals for product issues',
      'Recommend Gotcha to portfolio companies',
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
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Add feedback to any component in 5 minutes.
          </p>
          <p className="text-lg text-gray-500">
            No credit card required. Start free, upgrade when you need.
          </p>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`bg-white rounded-2xl p-8 ${
                tier.highlighted
                  ? 'ring-2 ring-slate-600 shadow-xl scale-105'
                  : 'border border-gray-200 shadow-sm'
              }`}
            >
              {tier.highlighted && (
                <div className="text-center mb-4">
                  <span className="bg-slate-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
              <p className="text-gray-500 text-sm mt-1">{tier.description}</p>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                <span className="text-gray-500 ml-1">{tier.period}</span>
              </div>
              <div className="mb-6">
                <div className="text-2xl font-semibold text-slate-600">
                  {tier.responses}
                </div>
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
              <Link
                href={tier.href}
                className={`block text-center py-2 px-4 rounded-lg font-medium transition ${
                  tier.highlighted
                    ? 'bg-slate-700 text-white hover:bg-slate-800'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Need more? */}
        <div className="mt-8 bg-slate-100 rounded-2xl p-6 text-center">
          <p className="text-gray-600">
            Need SSO, SLA, or custom integrations?{' '}
            <a href="mailto:info@braintwopoint0.com" className="text-slate-700 font-medium hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>

      {/* Special Programs */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Special Programs</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Special pricing for students, startups, and investors.
              Program managers get visibility into their entire cohort.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {programs.map((program) => (
              <div
                key={program.name}
                className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition"
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
                <a
                  href="mailto:info@braintwopoint0.com"
                  className="block text-center py-2 px-4 rounded-lg font-medium bg-gray-100 text-gray-900 hover:bg-gray-200 transition"
                >
                  Contact Us
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Build vs Buy */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Build vs Buy</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Why spend weeks building when you can integrate in minutes?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Build */}
            <div className="bg-white rounded-2xl p-6 border border-red-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
          <div className="mt-12 bg-gray-900 rounded-2xl p-6 overflow-hidden">
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
      <div className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What counts as a response?
              </h3>
              <p className="text-gray-600">
                A response is any feedback submission from your users - whether it&apos;s a star rating,
                thumbs up/down vote, or written feedback. Each unique submission counts as one response.
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
                responses are still collected but you&apos;ll need to upgrade to Pro to access new data.
                Pro has unlimited responses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                How do the special programs work?
              </h3>
              <p className="text-gray-600">
                We offer special pricing for students, universities, accelerators, and investors.
                Contact us to discuss partnership opportunities and custom pricing for your organization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-slate-700 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to start collecting feedback?
          </h2>
          <p className="text-slate-200 mb-8">
            Join hundreds of developers who ship better products with Gotcha.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-slate-600 px-8 py-3 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              Start for Free
            </Link>
            <a
              href="mailto:info@braintwopoint0.com"
              className="bg-slate-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-500 transition"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>

    </main>
  );
}
