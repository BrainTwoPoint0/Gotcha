'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface AnalyticsFilterProps {
  projects: Project[];
}

export function AnalyticsFilter({ projects }: AnalyticsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [projectId, setProjectId] = useState(searchParams.get('projectId') || '');

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (projectId) params.set('projectId', projectId);

    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setProjectId('');
    router.push('/dashboard/analytics');
  };

  const hasFilters = startDate || endDate || projectId;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[180px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-[9px] text-sm text-gray-900 focus:border-slate-500 focus:ring-slate-500"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[160px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:ring-slate-500"
          />
        </div>

        <div className="min-w-[160px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:ring-slate-500"
          />
        </div>

        <button
          onClick={applyFilters}
          className="px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-md hover:bg-slate-800"
        >
          Apply
        </button>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
