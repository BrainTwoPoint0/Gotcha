'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef } from 'react';
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

const TRIAGE_STATUSES = ['NEW', 'REVIEWED', 'ADDRESSED', 'ARCHIVED'] as const;
const LIFECYCLE_STATUSES = [
  'UNDER_REVIEW',
  'PLANNED',
  'IN_PROGRESS',
  'SHIPPED',
  'DECLINED',
] as const;
const DEFAULT_STATUSES = [
  'NEW',
  'REVIEWED',
  'ADDRESSED',
  'UNDER_REVIEW',
  'PLANNED',
  'IN_PROGRESS',
  'SHIPPED',
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

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [elementId, setElementId] = useState(searchParams.get('elementId') || '');
  const [statuses, setStatuses] = useState<string[]>(
    currentStatus ? currentStatus.split(',') : DEFAULT_STATUSES
  );
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [tagFocused, setTagFocused] = useState(false);
  const [tagHighlight, setTagHighlight] = useState(-1);
  const [showAdvanced, setShowAdvanced] = useState(Boolean(startDate || endDate || tag));
  const tagInputRef = useRef<HTMLInputElement>(null);

  const tagSuggestions =
    tag.trim() && tagFocused
      ? availableTags.filter((t) => t.tag.startsWith(tag.trim().toLowerCase())).slice(0, 6)
      : [];

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (elementId && elementId !== '__all__') params.set('elementId', elementId);
    if (statuses.length > 0) params.set('status', statuses.join(','));
    if (tag) params.set('tag', tag.trim().toLowerCase());
    params.set('page', '1');
    router.push(`/dashboard/responses?${params.toString()}`);
  };

  const handleClear = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setElementId('');
    setStatuses(DEFAULT_STATUSES);
    setTag('');
    setShowAdvanced(false);
    router.push('/dashboard/responses');
  };

  const toggleStatus = (s: string) => {
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const hasFilters =
    search ||
    startDate ||
    endDate ||
    elementId ||
    tag ||
    statuses.length !== DEFAULT_STATUSES.length ||
    !DEFAULT_STATUSES.every((s) => statuses.includes(s));

  return (
    <div className="mb-6 overflow-hidden rounded-md border border-editorial-neutral-2 bg-editorial-paper">
      {/* Primary row — search + element + status + actions — always visible */}
      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
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
              if (e.key === 'Enter') handleFilter();
            }}
            placeholder="Search feedback…"
            className="h-9 border-transparent bg-transparent px-0 text-[14px] focus:border-transparent focus:ring-0"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={elementId} onValueChange={setElementId}>
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

          <div
            role="group"
            aria-label="Filter by status"
            className="flex flex-wrap items-center gap-0.5 rounded-md border border-editorial-neutral-2 p-0.5"
          >
            <span
              aria-hidden="true"
              className="pl-2 pr-1 font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3"
            >
              Inbox
            </span>
            {TRIAGE_STATUSES.map((s) => {
              const active = statuses.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStatus(s)}
                  aria-pressed={active}
                  className={`h-8 rounded px-2.5 text-[12px] transition-colors duration-240 ease-page-turn ${
                    active
                      ? 'bg-editorial-ink text-editorial-paper'
                      : 'text-editorial-neutral-3 hover:bg-editorial-ink/[0.04] hover:text-editorial-ink'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              );
            })}
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-editorial-neutral-2" />
            <span
              aria-hidden="true"
              className="pl-1 pr-1 font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3"
            >
              Roadmap
            </span>
            {LIFECYCLE_STATUSES.map((s) => {
              const active = statuses.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStatus(s)}
                  aria-pressed={active}
                  className={`h-8 rounded px-2.5 text-[12px] transition-colors duration-240 ease-page-turn ${
                    active
                      ? 'bg-editorial-ink text-editorial-paper'
                      : 'text-editorial-neutral-3 hover:bg-editorial-ink/[0.04] hover:text-editorial-ink'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              );
            })}
          </div>

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

          <EditorialButton onClick={handleFilter} variant="ink" size="sm" className="h-9">
            Apply filters
          </EditorialButton>

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
                    setTag(tagSuggestions[tagHighlight].tag);
                    setTagFocused(false);
                    setTagHighlight(-1);
                    return;
                  }
                }
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
        </div>
      )}
    </div>
  );
}
