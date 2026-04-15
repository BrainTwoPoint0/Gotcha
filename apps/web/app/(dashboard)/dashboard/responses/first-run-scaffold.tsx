'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EditorialLinkButton } from '../../components/editorial/button';

interface FirstRunScaffoldProps {
  hasProject: boolean;
  firstProjectSlug: string | null;
}

const SNIPPET = `import { GotchaProvider, Gotcha } from 'gotcha-feedback';

<GotchaProvider apiKey="YOUR_API_KEY">
  <App />
</GotchaProvider>

<Gotcha elementId="checkout" mode="nps" />`;

export function FirstRunScaffold({ hasProject, firstProjectSlug }: FirstRunScaffoldProps) {
  const [copied, setCopied] = useState(false);
  const [received, setReceived] = useState(false);
  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll the dashboard-internal "has any response yet?" endpoint every 30s
  // so the listening indicator flips to a celebratory CTA the moment the
  // first submission lands. Stops polling once flipped (or on unmount), and
  // pauses while the tab is hidden to avoid wasted DB hits.
  //
  // Caps at MAX_POLL_MS so a forgotten dashboard tab doesn't generate
  // hundreds of authenticated DB queries per hour. After the cap, polling
  // stops until the user navigates again — the first-run scaffold is still
  // useful as a static reference.
  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    const MAX_POLL_MS = 20 * 60_000;

    const check = async () => {
      if (Date.now() - startedAt > MAX_POLL_MS) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        return;
      }
      try {
        const res = await fetch('/api/responses/has-any', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { hasAny?: boolean };
        if (cancelled) return;
        if (data.hasAny) {
          setReceived(true);
          if (pollRef.current) clearInterval(pollRef.current);
          // Pull the now-populated server data so the page transitions out
          // of the first-run state on its own.
          router.refresh();
        }
      } catch {
        /* network blip — try again next tick */
      }
    };

    const start = () => {
      if (pollRef.current) return;
      if (Date.now() - startedAt > MAX_POLL_MS) return;
      check();
      pollRef.current = setInterval(check, 30_000);
    };
    const stop = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      start();
    }
    const onVis = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [router]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const steps = [
    {
      num: '01',
      title: 'Create a project',
      body: hasProject
        ? 'Done — you have at least one project to collect feedback against.'
        : 'A project groups the responses from one app, one site, or one surface. Most teams start with a single project.',
      done: hasProject,
      action: hasProject ? null : (
        <EditorialLinkButton href="/dashboard/projects/new" variant="ink" size="sm">
          Create project →
        </EditorialLinkButton>
      ),
    },
    {
      num: '02',
      title: 'Install the SDK',
      body: 'One npm package, one provider, one component. Works in any React app — Next.js, Vite, Remix, CRA.',
      done: false,
      action: (
        <div className="flex flex-wrap items-center gap-3">
          <code className="rounded-md border border-editorial-neutral-2 bg-editorial-paper px-3 py-1.5 font-mono text-[12px] text-editorial-ink">
            npm install gotcha-feedback
          </code>
          {firstProjectSlug && (
            <Link
              href={`/dashboard/projects/${firstProjectSlug}`}
              className="text-[13px] text-editorial-neutral-3 underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent hover:text-editorial-ink"
            >
              Get your API key →
            </Link>
          )}
        </div>
      ),
    },
    {
      num: '03',
      title: 'Drop a component and wait',
      body: 'Every response will appear on this page, with page URL, viewport, and optional bug context attached.',
      done: false,
      action: (
        <div className="w-full">
          <div className="flex items-center justify-between border-b border-editorial-paper/10 px-5 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-paper/50">
              app.tsx
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-paper/50 transition-colors hover:text-editorial-paper"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-[1.7] text-editorial-paper/90">
            <code>{SNIPPET}</code>
          </pre>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-md border border-editorial-neutral-2 bg-editorial-paper">
      <div className="border-b border-editorial-neutral-2 px-6 py-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="h-px w-6 bg-editorial-accent" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            First feedback in 5 minutes
          </span>
        </div>
        <h2 className="font-display text-[1.875rem] font-normal leading-[1.15] tracking-[-0.01em] text-editorial-ink">
          Set up your first feedback loop.
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-[1.6] text-editorial-neutral-3">
          Three steps. Every response you collect will land here, tagged with the page and context
          it came from.
        </p>
      </div>

      <ol className="divide-y divide-editorial-neutral-2">
        {steps.map((step, i) => (
          <li key={step.num} className="flex flex-col gap-4 p-6 sm:flex-row sm:gap-8 sm:p-8">
            <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
              <span
                className={`font-mono text-[13px] ${step.done ? 'text-editorial-success' : 'text-editorial-ink'}`}
              >
                {step.done ? '✓' : step.num}
              </span>
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden h-10 w-px bg-editorial-neutral-2 sm:block"
                />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <h3 className="font-display text-[1.25rem] font-normal leading-[1.2] tracking-[-0.01em] text-editorial-ink">
                  {step.title}
                </h3>
                <p className="mt-1 text-[14px] leading-[1.6] text-editorial-neutral-3">
                  {step.body}
                </p>
              </div>
              {step.action && (
                <div
                  className={
                    step.num === '03' ? 'overflow-hidden rounded-md bg-editorial-ink' : undefined
                  }
                >
                  {step.action}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* Listening indicator — the one warm moment. Polls the
          /api/responses/has-any endpoint every 30s while the tab is
          visible; flips to a celebratory CTA when the first submission
          lands. Respects reduced-motion via the editorial blanket rule
          in globals.css. */}
      <div className="flex items-center gap-3 border-t border-editorial-neutral-2 bg-editorial-ink/[0.015] px-6 py-5">
        {received ? (
          <button
            type="button"
            onClick={() => router.refresh()}
            className="-m-2 flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-editorial-success/[0.04]"
          >
            <span
              className="inline-flex h-2 w-2 shrink-0 rounded-full bg-editorial-success"
              aria-hidden="true"
            />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-success">
              Your first feedback is in
            </span>
            <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-ink underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent">
              See it →
            </span>
          </button>
        ) : (
          <>
            <span className="relative inline-flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-editorial-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-editorial-accent" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
              Listening for your first response
            </span>
          </>
        )}
      </div>
    </div>
  );
}
