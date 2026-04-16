'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { EditorialInput } from '../../components/editorial/form-field';
import { EditorialButton } from '../../components/editorial/button';

interface Element {
  elementIdRaw: string;
  count: number;
}

// ── Status presets ───────────────────────────────────────────
//
// Two-tab selector: All · Inbox. The distinction is sharp by design —
// Inbox = untouched new submissions, All = everything in motion.
// Anything finer (triage vs roadmap, single status picks) lives behind
// Customize.
//
// - ALL        — the 7 "active" statuses (excludes closed-out ARCHIVED
//                + DECLINED). Default view.
// - INBOX      — NEW only. Reads literally as "unread" — items you have
//                never touched. Count tracks actual pending work.
// - CUSTOM     — user-picked set via the Customize panel; includes the
//                full lifecycle range plus closed-out statuses.
const TRIAGE_STATUSES = ['NEW'] as const;
const ROADMAP_STATUSES = ['UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'SHIPPED'] as const;
const ALL_ACTIVE_STATUSES: string[] = [
  'NEW',
  'REVIEWED',
  'ADDRESSED',
  'UNDER_REVIEW',
  'PLANNED',
  'IN_PROGRESS',
  'SHIPPED',
];
const ALL_STATUSES = [
  'NEW',
  'REVIEWED',
  'ADDRESSED',
  'ARCHIVED',
  'UNDER_REVIEW',
  'PLANNED',
  'IN_PROGRESS',
  'SHIPPED',
  'DECLINED',
];

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  REVIEWED: 'Reviewed',
  ADDRESSED: 'Addressed',
  ARCHIVED: 'Archived',
  UNDER_REVIEW: 'Under review',
  PLANNED: 'Planned',
  IN_PROGRESS: 'In progress',
  SHIPPED: 'Shipped',
  DECLINED: 'Declined',
};

type TabKey = 'all' | 'inbox' | 'custom';

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((v) => setB.has(v));
}

// Resolve the active tab from the current status selection. Matches a
// preset when the user's set exactly equals it; otherwise falls through
// to 'custom' so the customize panel can steer them.
function tabFromStatuses(statuses: string[]): TabKey {
  if (sameSet(statuses, ALL_ACTIVE_STATUSES)) return 'all';
  if (sameSet(statuses, TRIAGE_STATUSES)) return 'inbox';
  return 'custom';
}

interface ResponsesFilterProps {
  elements?: Element[];
  currentStatus?: string;
  availableTags?: { tag: string; count: number }[];
}

