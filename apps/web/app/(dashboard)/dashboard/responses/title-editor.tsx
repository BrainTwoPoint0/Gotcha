'use client';

import { useState, useRef, useEffect } from 'react';

// Mirrors the TITLE_MAX_LEN in the PATCH endpoint and the public roadmap page.
// Anything longer wraps the roadmap card and hurts the scan-at-a-glance read.
const TITLE_MAX_LEN = 80;

interface TitleEditorProps {
  responseId: string;
  initialTitle: string | null;
  onSaved?: (newTitle: string | null) => void;
}

/**
 * Inline title editor for the response detail panel.
 *
 * Idle: renders the title (or a muted "Add title…" hint when null) with a
 * hover affordance. Click or Enter → edit mode. Enter / blur commits, Escape
 * cancels. Optimistic — reverts on server error.
 */
export function TitleEditor({ responseId, initialTitle, onSaved }: TitleEditorProps) {
  const [title, setTitle] = useState<string | null>(initialTitle);
  const [draft, setDraft] = useState(initialTitle ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep local state in sync when the parent list re-renders with a fresh
  // `initialTitle` (e.g., after router.refresh). Don't clobber an in-flight
  // save — treat the optimistic value as source of truth while `saving`.
  useEffect(() => {
    if (!editing && !saving) {
      setTitle(initialTitle);
      setDraft(initialTitle ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTitle]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = () => {
    if (saving) return;
    setDraft(title ?? '');
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(title ?? '');
    setEditing(false);
    setError(null);
  };

  const commitEdit = async () => {
    if (saving) return;
    const trimmed = draft.trim();
    const next = trimmed.length === 0 ? null : trimmed;

    // No-op if nothing changed.
    if (next === title) {
      setEditing(false);
      return;
    }

    if (next !== null && next.length > TITLE_MAX_LEN) {
      setError(`Max ${TITLE_MAX_LEN} characters`);
      return;
    }

    const previous = title;
    setTitle(next);
    setEditing(false);
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/responses/${responseId}/title`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ title: next }),
      });
      if (!res.ok) {
        setTitle(previous);
        setDraft(previous ?? '');
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? 'Failed to save');
      } else {
        onSaved?.(next);
      }
    } catch {
      setTitle(previous);
      setDraft(previous ?? '');
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  if (editing) {
    const remaining = TITLE_MAX_LEN - draft.length;
    return (
      <div className="flex w-full flex-col gap-1">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, TITLE_MAX_LEN))}
          onBlur={() => void commitEdit()}
          onKeyDown={handleKeyDown}
          maxLength={TITLE_MAX_LEN}
          placeholder="Short, public-facing headline…"
          className="w-full rounded-md border border-editorial-accent bg-editorial-paper px-2 py-1 text-[14px] text-editorial-ink placeholder:text-editorial-neutral-3/70 focus:outline-none"
          aria-label="Edit title"
        />
        <div className="flex items-center justify-between">
          <span
            className={`font-mono text-[10px] ${
              remaining <= 10 ? 'text-editorial-alert' : 'text-editorial-neutral-3'
            }`}
          >
            {draft.length}/{TITLE_MAX_LEN}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3">
            Enter saves · Esc cancels
          </span>
        </div>
        {error && (
          <span className="font-mono text-[11px] text-editorial-alert" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={startEdit}
        disabled={saving}
        className="group inline-flex items-center gap-2 rounded-md border border-transparent px-2 py-1 -mx-2 -my-1 text-left text-[14px] transition-colors duration-240 ease-page-turn hover:border-editorial-neutral-2 hover:bg-editorial-paper focus-visible:border-editorial-neutral-2 focus-visible:bg-editorial-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent/40"
        aria-label={title ? 'Edit title' : 'Add title'}
      >
        {title ? (
          <span className="text-editorial-ink">{title}</span>
        ) : (
          <span className="italic text-editorial-neutral-3">Add title…</span>
        )}
        <svg
          width="11"
          height="11"
          viewBox="0 0 14 14"
          fill="none"
          className="shrink-0 text-editorial-neutral-3/60 opacity-0 transition-opacity duration-240 ease-page-turn group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        >
          <path
            d="M9.5 2.5L11.5 4.5L5 11L2.5 11.5L3 9L9.5 2.5Z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {saving && (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3">
          Saving…
        </span>
      )}
      {error && !editing && (
        <span className="font-mono text-[11px] text-editorial-alert" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
