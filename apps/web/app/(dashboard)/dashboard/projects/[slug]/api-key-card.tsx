'use client';

import { useState } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { EditorialButton } from '../../../components/editorial/button';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  allowedDomains: string[];
  lastUsedAt: Date | null;
  createdAt: Date;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function ApiKeyCard({ apiKey, projectSlug }: { apiKey: ApiKey; projectSlug: string }) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectSlug}/regenerate-key`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to regenerate key');
      }

      setNewKey(data.apiKey);
      setConfirmRegenerate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="rounded-md border border-editorial-neutral-2 bg-editorial-paper p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-display text-[1rem] leading-none tracking-[-0.01em] text-editorial-ink">
          {apiKey.name}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3">
          {apiKey.lastUsedAt ? `Last used ${formatDate(apiKey.lastUsedAt)}` : 'Never used'}
        </span>
      </div>

      {newKey ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 select-all break-all rounded-md border border-editorial-neutral-2 bg-editorial-ink px-3 py-2 font-mono text-[12px] text-editorial-paper">
              {newKey}
            </code>
            <button
              type="button"
              onClick={() => handleCopy(newKey)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-editorial-ink transition-colors hover:bg-editorial-ink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent/40"
              aria-label={copied ? 'Copied' : 'Copy key'}
            >
              {copied ? (
                <Check className="h-4 w-4 text-editorial-success" />
              ) : (
                <Copy className="h-4 w-4 text-editorial-neutral-3" />
              )}
            </button>
          </div>
          <div
            role="status"
            aria-live="polite"
            className="border-l-2 border-editorial-accent bg-editorial-accent/[0.04] px-4 py-3 text-[13px] text-editorial-ink"
          >
            Copy this key now — you won&apos;t be able to see it again.
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md border border-editorial-neutral-2 bg-editorial-ink/[0.03] px-3 py-2 font-mono text-[12px] text-editorial-neutral-3">
              {apiKey.key}
            </code>
            <button
              type="button"
              onClick={() => handleCopy(apiKey.key)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-editorial-ink transition-colors hover:bg-editorial-ink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent/40"
              aria-label={copied ? 'Copied' : 'Copy key prefix'}
            >
              {copied ? (
                <Check className="h-4 w-4 text-editorial-success" />
              ) : (
                <Copy className="h-4 w-4 text-editorial-neutral-3" />
              )}
            </button>
          </div>

          <p className="mt-3 text-[12px] leading-[1.55] text-editorial-neutral-3">
            Full key was shown only at creation.{' '}
            <button
              type="button"
              onClick={() => setConfirmRegenerate(true)}
              className="text-editorial-ink underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent"
            >
              Regenerate key
            </button>{' '}
            if lost.
          </p>

          {confirmRegenerate && (
            <div className="mt-3 border-l-2 border-editorial-alert bg-editorial-alert/[0.04] px-4 py-3">
              <p className="text-[13px] leading-[1.5] text-editorial-ink">
                This will revoke the current key. Any integrations using it will stop working.
              </p>
              <div className="mt-3 flex gap-2">
                <EditorialButton
                  variant="ink"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="bg-editorial-alert text-editorial-paper hover:bg-editorial-alert/90"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${regenerating ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  {regenerating ? 'Regenerating…' : 'Regenerate'}
                </EditorialButton>
                <button
                  type="button"
                  onClick={() => setConfirmRegenerate(false)}
                  disabled={regenerating}
                  className="px-3 text-[13px] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-3 border-l-2 border-editorial-alert bg-editorial-alert/[0.04] px-4 py-3 text-[13px] text-editorial-alert"
            >
              {error}
            </div>
          )}
        </>
      )}

      {apiKey.allowedDomains.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {apiKey.allowedDomains.map((domain) => (
            <span
              key={domain}
              className="inline-flex items-center rounded-md border border-editorial-neutral-2 bg-editorial-paper px-2 py-0.5 font-mono text-[11px] text-editorial-neutral-3"
            >
              {domain}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
