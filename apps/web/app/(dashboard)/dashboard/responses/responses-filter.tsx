'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
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
}

export function ResponsesFilter({ elements = [], currentStatus }: ResponsesFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [elementId, setElementId] = useState(searchParams.get('elementId') || '');
  const [statuses, setStatuses] = useState<string[]>(
    currentStatus ? currentStatus.split(',') : DEFAULT_STATUSES
  );
  const [tag, setTag] = useState(searchParams.get('tag') || '');

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (elementId && elementId !== '__all__') params.set('elementId', elementId);
    if (statuses.length > 0) params.set('status', statuses.join(','));
    if (tag) params.set('tag', tag.trim().toLowerCase());
    params.set('page', '1');
    router.push(`/dashboard/responses?${params.toString()}`);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setElementId('');
    setStatuses(DEFAULT_STATUSES);
    setTag('');
    router.push('/dashboard/responses');
  };

  const toggleStatus = (s: string) => {
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const hasFilters = startDate || endDate || elementId || tag ||
    (statuses.length !== DEFAULT_STATUSES.length || !DEFAULT_STATUSES.every((s) => statuses.includes(s)));

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 mb-6 p-4 bg-white rounded-lg border border-gray-200">
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
                  ${active
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
        <Input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Filter by tag"
          className="w-full sm:w-[160px]"
        />
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
