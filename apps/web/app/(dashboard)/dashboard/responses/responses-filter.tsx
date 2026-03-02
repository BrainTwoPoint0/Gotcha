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

interface Element {
  elementIdRaw: string;
  count: number;
}

interface ResponsesFilterProps {
  elements?: Element[];
}

export function ResponsesFilter({ elements = [] }: ResponsesFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [elementId, setElementId] = useState(searchParams.get('elementId') || '');

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (elementId && elementId !== '__all__') params.set('elementId', elementId);
    params.set('page', '1');
    router.push(`/dashboard/responses?${params.toString()}`);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setElementId('');
    router.push('/dashboard/responses');
  };

  const hasFilters = startDate || endDate || elementId;

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
