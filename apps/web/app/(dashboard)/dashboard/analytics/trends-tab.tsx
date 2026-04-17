'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  EDITORIAL,
  CHART_TICK,
  CHART_AXIS_LINE,
  TOOLTIP_STYLE,
  EditorialCard,
  ChartFrame,
} from './editorial-chart';

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

type Metric = 'avgRating' | 'positiveRate' | 'npsScore';

const METRICS: {
  key: Metric;
  eyebrow: string;
  title: string;
  domain: [number, number];
  ticks?: number[];
  formatter: (v: number) => string;
}[] = [
  {
    key: 'avgRating',
    eyebrow: 'Rating',
    title: 'Average rating over time',
    domain: [0, 5],
    ticks: [1, 2, 3, 4, 5],
    formatter: (v) => `${v.toFixed(1)} / 5`,
  },
  {
    key: 'positiveRate',
    eyebrow: 'Sentiment',
    title: 'Positive rate over time',
    domain: [0, 100],
    formatter: (v) => `${Math.round(v)}%`,
  },
  {
    key: 'npsScore',
    eyebrow: 'NPS',
    title: 'NPS over time',
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
      <EditorialCard>
        <p className="py-10 text-center text-[13px] text-editorial-neutral-3">Loading charts…</p>
      </EditorialCard>
    );
  }

  const availableMetrics = METRICS.filter((m) => data.some((d) => d[m.key] !== null));

  if (availableMetrics.length === 0) {
    return (
      <EditorialCard>
        <div className="py-10 text-center">
          <p className="text-[14px] text-editorial-ink">No trend data</p>
          <p className="mt-1.5 text-[13px] text-editorial-neutral-3">
            Rating, vote, and NPS trends will appear once you have enough data over multiple days.
          </p>
        </div>
      </EditorialCard>
    );
  }

  return (
    <div className="space-y-6">
      {availableMetrics.map((metric) => {
        const chartData = data
          .filter((d) => d[metric.key] !== null)
          .map((d) => ({
            date: d.date,
            value: d[metric.key] as number,
            responses: d.responseCount,
          }));

        if (chartData.length < 2) return null;

        return (
          <EditorialCard
            key={metric.key}
            eyebrow={metric.eyebrow}
            title={metric.title}
            subtitle={`${chartData.length} data points`}
          >
            <ChartFrame height="sm">
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: -4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 3" stroke={EDITORIAL.rule} />
                <XAxis
                  dataKey="date"
                  tick={CHART_TICK}
                  tickLine={false}
                  axisLine={CHART_AXIS_LINE}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={metric.domain}
                  ticks={metric.ticks}
                  tick={CHART_TICK}
                  tickLine={false}
                  axisLine={CHART_AXIS_LINE}
                  tickFormatter={metric.formatter}
                  width={60}
                />
                <Tooltip
                  cursor={{ stroke: EDITORIAL.rule, strokeWidth: 1 }}
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number) => [metric.formatter(value), metric.title]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={EDITORIAL.ink}
                  strokeWidth={1.5}
                  dot={
                    chartData.length <= 30 ? { fill: EDITORIAL.ink, r: 2, strokeWidth: 0 } : false
                  }
                  activeDot={{
                    r: 4,
                    fill: EDITORIAL.accent,
                    stroke: EDITORIAL.paper,
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ChartFrame>
          </EditorialCard>
        );
      })}
    </div>
  );
}
