'use client';

import { useState } from 'react';
import Link from 'next/link';

function CopyCommand() {
  const [copied, setCopied] = useState(false);
  const command = 'npm install gotcha-feedback';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Insecure contexts and permission-denied reject — fall back to a
      // best-effort text-selection so the user can still copy by hand.
      const sel = window.getSelection();
      const range = document.createRange();
      const node = document.createTextNode(command);
      const host = document.createElement('span');
      host.style.cssText = 'position:fixed;left:-9999px;';
      host.appendChild(node);
      document.body.appendChild(host);
      range.selectNode(node);
      sel?.removeAllRanges();
      sel?.addRange(range);
      setTimeout(() => {
        sel?.removeAllRanges();
        host.remove();
      }, 1500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy install command"
      className="group inline-flex items-center gap-3 rounded-md border border-editorial-neutral-2 bg-editorial-paper px-4 py-2.5 font-mono text-sm text-editorial-ink/80 transition-all duration-240 ease-page-turn hover:border-editorial-ink/20 hover:bg-editorial-ink/[0.02]"
    >
      <span className="text-editorial-neutral-3">$</span>
      <code className="tracking-tight">{command}</code>
      <span
        className={
          copied
            ? 'text-editorial-success transition-opacity duration-240'
            : 'text-editorial-neutral-3 transition-opacity duration-240 group-hover:text-editorial-ink'
        }
        aria-hidden="true"
      >
        {copied ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )}
      </span>
    </button>
  );
}

export function HeroSection() {
  return (
    <section className="editorial relative bg-editorial-paper pt-24 pb-20 sm:pt-32 sm:pb-28">
      {/* Hairline top rule — editorial signature, not border */}
      <div className="absolute inset-x-0 top-0 h-px bg-editorial-neutral-2" />

      <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
        {/* Eyebrow */}
        <div className="animate-page-turn mb-10 flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-editorial-accent" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            A feedback layer for honest teams
          </span>
        </div>

        {/* Headline — Fraunces display serif, headings only */}
        <h1
          className="animate-page-turn max-w-3xl font-display text-[2.75rem] font-normal leading-[1.05] tracking-[-0.02em] text-editorial-ink sm:text-6xl"
          style={{ animationDelay: '60ms' }}
        >
          Where your users talk to you,{' '}
          <span className="italic text-editorial-neutral-3">and you talk back</span>
          <span className="text-editorial-accent">.</span>
        </h1>

        {/* Deck — Inter body, editorial whitespace. Lead with the object (a
            React feedback widget + dashboard) so a skimmer knows what this is
            in the first sentence; reserve the poetry for the headline. */}
        <p
          className="animate-page-turn mt-8 max-w-2xl text-lg leading-[1.55] text-editorial-neutral-3 sm:text-xl"
          style={{ animationDelay: '120ms' }}
        >
          A React feedback widget and dashboard that closes the loop. Users leave a rating, a vote,
          or a bug report — and hear back when you ship. No analytics, no cookies, no tracking. Just
          a direct line.
        </p>

        {/* Actions — one accent CTA, one hairline secondary. Not two equal buttons. */}
        <div
          className="animate-page-turn mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center"
          style={{ animationDelay: '180ms' }}
        >
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-md bg-editorial-accent px-6 py-3 text-[15px] font-medium text-editorial-paper transition-all duration-240 ease-page-turn hover:bg-editorial-accent/90"
          >
            Start for free
            <span
              aria-hidden="true"
              className="transition-transform duration-240 group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>

          <CopyCommand />
        </div>

        {/* Fine print — understated, editorial */}
        <p
          className="animate-page-turn mt-6 text-[13px] text-editorial-neutral-3"
          style={{ animationDelay: '240ms' }}
        >
          Free tier · No credit card · React SDK ·{' '}
          <Link
            href="/demo"
            className="text-editorial-ink underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent"
          >
            try the demo
          </Link>
        </p>
      </div>
    </section>
  );
}
