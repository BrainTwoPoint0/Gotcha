'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Select } from '@/app/components/Select';

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface Element {
  elementIdRaw: string;
  count: number;
}

interface AnalyticsFilterProps {
  projects: Project[];
  elements?: Element[];
}

export function AnalyticsFilter({ projects, elements = [] }: AnalyticsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [projectId, setProjectId] = useState(searchParams.get('projectId') || '');
  const [elementId, setElementId] = useState(searchParams.get('elementId') || '');

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (projectId) params.set('projectId', projectId);
    if (elementId) params.set('elementId', elementId);

    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setProjectId('');
    setElementId('');
    router.push('/dashboard/analytics');
  };

  const hasFilters = startDate || endDate || projectId || elementId;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
        <Select
          label="Project"
          value={projectId}
          onChange={(e) => setProjectId((e.target as HTMLSelectElement).value)}
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>

        <Select
          label="Element"
          value={elementId}
          onChange={(e) => setElementId((e.target as HTMLSelectElement).value)}
        >
          <option value="">All Elements</option>
          {elements.map((el) => (
            <option key={el.elementIdRaw} value={el.elementIdRaw}>
              {el.elementIdRaw} ({el.count})
            </option>
          ))}
        </Select>

        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:ring-slate-500"
          />
        </div>

        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:ring-slate-500"
          />
        </div>

        <div className="flex gap-2 sm:gap-4">
          <button
            onClick={applyFilters}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-md hover:bg-slate-800 min-h-[44px] sm:min-h-0"
          >
            Apply
          </button>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900 min-h-[44px] sm:min-h-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
