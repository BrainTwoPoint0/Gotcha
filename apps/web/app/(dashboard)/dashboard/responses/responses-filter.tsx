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
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';

interface Element {
  elementIdRaw: string;
  count: number;
}

const ALL_STATUSES = ['NEW', 'REVIEWED', 'ADDRESSED', 'ARCHIVED'] as const;
const DEFAULT_STATUSES = ['NEW', 'REVIEWED', 'ADDRESSED'];

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  REVIEWED: 'Reviewed',
  ADDRESSED: 'Addressed',
  ARCHIVED: 'Archived',
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
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 mb-6 p-4 bg-white rounded-lg border border-gray-200">
      <div className="w-full sm:w-auto space-y-1">
        <Label>Search</Label>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleFilter();
          }}
          placeholder="Search feedback..."
          className="w-full sm:w-[200px]"
        />
      </div>
      <div className="w-full sm:w-auto space-y-1">
        <Label>Element</Label>
        <Select value={elementId} onValueChange={setElementId}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="All Elements" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Elements</SelectItem>
            {elements.map((el) => (
              <SelectItem key={el.elementIdRaw} value={el.elementIdRaw}>
                {el.elementIdRaw} ({el.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full sm:w-auto space-y-1">
        <Label>Status</Label>
        <div className="flex gap-1">
          {ALL_STATUSES.map((s) => {
            const active = statuses.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                className={`
                  px-2.5 h-9 text-xs font-medium rounded-md border
                  transition-all duration-100
                  ${
                    active
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-400 border-gray-200 hover:text-gray-600 hover:border-gray-300'
                  }
                `}
              >
                {STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>
      <div className="w-full sm:w-auto space-y-1">
        <Label>Tag</Label>
        <div className="relative">
          <Input
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
            className="w-full sm:w-[160px]"
          />
          {tagSuggestions.length > 0 && (
            <div className="absolute top-full left-0 z-50 mt-1 min-w-[160px] bg-white border border-gray-200 rounded-md shadow-lg py-1">
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
                  className={`
                    w-full text-left px-2.5 py-1.5 text-sm flex items-center justify-between gap-3
                    ${i === tagHighlight ? 'bg-sky-50 text-sky-700' : 'text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  <span>{s.tag}</span>
                  <span className="text-xs text-gray-400">{s.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="w-full sm:w-auto space-y-1">
        <Label>Start Date</Label>
        <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" />
      </div>
      <div className="w-full sm:w-auto space-y-1">
        <Label>End Date</Label>
        <DatePicker value={endDate} onChange={setEndDate} placeholder="End date" />
      </div>
      <div className="flex gap-2 sm:gap-4">
        <Button onClick={handleFilter} className="flex-1 sm:flex-none">
          Apply Filter
        </Button>
        {hasFilters && (
          <Button variant="ghost" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
