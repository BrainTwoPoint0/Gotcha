'use client';

import Link from 'next/link';

interface OnboardingChecklistProps {
  hasProjects: boolean;
  hasResponses: boolean;
  projectSlug?: string;
  apiKey?: string;
}

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CircleIcon = () => <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;

export function OnboardingChecklist({
  hasProjects,
  hasResponses,
  projectSlug,
  apiKey,
}: OnboardingChecklistProps) {
  const steps = [
    {
      label: 'Create your first project',
      checked: hasProjects,
      detail: (
        <Link
          href="/dashboard/projects/new"
          className="text-sm text-slate-600 hover:text-slate-800 underline"
        >
          Create a project
        </Link>
      ),
    },
    {
      label: 'Install the SDK',
      checked: hasProjects,
      detail: (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
          npm install gotcha-feedback
        </code>
      ),
    },
    {
      label: 'Add your API key',
      checked: hasProjects,
      detail: apiKey ? (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 break-all">
          {apiKey}
        </code>
      ) : projectSlug ? (
        <Link
          href={`/dashboard/projects/${projectSlug}`}
          className="text-sm text-slate-600 hover:text-slate-800 underline"
        >
          View API keys
        </Link>
      ) : null,
    },
    {
      label: 'Receive your first response',
      checked: hasResponses,
      detail: !hasResponses ? (
        <span className="text-sm text-gray-500">Waiting for your first user response...</span>
      ) : null,
    },
  ];

  const completedCount = steps.filter((s) => s.checked).length;
  const allDone = completedCount === steps.length;

  if (allDone) {
    return (
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <p className="text-green-800 font-medium">
          All set! You&apos;re collecting feedback from your users.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-slate-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Getting Started</h2>
        <span className="text-sm text-gray-500">
          {completedCount}/{steps.length} complete
        </span>
      </div>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.label} className="flex items-start gap-3">
            <div className="mt-0.5">{step.checked ? <CheckIcon /> : <CircleIcon />}</div>
            <div>
              <p
                className={`font-medium ${step.checked ? 'text-gray-400 line-through' : 'text-slate-900'}`}
              >
                {step.label}
              </p>
              {!step.checked && step.detail && <div className="mt-1">{step.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
