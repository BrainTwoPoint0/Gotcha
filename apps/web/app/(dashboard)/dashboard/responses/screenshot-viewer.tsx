'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ScreenshotViewerProps {
  responseId: string;
  capturedAt: string | null;
}

interface SignedUrl {
  url: string;
  expiresAt: string;
  capturedAt: string | null;
}

/**
 * Lazy-loading screenshot viewer. The signed URL is fetched on mount (which
 * happens when the response row is expanded), displayed as a small editorial
 * frame, and enlarged in a portal modal on click.
 *
 * Signed URLs expire in 15 minutes — re-fetch if the frame is still mounted
 * when that happens. The modal reuses the already-fetched URL.
 */
export function ScreenshotViewer({ responseId, capturedAt }: ScreenshotViewerProps) {
  const [signed, setSigned] = useState<SignedUrl | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    // `cancelled` guards against late-resolving fetches racing a
    // collapse-then-expand cycle. `ctrl.signal.aborted` isn't reliable
    // here: a fetch that already resolved (bytes on the wire) will have
    // its `.then` queued before the abort flips — so we also need a
    // plain JS flag flipped in the cleanup.
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/responses/${responseId}/screenshot`, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? 'Failed to load screenshot');
        }
        return (await res.json()) as SignedUrl;
      })
      .then((data) => {
        if (cancelled) return;
        setSigned(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load screenshot');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [responseId]);

  // Escape closes the zoom modal.
  useEffect(() => {
    if (!zoomed) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomed]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-editorial-neutral-2 bg-editorial-paper">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
          Loading…
        </span>
      </div>
    );
  }

  if (error || !signed) {
    return (
      <div className="rounded-md border border-editorial-neutral-2 bg-editorial-paper px-4 py-3">
        <span className="font-mono text-[11px] text-editorial-alert">
          {error ?? 'Screenshot unavailable'}
        </span>
      </div>
    );
  }

  const captured = capturedAt ?? signed.capturedAt;
  const capturedLabel = captured
    ? new Date(captured).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <>
      <figure className="space-y-1.5">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="group block w-full max-w-sm overflow-hidden rounded-md border border-editorial-neutral-2 bg-editorial-paper transition-colors duration-240 ease-page-turn hover:border-editorial-ink/30 focus-visible:border-editorial-accent focus-visible:outline-none"
          aria-label="Open screenshot full size"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signed.url}
            alt="Submitter's screenshot"
            className="block h-auto w-full transition-opacity duration-240 group-hover:opacity-95"
            loading="lazy"
          />
        </button>
        {capturedLabel && (
          <figcaption className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            Captured {capturedLabel} · click to enlarge
          </figcaption>
        )}
      </figure>

      {zoomed &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-editorial-ink/85 p-4 backdrop-blur-sm sm:p-8"
            onClick={() => setZoomed(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Screenshot full size"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signed.url}
              alt="Submitter's screenshot (full size)"
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full rounded-md border border-editorial-paper/10 bg-editorial-paper object-contain"
            />
            <button
              type="button"
              onClick={() => setZoomed(false)}
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-editorial-paper/20 bg-editorial-ink/40 font-mono text-[14px] text-editorial-paper transition-colors hover:bg-editorial-ink/60"
            >
              ×
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
