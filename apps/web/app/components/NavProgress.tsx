'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Top-bar navigation progress indicator.
 *
 * A 2px burnt-sienna rule that pins to the top edge of the viewport and
 * animates forward the instant an internal link is clicked, then
 * completes when the new route renders. Fills the UX hole where
 * Next.js App Router has a ~100-400ms gap between click and the
 * `loading.tsx` skeleton appearing — during that window the user had
 * no signal the app received the click. The bar uses accent sienna so
 * the brand moment doubles as the feedback moment.
 *
 * Zero dependencies. Detects internal navigation via a document-level
 * click listener (catches every <Link> and <a href=...> without
 * requiring each to wrap the handler). Completes on pathname or
 * searchParams change.
 */
export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start progress on any internal <a> click.
  useEffect(() => {
    const start = () => {
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
        completeTimerRef.current = null;
      }
      setVisible(true);
      setProgress(8);
      if (tickerRef.current) clearInterval(tickerRef.current);
      // Ease toward 90% — never reaches completion here; pathname effect
      // below handles the finish. The `(90 - p) * k` shape makes early
      // progress feel snappy and the approach to 90% feel decelerating.
      tickerRef.current = setInterval(() => {
        setProgress((p) => (p >= 90 ? 90 : p + Math.max(0.4, (90 - p) * 0.08)));
      }, 100);
    };

    const handler = (e: MouseEvent) => {
      if (e.button !== 0) return; // left-click only
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab etc.
      if (e.defaultPrevented) return;
      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      // Skip: external, hash-only, mailto/tel, download, new-tab target.
      if (/^(https?:)?\/\//.test(href) && !href.startsWith(window.location.origin)) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (anchor.target === '_blank') return;
      if (anchor.hasAttribute('download')) return;
      // Skip if navigating to the current URL (no actual transition).
      const current = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
      const targetPath = new URL(href, window.location.origin).pathname +
        new URL(href, window.location.origin).search;
      if (targetPath === current) return;
      start();
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [pathname, searchParams]);

  // Complete when pathname or search changes. 240ms fill to 100%, then
  // 180ms fade out so the bar doesn't linger once the new page paints.
  useEffect(() => {
    if (!visible) return;
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
    setProgress(100);
    completeTimerRef.current = setTimeout(() => {
      setVisible(false);
      // Reset progress after fade so the next start can animate cleanly.
      setTimeout(() => setProgress(0), 200);
    }, 220);
    return () => {
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams.toString()]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 99999,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 180ms cubic-bezier(0.22, 0.61, 0.36, 1)',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: 'rgb(212 83 42)', // editorial accent (burnt sienna)
          boxShadow: '0 0 8px rgba(212, 83, 42, 0.45)',
          transition:
            progress === 0
              ? 'none'
              : progress === 100
                ? 'width 240ms cubic-bezier(0.22, 0.61, 0.36, 1)'
                : 'width 120ms linear',
          transformOrigin: 'left center',
        }}
      />
    </div>
  );
}