export function ResponsesFilter({
  elements = [],
  currentStatus,
  availableTags = [],
}: ResponsesFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStatuses = useMemo(
    () => (currentStatus ? currentStatus.split(',') : ALL_ACTIVE_STATUSES),
    [currentStatus]
  );

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [elementId, setElementId] = useState(searchParams.get('elementId') || '');
  const [statuses, setStatuses] = useState<string[]>(initialStatuses);
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [tagFocused, setTagFocused] = useState(false);
  const [tagHighlight, setTagHighlight] = useState(-1);
  const [showAdvanced, setShowAdvanced] = useState(Boolean(startDate || endDate || tag));
  const [showCustomize, setShowCustomize] = useState(
    () => tabFromStatuses(initialStatuses) === 'custom'
  );
  const tagInputRef = useRef<HTMLInputElement>(null);

  const activeTab: TabKey = tabFromStatuses(statuses);

  const tagSuggestions =
    tag.trim() && tagFocused
      ? availableTags.filter((t) => t.tag.startsWith(tag.trim().toLowerCase())).slice(0, 6)
      : [];

  // Debounced auto-commit on the free-text search field. 300ms feels
  // responsive without hammering the server on every keystroke, and the
  // debounce cancels cleanly when the user keeps typing. We track the
  // committed search via a ref so we don't re-fire the router when the
  // state rehydrates from the URL on navigation.
  const lastCommittedSearchRef = useRef(search);
  useEffect(() => {
    if (search === lastCommittedSearchRef.current) return;
    const id = setTimeout(() => {
      lastCommittedSearchRef.current = search;
      commit({ search });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // If the URL's search param updates externally (e.g. user hits back or
  // clears filters), sync the committed ref so the effect above doesn't
  // fire spuriously.
  useEffect(() => {
    lastCommittedSearchRef.current = searchParams.get('search') || '';
  }, [searchParams]);

  // Commit filters to the URL. Only reads the caller-supplied overrides
  // so tab clicks can pass a fresh status set without waiting for React
  // state to settle.
  const commit = (override: Partial<{ statuses: string[]; search: string; tag: string }> = {}) => {
    const params = new URLSearchParams();
    const s = override.search ?? search;
    const st = override.statuses ?? statuses;
    const tg = override.tag ?? tag;
    if (s) params.set('search', s);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (elementId && elementId !== '__all__') params.set('elementId', elementId);
    if (st.length > 0) params.set('status', st.join(','));
    if (tg) params.set('tag', tg.trim().toLowerCase());
    params.set('page', '1');
    router.push(`/dashboard/responses?${params.toString()}`);
  };

  const selectTab = (tab: TabKey) => {
    let next: string[];
    if (tab === 'all') next = [...ALL_ACTIVE_STATUSES];
    else if (tab === 'inbox') next = [...TRIAGE_STATUSES];
    else {
      // 'custom' — only reachable via Customize toggle; keep current set
      setShowCustomize(true);
      return;
    }
    setStatuses(next);
    setShowCustomize(false);
    commit({ statuses: next });
  };

  const toggleStatus = (s: string) => {
    const next = statuses.includes(s)
      ? statuses.filter((x) => x !== s)
      : [...statuses, s];
    setStatuses(next);
    commit({ statuses: next });
  };

  const handleClear = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setElementId('');
    setStatuses(ALL_ACTIVE_STATUSES);
    setTag('');
    setShowAdvanced(false);
    setShowCustomize(false);
    router.push('/dashboard/responses');
  };

  const hasFilters =
    Boolean(search) ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    Boolean(elementId) ||
    Boolean(tag) ||
    activeTab !== 'all';

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'inbox', label: 'Inbox' },
  ];

  return (
    <div className="mb-6 overflow-hidden rounded-md border border-editorial-neutral-2 bg-editorial-paper">
      {/* Tab bar — primary status control. Ink underline on active tab.
          No count suffix: preset-size numbers read as item counts and
          mislead; the page header carries the actual filtered total. */}
      <div className="flex items-center gap-1 border-b border-editorial-neutral-2 px-3 pt-1">
        <div className="flex items-center">
          {tabs.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => selectTab(t.key)}
                aria-pressed={active}
                className={`relative flex h-10 items-center px-3 text-[13px] transition-colors duration-240 ease-page-turn ${
                  active
                    ? 'text-editorial-ink'
                    : 'text-editorial-neutral-3 hover:text-editorial-ink'
                }`}
              >
                <span>{t.label}</span>
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 bottom-0 h-px bg-editorial-ink"
                  />
                )}
              </button>
            );
          })}
          {activeTab === 'custom' && (
            <span className="relative ml-2 flex h-10 items-center px-3 text-[13px] text-editorial-ink">
              <span>Custom</span>
              <span
                aria-hidden="true"
                className="absolute inset-x-3 bottom-0 h-px bg-editorial-ink"
              />
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowCustomize((v) => !v)}
          aria-expanded={showCustomize}
          aria-controls="responses-filter-customize"
          className="ml-auto flex h-10 items-center gap-1.5 text-[12px] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="3" cy="4" r="1.25" stroke="currentColor" strokeWidth="1" />
            <circle cx="9" cy="8" r="1.25" stroke="currentColor" strokeWidth="1" />
            <path d="M4.25 4H10.5M1.5 8h5.25" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          {showCustomize ? 'Hide' : 'Customize'}
        </button>
      </div>

      {/* Customize panel — individual status checkboxes. Toggling any
          commits immediately and switches to the custom tab. Includes the
          closed-out statuses (ARCHIVED + DECLINED) for anyone who wants
          to see them. */}
      {showCustomize && (
        <div
          id="responses-filter-customize"
          className="flex flex-wrap items-center gap-3 border-b border-editorial-neutral-2 bg-editorial-ink/[0.015] px-4 py-3"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            Statuses
          </span>
          {ALL_STATUSES.map((s) => {
            const active = statuses.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-[12px] transition-colors ${
                  active
                    ? 'bg-editorial-ink text-editorial-paper'
                    : 'text-editorial-neutral-3 hover:bg-editorial-ink/[0.04] hover:text-editorial-ink'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    active ? 'bg-editorial-paper' : 'bg-editorial-neutral-2'
                  }`}
                />
                {STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
      )}

      {/* Active filter chips — only renders when at least one non-default
          filter is active. Each chip shows the applied value and a
          remove affordance so the user can see at a glance what's
          filtering the results and dismiss individual filters without
          touching Clear. */}
      <ActiveFilterChips
        search={search}
        elementId={elementId}
        tag={tag}
        startDate={startDate}
        endDate={endDate}
        activeTab={activeTab}
        statuses={statuses}
        onRemoveSearch={() => {
          setSearch('');
          commit({ search: '' });
        }}
        onRemoveElement={() => {
          setElementId('');
          const params = new URLSearchParams(Array.from(searchParams.entries()));
          params.delete('elementId');
          params.set('page', '1');
          router.push(`/dashboard/responses?${params.toString()}`);
        }}
        onRemoveTag={() => {
          setTag('');
          commit({ tag: '' });
        }}
        onRemoveDates={() => {
          setStartDate('');
          setEndDate('');
          const params = new URLSearchParams(Array.from(searchParams.entries()));
          params.delete('startDate');
          params.delete('endDate');
          params.set('page', '1');
          router.push(`/dashboard/responses?${params.toString()}`);
        }}
        onRemoveCustomStatus={() => {
          setStatuses(ALL_ACTIVE_STATUSES);
          setShowCustomize(false);
          commit({ statuses: ALL_ACTIVE_STATUSES });
        }}
      />

      {/* Single tidy row — search + element + advanced + clear */}
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <svg
            className="shrink-0 text-editorial-neutral-3"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.25" />
            <path
              d="M9.25 9.25L12 12"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </svg>
          <EditorialInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
            }}
            placeholder="Search feedback…"
            className="h-9 border-transparent bg-transparent px-0 text-[14px] focus:border-transparent focus:ring-0"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={elementId}
            onValueChange={(v) => {
              setElementId(v);
              // Commit on element change; status stays.
              const params = new URLSearchParams(Array.from(searchParams.entries()));
              if (v && v !== '__all__') params.set('elementId', v);
              else params.delete('elementId');
              params.set('page', '1');
              router.push(`/dashboard/responses?${params.toString()}`);
            }}
          >
            <SelectTrigger
              aria-label="Filter by element"
              className="h-9 w-[180px] rounded-md border-editorial-neutral-2 bg-editorial-paper text-[13px] text-editorial-ink focus:border-editorial-accent focus:ring-2 focus:ring-editorial-accent/25"
            >
              <SelectValue placeholder="All elements" />
            </SelectTrigger>
            <SelectContent className="editorial border-editorial-neutral-2 bg-editorial-paper">
              <SelectItem value="__all__">All elements</SelectItem>
              {elements.map((el) => (
                <SelectItem key={el.elementIdRaw} value={el.elementIdRaw}>
                  {el.elementIdRaw} ({el.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
            aria-controls="responses-filter-advanced"
            className={`inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors ${
              showAdvanced
                ? 'bg-editorial-ink/[0.04] text-editorial-ink'
                : 'text-editorial-neutral-3 hover:bg-editorial-ink/[0.04] hover:text-editorial-ink'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M2 3.5H10M3.5 6H8.5M5 8.5H7"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
            </svg>
            Date · Tag
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="h-9 px-2.5 text-[13px] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div
          id="responses-filter-advanced"
          className="flex flex-col gap-3 border-t border-editorial-neutral-2 bg-editorial-ink/[0.02] p-4 sm:flex-row sm:flex-wrap sm:items-center"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
              Range
            </span>
            <DatePicker value={startDate} onChange={setStartDate} placeholder="Start" />
            <span aria-hidden="true" className="text-editorial-neutral-3">
              →
            </span>
            <DatePicker value={endDate} onChange={setEndDate} placeholder="End" />
          </div>

          <div className="relative flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
              Tag
            </span>
            <EditorialInput
              ref={tagInputRef}
              value={tag}
              onChange={(e) => {
                setTag(e.target.value);
                setTagHighlight(-1);
              }}
              onFocus={() => setTagFocused(true)}
              onBlur={() => setTimeout(() => setTagFocused(false), 150)}
              onKeyDown={(e) => {
                if (tagSuggestions.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setTagHighlight((i) => (i < tagSuggestions.length - 1 ? i + 1 : 0));
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setTagHighlight((i) => (i > 0 ? i - 1 : tagSuggestions.length - 1));
                    return;
                  }
                  if (e.key === 'Enter' && tagHighlight >= 0) {
                    e.preventDefault();
                    const picked = tagSuggestions[tagHighlight].tag;
                    setTag(picked);
                    setTagFocused(false);
                    setTagHighlight(-1);
                    commit({ tag: picked });
                    return;
                  }
                }
                if (e.key === 'Enter') commit();
              }}
              placeholder="Filter by tag"
              className="h-9 w-[180px]"
            />
            {tagSuggestions.length > 0 && (
              <div className="absolute left-14 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-md border border-editorial-neutral-2 bg-editorial-paper shadow-[0_8px_24px_rgba(26,23,20,0.08)]">
                {tagSuggestions.map((s, i) => (
                  <button
                    key={s.tag}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setTag(s.tag);
                      setTagFocused(false);
                      setTagHighlight(-1);
                      commit({ tag: s.tag });
                    }}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition-colors ${
                      i === tagHighlight
                        ? 'bg-editorial-accent/10 text-editorial-ink'
                        : 'text-editorial-neutral-3 hover:bg-editorial-ink/[0.03] hover:text-editorial-ink'
                    }`}
                  >
                    <span>{s.tag}</span>
                    <span className="font-mono text-[11px] text-editorial-neutral-3">
                      {s.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <EditorialButton onClick={() => commit()} variant="ink" size="sm" className="h-9">
            Apply
          </EditorialButton>
        </div>
      )}
    </div>
  );
}

// ── Active filter chips ──────────────────────────────────────
//
// Small pills showing each applied filter. Only renders the chip strip
// when at least one chip is present so the filter bar stays quiet when
// nothing is applied. Each chip has a muted × that dismisses just that
// filter — faster than Clear-all when the user only wants to drop one.

interface ActiveFilterChipsProps {
  search: string;
  elementId: string;
  tag: string;
  startDate: string;
  endDate: string;
  activeTab: TabKey;
  statuses: string[];
  onRemoveSearch: () => void;
  onRemoveElement: () => void;
  onRemoveTag: () => void;
  onRemoveDates: () => void;
  onRemoveCustomStatus: () => void;
}

function ActiveFilterChips({
  search,
  elementId,
  tag,
  startDate,
  endDate,
  activeTab,
  statuses,
  onRemoveSearch,
  onRemoveElement,
  onRemoveTag,
  onRemoveDates,
  onRemoveCustomStatus,
}: ActiveFilterChipsProps) {
  const chips: { key: string; label: string; value: string; onRemove: () => void }[] = [];

  if (search.trim()) {
    chips.push({
      key: 'search',
      label: 'Search',
      value: `"${search.trim()}"`,
      onRemove: onRemoveSearch,
    });
  }
  if (elementId && elementId !== '__all__') {
    chips.push({
      key: 'element',
      label: 'Element',
      value: elementId,
      onRemove: onRemoveElement,
    });
  }
  if (tag) {
    chips.push({
      key: 'tag',
      label: 'Tag',
      value: tag,
      onRemove: onRemoveTag,
    });
  }
  if (startDate || endDate) {
    const left = startDate ? new Date(startDate).toLocaleDateString() : '…';
    const right = endDate ? new Date(endDate).toLocaleDateString() : '…';
    chips.push({
      key: 'dates',
      label: 'Range',
      value: `${left} → ${right}`,
      onRemove: onRemoveDates,
    });
  }
  if (activeTab === 'custom') {
    chips.push({
      key: 'status',
      label: 'Status',
      value: `${statuses.length} selected`,
      onRemove: onRemoveCustomStatus,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-editorial-neutral-2 bg-editorial-ink/[0.015] px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
        Filtering by
      </span>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-md border border-editorial-neutral-2 bg-editorial-paper pl-2.5 pr-1 text-[12px] text-editorial-ink"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3">
            {chip.label}
          </span>
          <span className="max-w-[180px] truncate">{chip.value}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove ${chip.label.toLowerCase()} filter`}
            className="inline-flex h-5 w-5 items-center justify-center rounded text-editorial-neutral-3 transition-colors hover:bg-editorial-ink/[0.06] hover:text-editorial-ink"
          >
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path
                d="M2 2L8 8M2 8L8 2"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );
}

