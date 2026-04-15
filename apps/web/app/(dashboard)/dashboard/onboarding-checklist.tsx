'use client';

import Link from 'next/link';

interface OnboardingChecklistProps {
  hasProjects: boolean;
  hasResponses: boolean;
  projectSlug?: string;
  apiKey?: string;
}

export function OnboardingChecklist({
  hasProjects,
  hasResponses,
  projectSlug,
  apiKey,
}: OnboardingChecklistProps) {
  const steps = [
    {
      num: '01',
      label: 'Create your first project',
      checked: hasProjects,
      detail: (
        <Link
          href="/dashboard/projects/new"
          className="text-[13px] text-editorial-ink underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent"
        >
          Create a project →
        </Link>
      ),
    },
    {
      num: '02',
      label: 'Install the SDK',
      checked: hasProjects,
      detail: (
        <code className="rounded-md border border-editorial-neutral-2 bg-editorial-paper px-2.5 py-1 font-mono text-[12px] text-editorial-ink">
          npm install gotcha-feedback
        </code>
      ),
    },
    {
      num: '03',
      label: 'Add your API key',
      checked: hasProjects,
      detail: apiKey ? (
        <code className="break-all rounded-md border border-editorial-neutral-2 bg-editorial-paper px-2.5 py-1 font-mono text-[12px] text-editorial-ink">
          {apiKey}
        </code>
      ) : projectSlug ? (
        <Link
          href={`/dashboard/projects/${projectSlug}`}
          className="text-[13px] text-editorial-ink underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent"
        >
          View API keys →
        </Link>
      ) : null,
    },
    {
      num: '04',
      label: 'Receive your first response',
      checked: hasResponses,
      detail: !hasResponses ? (
        <span className="text-[13px] text-editorial-neutral-3">
          Waiting for your first user response…
        </span>
      ) : null,
    },
  ];

  const completedCount = steps.filter((s) => s.checked).length;
  const allDone = completedCount === steps.length;

  if (allDone) {
    return (
      <div className="border-l-2 border-editorial-success bg-editorial-success/[0.04] px-5 py-4 text-[14px] text-editorial-ink">
        <span className="text-editorial-success">All set.</span> You&rsquo;re collecting feedback
        from your users.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-editorial-neutral-2 bg-editorial-paper">
      <div className="flex items-center justify-between border-b border-editorial-neutral-2 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="h-px w-6 bg-editorial-accent" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            Getting started
          </span>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-editorial-neutral-3">
          {completedCount} of {steps.length} complete
        </span>
      </div>
      <ol className="divide-y divide-editorial-neutral-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-start gap-5 px-6 py-5">
            <span
              className={`font-mono text-[13px] ${
                step.checked ? 'text-editorial-success' : 'text-editorial-ink'
              }`}
              aria-hidden="true"
            >
              {step.checked ? '✓' : step.num}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <p
                className={`text-[14px] ${
                  step.checked
                    ? 'text-editorial-neutral-3 line-through decoration-editorial-neutral-2'
                    : 'text-editorial-ink'
                }`}
              >
                {step.label}
              </p>
              {!step.checked && step.detail && <div>{step.detail}</div>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
