'use client';

import { useState } from 'react';
import {
  EditorialCard,
  EditorialCardHeader,
  EditorialCardBody,
} from '../../../components/editorial/card';
import { EditorialButton } from '../../../components/editorial/button';

interface RoadmapCardProps {
  projectSlug: string;
  initialEnabled: boolean;
  initialIntro: string | null;
}

const INTRO_MAX_LEN = 280;

export function RoadmapCard({ projectSlug, initialEnabled, initialIntro }: RoadmapCardProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [intro, setIntro] = useState(initialIntro ?? '');
  const [savingToggle, setSavingToggle] = useState(false);
  const [savingIntro, setSavingIntro] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/roadmap/${projectSlug}`
      : `/roadmap/${projectSlug}`;

  const patch = async (body: object) => {
    const res = await fetch(`/api/projects/${projectSlug}/roadmap`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || 'Failed to update roadmap settings');
    }
    return res.json();
  };

  const handleToggle = async () => {
    const previous = enabled;
    const next = !enabled;
    setEnabled(next);
    setSavingToggle(true);
    setError(null);
    try {
      await patch({ enabled: next });
    } catch (err) {
      setEnabled(previous);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSavingToggle(false);
    }
  };

  const handleSaveIntro = async () => {
    setSavingIntro(true);
    setError(null);
    try {
      const trimmed = intro.trim();
      await patch({ intro: trimmed.length === 0 ? null : trimmed });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSavingIntro(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — surface the URL inline so user can copy manually */
    }
  };

  return (
    <EditorialCard>
      <EditorialCardHeader className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[1.25rem] font-normal leading-[1.15] tracking-[-0.01em] text-editorial-ink">
            Public roadmap
          </h2>
          <p className="mt-1 text-[13px] leading-[1.6] text-editorial-neutral-3">
            Share what&rsquo;s planned, in progress, and shipped. No cookies, no third-party
            scripts, no submitter PII.{' '}
            <span className="text-editorial-neutral-3/80">
              When enabled, the page is publicly indexable.
            </span>
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Public roadmap"
          onClick={handleToggle}
          disabled={savingToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border border-editorial-neutral-2 transition-colors duration-240 ease-page-turn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent/40 ${
            enabled ? 'bg-editorial-accent' : 'bg-editorial-paper'
          } ${savingToggle ? 'opacity-50' : ''}`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-editorial-paper shadow-sm transition-transform duration-240 ease-page-turn ${
              enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
            } ${enabled ? 'border border-editorial-accent/60' : 'border border-editorial-neutral-2'}`}
          />
        </button>
      </EditorialCardHeader>
      <EditorialCardBody className="space-y-5">
        {enabled && (
          <div className="rounded-md border border-editorial-neutral-2 bg-editorial-ink/[0.02] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
              Public URL
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md border border-editorial-neutral-2 bg-editorial-paper px-3 py-1.5 font-mono text-[12px] text-editorial-ink">
                {url}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-md border border-editorial-neutral-2 bg-editorial-paper px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-editorial-neutral-2 bg-editorial-paper px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
              >
                Open ↗
              </a>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="roadmap-intro"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3"
          >
            Intro blurb (optional, {INTRO_MAX_LEN} chars max)
          </label>
          <textarea
            id="roadmap-intro"
            value={intro}
            onChange={(e) => setIntro(e.target.value.slice(0, INTRO_MAX_LEN))}
            placeholder="A line or two for the top of your public roadmap…"
            className="mt-2 h-20 w-full resize-none rounded-md border border-editorial-neutral-2 bg-editorial-paper px-3 py-2 font-sans text-[14px] text-editorial-ink placeholder:text-editorial-neutral-3/70 focus:border-editorial-accent focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-editorial-neutral-3">
              {intro.length}/{INTRO_MAX_LEN}
            </span>
            <EditorialButton
              variant="ink"
              size="sm"
              onClick={handleSaveIntro}
              disabled={savingIntro}
            >
              {savingIntro ? 'Saving…' : 'Save'}
            </EditorialButton>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="border-l-2 border-editorial-alert bg-editorial-alert/[0.04] px-3 py-2 text-[13px] text-editorial-ink"
          >
            {error}
          </p>
        )}
      </EditorialCardBody>
    </EditorialCard>
  );
}
