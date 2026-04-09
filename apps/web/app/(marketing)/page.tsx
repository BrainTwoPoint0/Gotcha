import Link from 'next/link';
import { HomepageDemo } from '../components/HomepageDemo';
import { HeroSection } from './hero-section';
import { FeaturesSection } from './features-section';
import { CtaSection } from './cta-section';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <HeroSection />

      {/* Code Example */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Integrate in minutes</h2>
            <p className="text-gray-400">One provider, one component. Advanced features are one prop away.</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] shadow-[0_4px_12px_rgba(0,0,0,0.3)] rounded-2xl p-6 overflow-hidden">
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

// Ratings, votes, NPS, polls, bug reports, smart triggers
<Gotcha elementId="new-feature" />
<Gotcha elementId="checkout" mode="nps" />
<Gotcha elementId="search" mode="vote" />
<Gotcha elementId="pricing" showAfterScrollPercent={75} />
<Gotcha elementId="app" enableBugFlag enableScreenshot />`}</code>
            </pre>
          </div>
          <div className="text-center mt-6">
            <Link href="/demo" className="text-slate-400 hover:text-slate-300 font-medium">
              Try the full playground →
            </Link>
          </div>
        </div>
      </section>

      {/* Live Demo */}
      <HomepageDemo />

      {/* Features */}
      <FeaturesSection />

      {/* Build vs Buy */}
      <section className="py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Stop guessing what users want</h2>
            <p className="text-xl text-gray-600">
              Building your own feedback system costs more than you think.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50/60 border border-red-200/60 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-red-400">✗</span> Build It Yourself
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-300 mt-0.5">—</span>$3,000+ in engineering time
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-300 mt-0.5">—</span>1–3 weeks to build
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-300 mt-0.5">—</span>Ongoing maintenance burden
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-300 mt-0.5">—</span>No analytics dashboard
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-300 mt-0.5">—</span>Limited to your ideas
                </li>
              </ul>
            </div>
            <div className="bg-emerald-50/60 border-2 border-emerald-400/40 shadow-lg rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Use Gotcha
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>From $0/month
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>5 minutes to integrate
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>NPS, bug tracking, and 4
                  feedback modes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>Webhooks to Slack, Discord &
                  more
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>Team workspaces, export, and
                  analytics
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>Auto-captures browser context,
                  screenshots & JS errors
                </li>
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
      <CtaSection />
    </main>
  );
}
