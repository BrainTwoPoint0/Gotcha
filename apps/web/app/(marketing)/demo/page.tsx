'use client';

import { Gotcha } from 'gotcha-feedback';
import Link from 'next/link';

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-gray-50 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.08),transparent)]">
      <div className="px-6 py-12 md:p-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">SDK Playground</h1>
            <p className="text-gray-600">
              Try all the Gotcha SDK variants. Click on any G button to see it in action.
            </p>
          </div>

          {/* Modes */}
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl font-semibold mb-4">Modes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-200/60 hover:shadow-md transition-all">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Feedback Mode
                  <Gotcha
                    elementId="mode-test-feedback"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="What do you think?"
                  />
                </h3>
                <p className="text-gray-500 text-sm">Star rating + text input</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-200/60 hover:shadow-md transition-all">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Vote Mode
                  <Gotcha
                    elementId="mode-test-vote"
                    mode="vote"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="Do you like this?"
                  />
                </h3>
                <p className="text-gray-500 text-sm">Thumbs up / down</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-200/60 hover:shadow-md transition-all">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Poll Mode
                  <Gotcha
                    elementId="mode-test-poll"
                    mode="poll"
                    options={['Yes', 'No']}
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="Should we ship this feature?"
                  />
                </h3>
                <p className="text-gray-500 text-sm">Custom options (e.g. Yes / No)</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-200/60 hover:shadow-md transition-all">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Poll Mode (Multi)
                  <Gotcha
                    elementId="mode-test-poll-multi"
                    mode="poll"
                    options={['Analytics', 'Segments', 'Exports', 'API']}
                    allowMultiple
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="Which features matter most?"
                  />
                </h3>
                <p className="text-gray-500 text-sm">Multiple selections allowed</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-200/60 hover:shadow-md transition-all">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  NPS Mode
                  <Gotcha
                    elementId="mode-test-nps"
                    mode="nps"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="How likely are you to recommend us?"
                  />
                </h3>
                <p className="text-gray-500 text-sm">0-10 Net Promoter Score</p>
              </div>
            </div>
          </section>

          {/* Sizes */}
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl font-semibold mb-4">Sizes</h2>
            <div className="bg-white/70 backdrop-blur-sm p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200/60">
              <div className="flex flex-wrap items-center gap-6 md:gap-4 md:gap-8">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">sm (24px)</span>
                  <Gotcha
                    elementId="size-sm"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">md (32px)</span>
                  <Gotcha
                    elementId="size-md"
                    mode="feedback"
                    size="md"
                    position="inline"
                    showOnHover={false}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">lg (40px)</span>
                  <Gotcha
                    elementId="size-lg"
                    mode="feedback"
                    size="lg"
                    position="inline"
                    showOnHover={false}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Themes */}
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl font-semibold mb-4">Themes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-gradient-to-br from-sky-100 via-indigo-100 to-purple-100 p-6 rounded-2xl shadow-sm border border-white/60">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Light
                  <Gotcha
                    elementId="theme-light"
                    mode="feedback"
                    size="sm"
                    theme="light"
                    position="inline"
                    showOnHover={false}
                  />
                </h3>
              </div>
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-slate-900 p-6 rounded-2xl shadow-sm border border-gray-700">
                <h3 className="font-medium mb-2 text-white flex items-center gap-2">
                  Dark
                  <Gotcha
                    elementId="theme-dark"
                    mode="feedback"
                    size="sm"
                    theme="dark"
                    position="inline"
                    showOnHover={false}
                  />
                </h3>
              </div>
              <div className="bg-gradient-to-br from-amber-100 via-rose-100 to-violet-100 p-6 rounded-2xl shadow-sm border border-white/60">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Auto
                  <Gotcha
                    elementId="theme-auto"
                    mode="feedback"
                    size="sm"
                    theme="auto"
                    position="inline"
                    showOnHover={false}
                  />
                </h3>
              </div>
            </div>
          </section>

          {/* Positions */}
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl font-semibold mb-4">Positions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {/* Inline */}
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-200/60">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Inline
                  <Gotcha
                    elementId="pos-inline"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                  />
                </h3>
                <p className="text-gray-500 text-sm">Flows with text</p>
              </div>

              {/* Corner positions */}
              <div className="relative bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-200/60 h-32">
                <span className="text-sm text-gray-600">top-left</span>
                <Gotcha
                  elementId="pos-top-left"
                  mode="feedback"
                  size="sm"
                  position="top-left"
                  showOnHover={false}
                />
              </div>
              <div className="relative bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-200/60 h-32">
                <span className="text-sm text-gray-600">top-right</span>
                <Gotcha
                  elementId="pos-top-right"
                  mode="feedback"
                  size="sm"
                  position="top-right"
                  showOnHover={false}
                />
              </div>
              <div className="relative bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-200/60 h-32">
                <span className="text-sm text-gray-600">bottom-left</span>
                <Gotcha
                  elementId="pos-bottom-left"
                  mode="feedback"
                  size="sm"
                  position="bottom-left"
                  showOnHover={false}
                />
              </div>
              <div className="relative bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-200/60 h-32">
                <span className="text-sm text-gray-600">bottom-right</span>
                <Gotcha
                  elementId="pos-bottom-right"
                  mode="feedback"
                  size="sm"
                  position="bottom-right"
                  showOnHover={false}
                />
              </div>
            </div>
          </section>

          {/* Show on Hover */}
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl font-semibold mb-4">Show on Hover</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="relative bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-200/60 h-32">
                <span className="text-sm text-gray-600">showOnHover=false (always visible)</span>
                <Gotcha
                  elementId="hover-false"
                  mode="feedback"
                  size="sm"
                  position="top-right"
                  showOnHover={false}
                />
              </div>
              <div className="relative bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-200/60 h-32">
                <span className="text-sm text-gray-600">showOnHover=true (hover to reveal)</span>
                <Gotcha
                  elementId="hover-true"
                  mode="feedback"
                  size="sm"
                  position="top-right"
                  showOnHover={true}
                />
              </div>
            </div>
          </section>

          {/* Real World Examples */}
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl font-semibold mb-4">Real World Examples</h2>
            <div className="space-y-4">
              {/* Feature card */}
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-200/60 hover:shadow-md transition-all">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  New Analytics Dashboard
                  <Gotcha
                    elementId="example-analytics"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="How useful is the new analytics dashboard?"
                  />
                </h3>
                <p className="text-gray-600 text-sm">
                  Track user engagement, conversion rates, and more with our new dashboard.
                </p>
              </div>

              {/* Pricing option */}
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-6 rounded-2xl shadow-sm text-white">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  Pro Plan - $29/mo
                  <Gotcha
                    elementId="example-pricing"
                    mode="vote"
                    size="sm"
                    theme="dark"
                    position="inline"
                    showOnHover={false}
                    promptText="Is this pricing fair?"
                  />
                </h3>
                <p className="text-slate-200 text-sm">
                  Unlimited projects, priority support, advanced analytics
                </p>
              </div>

              {/* NPS example */}
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-200/60 hover:shadow-md transition-all">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  NPS Survey
                  <Gotcha
                    elementId="example-nps"
                    mode="nps"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="How likely are you to recommend this product?"
                  />
                </h3>
                <p className="text-gray-600 text-sm">
                  Track Net Promoter Score at any touchpoint in your app.
                </p>
              </div>

              {/* Settings item */}
              <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-gray-200/60 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Dark Mode</h3>
                  <p className="text-gray-500 text-sm">Enable dark theme across the app</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-6 bg-slate-500 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <Gotcha
                    elementId="example-setting"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="How do you like dark mode?"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* New Features */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-1">New Features</h2>
            <p className="text-gray-500 text-sm mb-4">Added in the latest release</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Follow-up Questions
                  <Gotcha
                    elementId="demo-follow-up"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="Rate this feature"
                    followUp={{
                      ratingThreshold: 2,
                      promptText: "What could we improve?",
                      placeholder: "Tell us more...",
                    }}
                  />
                </h3>
                <p className="text-gray-500 text-sm">Give 1-2 stars to see the follow-up prompt</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Bug Report + Screenshot
                  <Gotcha
                    elementId="demo-bug-screenshot"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="Report a bug"
                    enableBugFlag
                    enableScreenshot
                  />
                </h3>
                <p className="text-gray-500 text-sm">Toggle the bug flag to see screenshot capture</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Delayed Trigger
                  <Gotcha
                    elementId="demo-delayed"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="Delayed feedback"
                    showAfterSeconds={3}
                  />
                </h3>
                <p className="text-gray-500 text-sm">Widget appears after 3 seconds</p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-2">Ready to add feedback to your app?</h2>
            <p className="text-slate-200 mb-6">Get started in less than 5 minutes.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-white text-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100"
              >
                Start for Free
              </Link>
              <Link
                href="/pricing"
                className="bg-slate-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-400"
              >
                View Pricing
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
