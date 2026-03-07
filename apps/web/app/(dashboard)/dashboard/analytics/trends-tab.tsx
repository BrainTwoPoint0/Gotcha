'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ── Types ────────────────────────────────────────────────────────────

interface TrendDataPoint {
  date: string;
  avgRating: number | null;
  positiveRate: number | null;
  npsScore: number | null;
  responseCount: number;
}

interface TrendsTabProps {
  data: TrendDataPoint[];
}

// ── Component ────────────────────────────────────────────────────────

type Metric = 'avgRating' | 'positiveRate' | 'npsScore';

const METRICS: { key: Metric; label: string; color: string; domain: [number, number]; formatter: (v: number) => string }[] = [
  {
    key: 'avgRating',
    label: 'Avg Rating',
    color: '#eab308',
    domain: [0, 5],
    formatter: (v) => `${v.toFixed(1)}/5`,
  },
  {
    key: 'positiveRate',
    label: 'Positive Rate',
    color: '#22c55e',
    domain: [0, 100],
    formatter: (v) => `${Math.round(v)}%`,
  },
  {
    key: 'npsScore',
    label: 'NPS Score',
    color: '#14b8a6',
    domain: [-100, 100],
    formatter: (v) => `${Math.round(v)}`,
  },
];

export function TrendsTab({ data }: TrendsTabProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-500">Loading charts...</p>
      </Card>
    );
  }

  // Filter to metrics that have data
  const availableMetrics = METRICS.filter((m) =>
    data.some((d) => d[m.key] !== null)
  );

  if (availableMetrics.length === 0) {
    return (
      <Card className="text-center py-16">
        <h3 className="text-lg font-medium text-gray-900">No trend data</h3>
        <p className="mt-2 text-gray-500">
          Rating, vote, and NPS trends will appear once you have enough data over multiple days.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {availableMetrics.map((metric) => {
        // Filter data points that have this metric
        const chartData = data
          .filter((d) => d[metric.key] !== null)
          .map((d) => ({
            date: d.date,
            value: d[metric.key] as number,
            responses: d.responseCount,
          }));

        if (chartData.length < 2) return null;

        return (
          <Card key={metric.key}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{metric.label} Over Time</CardTitle>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span
                    className="w-3 h-0.5 rounded-full inline-block"
                    style={{ backgroundColor: metric.color }}
                  />
                  {chartData.length} data points
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-56 min-h-[192px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={192}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={metric.domain}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickFormatter={(v) => metric.formatter(v)}
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [metric.formatter(value), metric.label]}
                      labelFormatter={(label) => label}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={metric.color}
                      strokeWidth={2}
                      dot={chartData.length <= 30 ? { fill: metric.color, r: 3 } : false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
