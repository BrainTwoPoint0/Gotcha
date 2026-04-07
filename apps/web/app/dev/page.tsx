'use client';

import { Gotcha, GotchaScore } from '../../../../packages/sdk/dist/index.mjs';

export default function DevPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* LOCAL DEV banner */}
      <div className="bg-yellow-400 text-yellow-900 text-center py-2 text-sm font-semibold tracking-wide">
        LOCAL DEV — Importing from packages/sdk/src
      </div>

      <div className="px-6 py-8 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">SDK Playground (Local)</h1>
            <p className="text-gray-600">
              Try all the Gotcha SDK variants. Click on any G button to see it in action.
            </p>
          </div>

          {/* Modes */}
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl font-semibold mb-4">Modes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4">
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Feedback Mode
                  <Gotcha
                    elementId="dev-mode-feedback"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="What do you think?"
                    enableBugFlag
                  />
                </h3>
                <p className="text-gray-500 text-sm">Star rating + text input</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Vote Mode
                  <Gotcha
                    elementId="dev-mode-vote"
                    mode="vote"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="Do you like this?"
                  />
                </h3>
                <p className="text-gray-500 text-sm">Thumbs up / down</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Poll Mode
                  <Gotcha
                    elementId="dev-mode-poll"
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
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  NPS Mode
                  <Gotcha
                    elementId="dev-mode-nps"
                    mode="nps"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                  />
                </h3>
                <p className="text-gray-500 text-sm">0-10 Net Promoter Score + follow-up</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Poll Mode (Multi)
                  <Gotcha
                    elementId="dev-mode-poll-multi"
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
            </div>
          </section>

          {/* Feedback Field Options */}
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl font-semibold mb-4">Feedback Field Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Text Only
                  <Gotcha
                    elementId="dev-fields-text-only"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    showRating={false}
                    promptText="Share your thoughts"
                  />
                </h3>
                <p className="text-gray-500 text-sm">showRating=false</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Rating Only
                  <Gotcha
                    elementId="dev-fields-rating-only"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    showText={false}
                    promptText="Rate this feature"
                  />
                </h3>
                <p className="text-gray-500 text-sm">showText=false</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Both (default)
                  <Gotcha
                    elementId="dev-fields-both"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="Full feedback"
                  />
                </h3>
                <p className="text-gray-500 text-sm">showText + showRating (default)</p>
              </div>
            </div>
          </section>

          {/* Sizes */}
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl font-semibold mb-4">Sizes</h2>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border">
              <div className="flex flex-wrap items-center gap-6 md:gap-8">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">sm (24px)</span>
                  <Gotcha
                    elementId="dev-size-sm"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">md (32px)</span>
                  <Gotcha
                    elementId="dev-size-md"
                    mode="feedback"
                    size="md"
                    position="inline"
                    showOnHover={false}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">lg (40px)</span>
                  <Gotcha
                    elementId="dev-size-lg"
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-4">
              <div className="bg-gradient-to-br from-sky-100 via-indigo-100 to-purple-100 p-6 rounded-lg shadow-md border border-white/60">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Light
                  <Gotcha
                    elementId="dev-theme-light"
                    mode="feedback"
                    size="sm"
                    theme="light"
                    position="inline"
                    showOnHover={false}
                  />
                </h3>
              </div>
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-slate-900 p-6 rounded-lg shadow-md border border-gray-700">
                <h3 className="font-medium mb-2 text-white flex items-center gap-2">
                  Dark
                  <Gotcha
                    elementId="dev-theme-dark"
                    mode="feedback"
                    size="sm"
                    theme="dark"
                    position="inline"
                    showOnHover={false}
                  />
                </h3>
              </div>
              <div className="bg-gradient-to-br from-amber-100 via-rose-100 to-violet-100 p-6 rounded-lg shadow-md border border-white/60">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Auto
                  <Gotcha
                    elementId="dev-theme-auto"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-4">
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Inline
                  <Gotcha
                    elementId="dev-pos-inline"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                  />
                </h3>
                <p className="text-gray-500 text-sm">Flows with text</p>
              </div>
              <div className="relative bg-white p-6 rounded-lg shadow-md border h-32">
                <span className="text-sm text-gray-600">top-left</span>
                <Gotcha
                  elementId="dev-pos-top-left"
                  mode="feedback"
                  size="sm"
                  position="top-left"
                  showOnHover={false}
                />
              </div>
              <div className="relative bg-white p-6 rounded-lg shadow-md border h-32">
                <span className="text-sm text-gray-600">top-right</span>
                <Gotcha
                  elementId="dev-pos-top-right"
                  mode="feedback"
                  size="sm"
                  position="top-right"
                  showOnHover={false}
                />
              </div>
              <div className="relative bg-white p-6 rounded-lg shadow-md border h-32">
                <span className="text-sm text-gray-600">bottom-left</span>
                <Gotcha
                  elementId="dev-pos-bottom-left"
                  mode="feedback"
                  size="sm"
                  position="bottom-left"
                  showOnHover={false}
                />
              </div>
              <div className="relative bg-white p-6 rounded-lg shadow-md border h-32">
                <span className="text-sm text-gray-600">bottom-right</span>
                <Gotcha
                  elementId="dev-pos-bottom-right"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4">
              <div className="relative bg-white p-6 rounded-lg shadow-md border h-32">
                <span className="text-sm text-gray-600">showOnHover=false (always visible)</span>
                <Gotcha
                  elementId="dev-hover-false"
                  mode="feedback"
                  size="sm"
                  position="top-right"
                  showOnHover={false}
                />
              </div>
              <div className="relative bg-white p-6 rounded-lg shadow-md border h-32">
                <span className="text-sm text-gray-600">showOnHover=true (hover to reveal)</span>
                <Gotcha
                  elementId="dev-hover-true"
                  mode="feedback"
                  size="sm"
                  position="top-right"
                  showOnHover={true}
                />
              </div>
            </div>
          </section>

          {/* Score Display */}
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl font-semibold mb-4">Score Display</h2>
            <p className="text-gray-500 text-sm mb-4">
              Submit feedback/votes above to populate score data. Stars/number/compact need rating
              data; votes need vote data.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4">
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-3">Stars (default)</h3>
                <GotchaScore elementId="dev-mode-feedback" variant="stars" theme="light" />
                <GotchaScore elementId="dev-fields-rating-only" variant="stars" theme="light" />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-3">Number</h3>
                <GotchaScore elementId="dev-mode-feedback" variant="number" theme="light" />
                <GotchaScore elementId="dev-fields-rating-only" variant="number" theme="light" />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-3">Compact</h3>
                <GotchaScore elementId="dev-mode-feedback" variant="compact" theme="light" />
                <GotchaScore elementId="dev-fields-rating-only" variant="compact" theme="light" />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-3">Votes</h3>
                <GotchaScore elementId="dev-mode-vote" variant="votes" theme="light" />
              </div>
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-slate-900 p-6 rounded-lg shadow-md border border-gray-700">
                <h3 className="font-medium mb-3 text-white">Dark Theme Stars</h3>
                <GotchaScore elementId="dev-mode-feedback" variant="stars" theme="dark" />
                <GotchaScore elementId="dev-fields-rating-only" variant="stars" theme="dark" />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-3">Large Size</h3>
                <GotchaScore
                  elementId="dev-mode-feedback"
                  variant="stars"
                  size="lg"
                  theme="light"
                />
                <GotchaScore
                  elementId="dev-fields-rating-only"
                  variant="stars"
                  size="lg"
                  theme="light"
                />
              </div>
            </div>
          </section>

          {/* One Per User */}
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl font-semibold mb-4">One Per User</h2>
            <p className="text-gray-500 text-sm mb-4">
              With <code className="bg-gray-100 px-1 rounded">onePerUser</code>, the button shows a
              checkmark after submission. Click again to review/edit your response. Requires a{' '}
              <code className="bg-gray-100 px-1 rounded">user.id</code> to track responses.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4">
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Feedback (onePerUser)
                  <Gotcha
                    elementId="dev-oneperuser-feedback"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    onePerUser
                    promptText="Rate this feature"
                    user={{ id: 'dev-test-user' }}
                  />
                </h3>
                <p className="text-gray-500 text-sm">
                  Submit once, then see checkmark. Click to review/edit.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Vote (onePerUser)
                  <Gotcha
                    elementId="dev-oneperuser-vote"
                    mode="vote"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    onePerUser
                    promptText="Is this useful?"
                    user={{ id: 'dev-test-user' }}
                  />
                </h3>
                <p className="text-gray-500 text-sm">
                  Vote once, then see your choice pre-selected.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Poll (onePerUser)
                  <Gotcha
                    elementId="dev-oneperuser-poll"
                    mode="poll"
                    options={['Option A', 'Option B', 'Option C']}
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    onePerUser
                    promptText="Pick your favorite"
                    user={{ id: 'dev-test-user' }}
                  />
                </h3>
                <p className="text-gray-500 text-sm">
                  Poll once, then see your selection pre-filled.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Without onePerUser (default)
                  <Gotcha
                    elementId="dev-oneperuser-off"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="Always fresh form"
                    user={{ id: 'dev-test-user' }}
                  />
                </h3>
                <p className="text-gray-500 text-sm">
                  Same user, but always shows G — can submit multiple times.
                </p>
              </div>
            </div>
          </section>

          {/* Real World Examples */}
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl font-semibold mb-4">Real World Examples</h2>
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  New Analytics Dashboard
                  <Gotcha
                    elementId="dev-example-analytics"
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

              <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-6 rounded-lg shadow-md text-white">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  Pro Plan - $29/mo
                  <Gotcha
                    elementId="dev-example-pricing"
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

              <div className="bg-white p-4 rounded-lg shadow-md border flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Dark Mode</h3>
                  <p className="text-gray-500 text-sm">Enable dark theme across the app</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-6 bg-slate-500 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <Gotcha
                    elementId="dev-example-setting"
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
          {/* New Features (E2E Test Targets) */}
          <section className="mb-8 md:mb-12" data-testid="new-features">
            <h2 className="text-xl font-semibold mb-4">New Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4">
              <div className="bg-white p-6 rounded-lg shadow-md border" data-testid="bug-flag-card">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Bug Flag + Screenshot
                  <Gotcha
                    elementId="dev-bug-screenshot"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="Report a bug"
                    enableBugFlag
                    enableScreenshot
                  />
                </h3>
                <p className="text-gray-500 text-sm">enableBugFlag + enableScreenshot</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border" data-testid="follow-up-card">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Follow-up Questions
                  <Gotcha
                    elementId="dev-follow-up"
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
                <p className="text-gray-500 text-sm">followUp with ratingThreshold=2</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border" data-testid="trigger-delay-card">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Delayed Trigger (3s)
                  <Gotcha
                    elementId="dev-trigger-delay"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="Delayed feedback"
                    showAfterSeconds={3}
                  />
                </h3>
                <p className="text-gray-500 text-sm">showAfterSeconds=3</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border" data-testid="fresh-form-card">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Fresh Form (no onePerUser)
                  <Gotcha
                    elementId="dev-fresh-form"
                    mode="feedback"
                    size="sm"
                    position="inline"
                    showOnHover={false}
                    promptText="Fresh feedback every time"
                  />
                </h3>
                <p className="text-gray-500 text-sm">Default: fresh form on each open</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
