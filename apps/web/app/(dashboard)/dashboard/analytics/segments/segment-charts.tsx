'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Gotcha } from 'gotcha-feedback';
import { Select } from '@/app/components/Select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface Element {
  elementIdRaw: string;
  count: number;
}

interface Field {
  key: string;
  displayName: string;
}

interface SegmentDataPoint {
  segment: string;
  count: number;
  avgRating: number | null;
  positiveRate: number | null;
}

interface SegmentChartsProps {
  projects: Project[];
  elements: Element[];
  availableFields: Field[];
  segmentData: SegmentDataPoint[];
  selectedProjectId?: string;
  selectedElementId?: string;
  selectedGroupBy?: string;
}

const COLORS = ['#64748b', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function SegmentCharts({
  projects,
  elements,
  availableFields,
  segmentData,
  selectedProjectId,
  selectedElementId,
  selectedGroupBy,
}: SegmentChartsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  const [projectId, setProjectId] = useState(selectedProjectId || '');
  const [elementId, setElementId] = useState(selectedElementId || '');
  const [groupBy, setGroupBy] = useState(selectedGroupBy || '');

  useEffect(() => {
    setMounted(true);
  }, []);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (projectId) params.set('projectId', projectId);
    if (elementId) params.set('elementId', elementId);
    if (groupBy) params.set('groupBy', groupBy);
    router.push(`/dashboard/analytics/segments?${params.toString()}`);
  };

  const hasData = segmentData.length > 0;

  // Prepare chart data
  const countData = segmentData.map((d) => ({
    name: d.segment,
    value: d.count,
  }));

  const ratingData = segmentData
    .filter((d) => d.avgRating !== null)
    .map((d) => ({
      name: d.segment,
      value: d.avgRating,
    }));

  const sentimentData = segmentData
    .filter((d) => d.positiveRate !== null)
    .map((d) => ({
      name: d.segment,
      value: d.positiveRate,
    }));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
          <Select label="Project" value={projectId} onChange={(e) => setProjectId((e.target as HTMLSelectElement).value)}>
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>

          <Select label="Element" value={elementId} onChange={(e) => setElementId((e.target as HTMLSelectElement).value)}>
            <option value="">All Elements</option>
            {elements.map((el) => (
              <option key={el.elementIdRaw} value={el.elementIdRaw}>
                {el.elementIdRaw} ({el.count})
              </option>
            ))}
          </Select>

          <Select label="Group By" value={groupBy} onChange={(e) => setGroupBy((e.target as HTMLSelectElement).value)}>
            <option value="">Select a field</option>
            {availableFields.map((field) => (
              <option key={field.key} value={field.key}>
                {field.displayName}
              </option>
            ))}
          </Select>

          <button
            onClick={applyFilters}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-md hover:bg-slate-800 min-h-[44px] sm:min-h-0"
          >
            Apply
          </button>
        </div>
      </div>

      {availableFields.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No user metadata found</h3>
          <p className="text-gray-600 mb-4">
            To use segmentation, pass user attributes when collecting feedback:
          </p>
          <pre className="bg-slate-800 text-slate-100 rounded-lg p-4 text-left text-sm overflow-x-auto">
            {`<Gotcha
  elementId="feature-x"
  user={{
    id: 'user_123',
    plan: 'pro',
    location: 'US',
    age: 28
  }}
/>`}
          </pre>
        </div>
      )}

      {!hasData && availableFields.length > 0 && groupBy && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No response data for the selected filters.</p>
        </div>
      )}

      {!mounted && hasData && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-400">Loading charts...</p>
        </div>
      )}

      {mounted && hasData && (
        <>
          {/* Response Volume by Segment */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Response Volume by Segment</h3>
              <Gotcha elementId="segments-volume-chart" mode="vote" position="inline" theme="light" showOnHover={false} size="sm" promptText="Is this chart useful?" />
            </div>
            <div className="h-48 sm:h-64 min-h-[192px] sm:min-h-[256px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <BarChart data={countData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {countData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Average Rating by Segment */}
            {ratingData.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Avg Rating by Segment</h3>
                  <Gotcha elementId="segments-rating-chart" mode="vote" position="inline" theme="light" showOnHover={false} size="sm" promptText="Is this chart useful?" />
                </div>
                <div className="h-48 sm:h-64 min-h-[192px] sm:min-h-[256px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                    <BarChart data={ratingData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, 5]} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                        }}
                        formatter={(value) => [`${value ?? 0}/5`, 'Rating']}
                      />
                      <Bar dataKey="value" fill="#eab308" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Positive Rate by Segment */}
            {sentimentData.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Positive Rate by Segment</h3>
                  <Gotcha elementId="segments-sentiment-chart" mode="vote" position="inline" theme="light" showOnHover={false} size="sm" promptText="Is this chart useful?" />
                </div>
                <div className="h-48 sm:h-64 min-h-[192px] sm:min-h-[256px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                    <BarChart data={sentimentData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                        }}
                        formatter={(value) => [`${value ?? 0}%`, 'Positive']}
                      />
                      <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Segment Comparison</h3>
                <Gotcha elementId="segments-comparison-table" mode="vote" position="inline" theme="light" showOnHover={false} size="sm" promptText="Is this table useful?" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Segment
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responses
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Rating
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Positive Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {segmentData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.segment}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.count}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.avgRating !== null ? `${row.avgRating}/5` : '-'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.positiveRate !== null ? `${row.positiveRate}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
