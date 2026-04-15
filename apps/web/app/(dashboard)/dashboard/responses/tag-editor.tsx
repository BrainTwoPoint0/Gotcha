'use client';

import { useState, useRef, useEffect } from 'react';

interface TagEditorProps {
  responseId: string;
  initialTags: string[];
  isPro: boolean;
  availableTags?: { tag: string; count: number }[];
}

const TAG_ICON = (
  <svg
    width="9"
    height="9"
    viewBox="0 0 10 10"
    fill="none"
    className="opacity-50"
    aria-hidden="true"
  >
    <path
      d="M1.5 5.5V2.5C1.5 2 2 1.5 2.5 1.5H5.5L8.5 4.5L5 8L1.5 5.5Z"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <circle cx="3.5" cy="3.5" r="0.75" fill="currentColor" />
  </svg>
);

export function TagEditor({ responseId, initialTags, isPro, availableTags = [] }: TagEditorProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const suggestions = inputValue.trim()
    ? availableTags
        .filter((t) => t.tag.startsWith(inputValue.trim().toLowerCase()) && !tags.includes(t.tag))
        .slice(0, 6)
    : [];

  /**
   * Each call captures its own `previousTags` snapshot so rollback restores
   * exactly what was on screen before the PATCH — not whatever `tags` happens
   * to be at reject time (which previously caused a rapid add-then-remove to
   * restore a deleted tag on network failure).
   */
  async function saveTags(newTags: string[], previousTags: string[]) {
    setSaving(true);
    try {
      const res = await fetch(`/api/responses/${responseId}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ tags: newTags }),
      });
      if (!mountedRef.current) return;
      if (!res.ok) {
        setTags(previousTags);
        return;
      }
      const data = await res.json();
      setTags(data.tags);
    } catch {
      if (mountedRef.current) setTags(previousTags);
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }

  const addTag = () => {
    const tag = inputValue.trim().toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= 10) return;
    const previousTags = tags;
    const newTags = [...tags, tag];
    setTags(newTags);
    setInputValue('');
    saveTags(newTags, previousTags);
  };

  const removeTag = (tagToRemove: string) => {
    const previousTags = tags;
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    saveTags(newTags, previousTags);
  };

  const selectSuggestion = (suggestion: string) => {
    if (tags.includes(suggestion) || tags.length >= 10) return;
    const previousTags = tags;
    const newTags = [...tags, suggestion];
    setTags(newTags);
    setInputValue('');
    setHighlightIndex(-1);
    saveTags(newTags, previousTags);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
        return;
      }
      if (e.key === 'Enter' && highlightIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[highlightIndex].tag);
        return;
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setInputValue('');
      setHighlightIndex(-1);
    }
  };

  // Read-only display for non-PRO users — no add affordance.
  if (!isPro) {
    if (tags.length === 0) return null;
    return (
      <div className="flex items-start gap-5">
        <span className="w-20 shrink-0 pt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
          Tags
        </span>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-md border border-editorial-neutral-2 bg-editorial-paper px-2 py-0.5 text-[12px] text-editorial-ink"
            >
              <span className="text-editorial-accent/70">{TAG_ICON}</span>
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-5">
      <span className="w-20 shrink-0 pt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
        Tags
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1.5 rounded-md border border-editorial-neutral-2 bg-editorial-paper px-2 py-0.5 text-[12px] text-editorial-ink transition-opacity duration-150 ${
              saving ? 'opacity-60' : ''
            }`}
          >
            <span className="text-editorial-accent/70">{TAG_ICON}</span>
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              disabled={saving}
              aria-label={`Remove tag ${tag}`}
              className="-mr-0.5 ml-0.5 rounded-sm p-0.5 text-editorial-neutral-3 transition-colors hover:bg-editorial-ink/[0.04] hover:text-editorial-ink disabled:pointer-events-none disabled:opacity-40"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                <path
                  d="M2 2L6 6M6 2L2 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </span>
        ))}

        {isAdding ? (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setHighlightIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                setTimeout(() => {
                  if (inputValue.trim()) addTag();
                  else setIsAdding(false);
                }, 150);
              }}
              placeholder="add tag…"
              maxLength={30}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              className="h-6 w-28 rounded-md border border-editorial-neutral-2 bg-editorial-paper px-2 text-[12px] text-editorial-ink outline-none transition-colors placeholder:text-editorial-neutral-3/70 focus:border-editorial-accent focus:ring-2 focus:ring-editorial-accent/25"
            />
            {suggestions.length > 0 && (
              <div className="absolute left-0 top-7 z-50 min-w-[180px] overflow-hidden rounded-md border border-editorial-neutral-2 bg-editorial-paper shadow-[0_8px_24px_rgba(26,23,20,0.08)]">
                {suggestions.map((s, i) => (
                  <button
                    key={s.tag}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectSuggestion(s.tag);
                    }}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[12px] transition-colors ${
                      i === highlightIndex
                        ? 'bg-editorial-accent/10 text-editorial-ink'
                        : 'text-editorial-neutral-3 hover:bg-editorial-ink/[0.03] hover:text-editorial-ink'
                    }`}
                  >
                    <span>{s.tag}</span>
                    <span className="font-mono text-[10px] text-editorial-neutral-3">
                      {s.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAdding(true);
            }}
            disabled={saving || tags.length >= 10}
            aria-label="Add tag"
            className="inline-flex h-6 items-center gap-1 rounded-md border border-dashed border-editorial-neutral-2 px-2 text-[11px] text-editorial-neutral-3 transition-all hover:border-editorial-accent/40 hover:bg-editorial-ink/[0.02] hover:text-editorial-ink disabled:pointer-events-none disabled:opacity-30"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
              <path
                d="M4 1V7M1 4H7"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
            </svg>
            {tags.length === 0 ? 'add tag' : ''}
          </button>
        )}
      </div>
    </div>
  );
}
