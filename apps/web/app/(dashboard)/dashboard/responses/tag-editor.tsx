'use client';

import { useState, useRef, useCallback } from 'react';

interface TagEditorProps {
  responseId: string;
  initialTags: string[];
  isPro: boolean;
  availableTags?: { tag: string; count: number }[];
}

export function TagEditor({ responseId, initialTags, isPro, availableTags = [] }: TagEditorProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const suggestions = inputValue.trim()
    ? availableTags
        .filter((t) => t.tag.startsWith(inputValue.trim().toLowerCase()) && !tags.includes(t.tag))
        .slice(0, 6)
    : [];

  const saveTags = useCallback(async (newTags: string[]) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/responses/${responseId}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });
      if (!res.ok) {
        setTags(tags);
        return;
      }
      const data = await res.json();
      setTags(data.tags);
    } catch {
      setTags(tags);
    } finally {
      setSaving(false);
    }
  }, [responseId, tags]);

  const addTag = () => {
    const tag = inputValue.trim().toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= 10) return;
    const newTags = [...tags, tag];
    setTags(newTags);
    setInputValue('');
    saveTags(newTags);
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    saveTags(newTags);
  };

  const selectSuggestion = (suggestion: string) => {
    if (tags.includes(suggestion) || tags.length >= 10) return;
    const newTags = [...tags, suggestion];
    setTags(newTags);
    setInputValue('');
    setHighlightIndex(-1);
    saveTags(newTags);
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

  // Read-only display for non-PRO users
  if (!isPro) {
    if (tags.length === 0) return null;
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400 w-16">Tags</span>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-sky-50/80 text-sky-700 border border-sky-200/60"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-50">
                <path d="M1.5 5.5V2.5C1.5 2 2 1.5 2.5 1.5H5.5L8.5 4.5L5 8L1.5 5.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                <circle cx="3.5" cy="3.5" r="0.75" fill="currentColor" />
              </svg>
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium uppercase tracking-wider text-gray-400 w-16">Tags</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs
              bg-sky-50/80 text-sky-700 border border-sky-200/60
              transition-opacity duration-150
              ${saving ? 'opacity-60' : ''}
            `}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-50">
              <path d="M1.5 5.5V2.5C1.5 2 2 1.5 2.5 1.5H5.5L8.5 4.5L5 8L1.5 5.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
              <circle cx="3.5" cy="3.5" r="0.75" fill="currentColor" />
            </svg>
            {tag}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              disabled={saving}
              className="
                text-sky-400 hover:text-sky-700 hover:bg-sky-100
                rounded-sm p-0.5 -mr-0.5 ml-0.5
                transition-all duration-100
                disabled:opacity-40 disabled:pointer-events-none
              "
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M2 2L6 6M6 2L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
                // Delay to allow click on suggestion
                setTimeout(() => {
                  if (inputValue.trim()) addTag();
                  else setIsAdding(false);
                }, 150);
              }}
              placeholder="add tag…"
              maxLength={30}
              autoFocus
              className="
                text-xs px-2 h-6 rounded-md
                border border-sky-300 bg-white
                outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200/50
                w-24 text-sky-800 placeholder:text-sky-300
                transition-all duration-150
              "
            />
            {suggestions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute top-7 left-0 z-50 min-w-[160px] bg-white border border-gray-200 rounded-md shadow-lg py-1"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={s.tag}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectSuggestion(s.tag);
                    }}
                    className={`
                      w-full text-left px-2.5 py-1 text-xs flex items-center justify-between gap-3
                      ${i === highlightIndex ? 'bg-sky-50 text-sky-700' : 'text-gray-700 hover:bg-gray-50'}
                    `}
                  >
                    <span>{s.tag}</span>
                    <span className="text-[10px] text-gray-400">{s.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsAdding(true);
            }}
            disabled={saving || tags.length >= 10}
            className="
              inline-flex items-center gap-1 px-1.5 h-6 rounded-md
              text-[11px] text-gray-400
              border border-dashed border-gray-300
              hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50/50
              transition-all duration-150
              disabled:opacity-30 disabled:pointer-events-none
            "
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M4 1V7M1 4H7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
            {tags.length === 0 ? 'add tag' : ''}
          </button>
        )}
      </div>
    </div>
  );
}
