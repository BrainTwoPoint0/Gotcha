'use client';

import { useEffect, useState } from 'react';

interface VoteButtonProps {
  slug: string;
  responseId: string;
  initialCount: number;
}

/**
 * Anonymous upvote button for a roadmap card. Optimistic on click; reconciles
 * with the server response. Persists the "I voted on this" state in
 * localStorage so returning visitors see their own upvotes highlighted
 * without a server roundtrip. The DB unique constraint on (responseId,
 * voterHash) is the real source of truth — localStorage is UI hint.
 */
export function VoteButton({ slug, responseId, initialCount }: VoteButtonProps) {
  const storageKey = `gotcha:roadmap:${slug}:voted`;
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(false);
  const [pending, setPending] = useState(false);

  // Hydrate voted-state from localStorage on mount (client-only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const set = new Set<string>(JSON.parse(raw));
      if (set.has(responseId)) setVoted(true);
    } catch {
      /* localStorage unavailable or corrupt — treat as not voted */
    }
  }, [responseId, storageKey]);

  const writeLocal = (nextVoted: boolean) => {
    try {
      const raw = localStorage.getItem(storageKey);
      const set = new Set<string>(raw ? JSON.parse(raw) : []);
      if (nextVoted) set.add(responseId);
      else set.delete(responseId);
      localStorage.setItem(storageKey, JSON.stringify(Array.from(set)));
    } catch {
      /* swallow */
    }
  };

  const handleClick = async () => {
    if (pending) return;
    const prevCount = count;
    const prevVoted = voted;
    const optimisticVoted = !prevVoted;
    setVoted(optimisticVoted);
    setCount(prevCount + (optimisticVoted ? 1 : -1));
    setPending(true);

    try {
      const res = await fetch(`/api/public/roadmap/${slug}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => 'vote failed'));
      const data = (await res.json()) as { count?: number; voted?: boolean };
      if (typeof data.count === 'number') setCount(data.count);
      if (typeof data.voted === 'boolean') {
        setVoted(data.voted);
        writeLocal(data.voted);
      }
    } catch {
      // Rollback optimistic update on error.
      setCount(prevCount);
      setVoted(prevVoted);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={voted}
      aria-label={
        voted ? `Remove your upvote (current count: ${count})` : `Upvote (current count: ${count})`
      }
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-240 ease-page-turn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent/40 ${
        voted
          ? 'border-editorial-accent bg-editorial-accent/10 text-editorial-accent'
          : 'border-editorial-neutral-2 bg-editorial-paper text-editorial-neutral-3 hover:border-editorial-accent/40 hover:text-editorial-ink'
      } ${pending ? 'opacity-60' : ''}`}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path
          d="M5 2L8 6H2L5 2Z"
          fill={voted ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
      <span>{count}</span>
    </button>
  );
}
