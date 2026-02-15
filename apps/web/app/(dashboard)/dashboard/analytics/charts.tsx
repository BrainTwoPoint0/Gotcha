'use client';

import { useEffect, useState } from 'react';
import { Gotcha } from 'gotcha-feedback';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TrendDataPoint {
  date: string;
  responses: number;
}

interface ModeDataPoint {
  name: string;
  value: number;
}

interface SentimentDataPoint {
  name: string;
  value: number;
  color: string;
}

interface RatingDataPoint {
  date: string;
  rating: number;
}

interface PollBreakdownData {
  elementId: string;
  options: { name: string; count: number }[];
}

interface ElementPerformanceData {
  elementId: string;
  total: number;
  avgRating: number | null;
  positiveRate: number | null;
}

interface AnalyticsChartsProps {
  trendData: TrendDataPoint[];
  modeData: ModeDataPoint[];
  sentimentData: SentimentDataPoint[];
  avgRatingData: RatingDataPoint[];
  pollData: PollBreakdownData[];
  elementPerformance: ElementPerformanceData[];
}

const MODE_COLORS: Record<string, string> = {
  feedback: '#64748b',
  vote: '#22c55e',
  poll: '#a855f7',
  'feature request': '#f97316',
  ab: '#ec4899',
};

export function AnalyticsCharts({
  trendData,
  modeData,
  sentimentData,
  avgRatingData,
  pollData,
  elementPerformance,
}: AnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasData = trendData.some((d) => d.responses > 0);

  if (!mounted) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-400">Loading charts...</p>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No response data in the last 30 days.</p>
        <p className="text-sm text-gray-400 mt-1">
          Charts will appear once you start collecting feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Response Trends */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Trends</h3>
        <div className="h-48 sm:h-64 min-h-[192px] sm:min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              <Line
                type="monotone"
                dataKey="responses"
                stroke="#64748b"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mode Distribution */}
        {modeData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Types</h3>
            <div className="h-48 sm:h-64 min-h-[192px] sm:min-h-[256px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <BarChart data={modeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={100}
                    tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {modeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MODE_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Sentiment Breakdown */}
        {sentimentData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vote Sentiment</h3>
            <div className="h-48 sm:h-64 min-h-[192px] sm:min-h-[256px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Poll Results */}
      {pollData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Poll Results</h3>
          {pollData.map((poll) => (
            <div
              key={poll.elementId}
              className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6"
            >
              <p className="text-sm font-medium text-gray-500 mb-3">{poll.elementId}</p>
              <div className="h-48 sm:h-64 min-h-[192px] sm:min-h-[256px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                  <BarChart data={poll.options} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                      }}
                    />
                    <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Average Rating Over Time */}
      {avgRatingData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Average Rating Over Time</h3>
            <Gotcha
              elementId="analytics-avg-rating"
              mode="poll"
              options={['Insightful', 'Not useful']}
              position="inline"
              theme="light"
              showOnHover={false}
              size="sm"
              promptText="Is this chart insightful?"
            />
          </div>
          <div className="h-48 sm:h-64 min-h-[192px] sm:min-h-[256px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <LineChart data={avgRatingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  domain={[0, 5]}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  ticks={[1, 2, 3, 4, 5]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                  }}
                  formatter={(value) => [`${value ?? 0}/5`, 'Rating']}
                />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="#eab308"
                  strokeWidth={2}
                  dot={{ fill: '#eab308', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Element Performance */}
      {elementPerformance.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Element Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Element ID</th>
                  <th className="text-right py-2 px-4 font-medium text-gray-500">Responses</th>
                  <th className="text-right py-2 px-4 font-medium text-gray-500">Avg Rating</th>
                  <th className="text-right py-2 pl-4 font-medium text-gray-500">Positive Rate</th>
                </tr>
              </thead>
              <tbody>
                {elementPerformance.map((el) => (
                  <tr key={el.elementId} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-900 font-medium">{el.elementId}</td>
                    <td className="py-2 px-4 text-right text-gray-700">{el.total}</td>
                    <td className="py-2 px-4 text-right text-gray-700">
                      {el.avgRating !== null ? `${el.avgRating}/5` : '-'}
                    </td>
                    <td className="py-2 pl-4 text-right text-gray-700">
                      {el.positiveRate !== null ? `${el.positiveRate}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
