import Link from 'next/link';

const features = [
  {
    title: 'Contextual Conversations',
    description:
      'Let users speak up right where they experience your features. Feedback tied to context, not lost in a generic survey.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
        />
      </svg>
    ),
  },
  {
    title: '5 Minute Integration',
    description:
      "npm install, wrap your app, add one component. That's it. Start collecting feedback today.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: 'Multiple Modes',
    description:
      'Star ratings, thumbs up/down, polls, or detailed feedback. Choose what works for each feature.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    ),
  },
  {
    title: 'Lightweight',
    description: 'Only ~15KB minified. No impact on your bundle size or page load times.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
        />
      </svg>
    ),
  },
  {
    title: 'Analytics Dashboard',
    description:
      'See feedback trends, sentiment analysis, poll results, and element performance all in one place.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    title: 'Developer First',
    description: 'TypeScript support, React hooks, customizable themes, and full API access.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              A direct line between <span className="text-slate-600">your users</span> and{' '}
              <span className="text-slate-600">your team</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Gotcha adds a communication layer right inside your product. Your users tell you what
              they think — on every feature, in real time. No surveys. No guessing.
            </p>
            <div className="inline-flex items-center gap-3 bg-gray-900 text-gray-100 px-5 py-3 rounded-lg font-mono text-sm mb-8">
              <span className="text-green-400">$</span>
              <code>npm install gotcha-feedback</code>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-slate-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-800 transition"
              >
                Start for Free
              </Link>
              <Link
                href="/demo"
                className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg border border-gray-300 hover:bg-gray-50 transition"
              >
                Try the Demo
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required. Free tier available.
            </p>
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Integrate in 3 lines of code</h2>
            <p className="text-gray-400">Seriously, that&apos;s all it takes.</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{`import { GotchaProvider, Gotcha } from 'gotcha-feedback';

// Wrap your app once
<GotchaProvider apiKey="your-api-key">
  <App />
</GotchaProvider>

// Add feedback to any component
<FeatureCard>
  <Gotcha elementId="new-feature" />
</FeatureCard>`}</code>
            </pre>
          </div>
          <div className="text-center mt-6">
            <Link href="/demo" className="text-slate-400 hover:text-slate-300 font-medium">
              See it in action →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to hear your users
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A communication layer that lives inside your product, not outside it.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Build vs Buy */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Stop guessing what users want</h2>
            <p className="text-xl text-gray-600">
              Building your own feedback system costs more than you think.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-red-500">✗</span> Build It Yourself
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li>$3,000+ in engineering time</li>
                <li>1-3 weeks to build</li>
                <li>Ongoing maintenance burden</li>
                <li>No analytics dashboard</li>
                <li>Limited to your ideas</li>
              </ul>
            </div>
            <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-green-500">✓</span> Use Gotcha
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li>From $0/month</li>
                <li>5 minutes to integrate</li>
                <li>We handle maintenance</li>
                <li>Full analytics included</li>
                <li>Constantly improving</li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing" className="text-slate-600 hover:text-slate-700 font-medium">
              See pricing details →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Your users have something to say
          </h2>
          <p className="text-xl text-slate-200 mb-8">
            Open the conversation. Ship what your users actually want.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-slate-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-50 transition"
            >
              Get Started for Free
            </Link>
            <Link
              href="/demo"
              className="bg-slate-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-500 transition"
            >
              Try the Demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
