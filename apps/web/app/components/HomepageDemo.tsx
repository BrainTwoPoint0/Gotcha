'use client';

import { Gotcha } from 'gotcha-feedback';

const demos = [
  {
    label: 'Feedback',
    description: 'Star rating + text',
    elementId: 'homepage-demo-feedback',
    mode: 'feedback' as const,
    promptText: 'How do you like this feature?',
  },
  {
    label: 'Vote',
    description: 'Thumbs up / down',
    elementId: 'homepage-demo-vote',
    mode: 'vote' as const,
    promptText: 'Is this useful?',
  },
  {
    label: 'Poll',
    description: 'Custom options',
    elementId: 'homepage-demo-poll',
    mode: 'poll' as const,
    promptText: 'What should we build next?',
  },
];

export function HomepageDemo() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">See it in action</h2>
          <p className="text-gray-600">Click any G button below — these are live Gotcha widgets.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {demos.map((demo) => (
            <div
              key={demo.elementId}
              className="bg-white rounded-xl border border-gray-200 p-6 text-center"
            >
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center justify-center gap-2">
                {demo.label}
                <Gotcha
                  elementId={demo.elementId}
                  mode={demo.mode}
                  size="sm"
                  position="inline"
                  showOnHover={false}
                  promptText={demo.promptText}
                  {...(demo.mode === 'poll'
                    ? { options: ['Analytics', 'Segments', 'Exports', 'API'] }
                    : {})}
                />
              </h3>
              <p className="text-sm text-gray-500 text-center">{demo.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
