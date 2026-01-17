'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function ResponsesFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('page', '1');
    router.push(`/dashboard/responses?${params.toString()}`);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    router.push('/dashboard/responses');
  };

  const hasFilters = startDate || endDate;

  return (
    <div className="flex flex-wrap items-end gap-4 mb-6 p-4 bg-white rounded-lg border border-gray-200">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-slate-500 focus:border-slate-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-slate-500 focus:border-slate-500"
        />
      </div>
      <button
        onClick={handleFilter}
        className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
      >
        Apply Filter
      </button>
      {hasFilters && (
        <button
          onClick={handleClear}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          Clear
        </button>
      )}
    </div>
  );
}
