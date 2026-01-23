'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

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
    if (elementId) params.set('elementId', elementId);
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
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-gray-700 mb-1">Element</label>
        <select
          value={elementId}
          onChange={(e) => setElementId(e.target.value)}
          className="w-full sm:w-auto sm:min-w-[140px] h-[38px] px-3 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:ring-slate-500 focus:border-slate-500"
        >
          <option value="">All Elements</option>
          {elements.map((el) => (
            <option key={el.elementIdRaw} value={el.elementIdRaw}>
              {el.elementIdRaw} ({el.count})
            </option>
          ))}
        </select>
      </div>
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full sm:w-auto h-[38px] px-3 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:ring-slate-500 focus:border-slate-500"
        />
      </div>
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full sm:w-auto h-[38px] px-3 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:ring-slate-500 focus:border-slate-500"
        />
      </div>
      <div className="flex gap-2 sm:gap-4">
        <button
          onClick={handleFilter}
          className="flex-1 sm:flex-none px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 min-h-[44px] sm:min-h-0"
        >
          Apply Filter
        </button>
        {hasFilters && (
          <button
            onClick={handleClear}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm min-h-[44px] sm:min-h-0"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
