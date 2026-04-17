'use client';

import { useEffect, useState } from 'react';
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
} from 'recharts';
import {
  EDITORIAL,
  CHART_TICK,
  CHART_AXIS_LINE,
  TOOLTIP_STYLE,
  TOOLTIP_CURSOR,
  EditorialCard,
  ChartFrame,
  TableHead,
  TableCell,
  npsFill,
  truncateLabel,
} from './editorial-chart';
import { HeatmapChart } from './heatmap-chart';

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

interface NpsResult {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
  total: number;
}

interface RatingDistPoint {
  rating: number;
  count: number;
}

interface HeatmapDataPoint {
  dow: number;
  hour: number;
  count: number;
}

interface AnalyticsChartsProps {
  trendData: TrendDataPoint[];
  modeData: ModeDataPoint[];
  sentimentData: SentimentDataPoint[];
  avgRatingData: RatingDataPoint[];
  pollData: PollBreakdownData[];
  elementPerformance: ElementPerformanceData[];
  npsResult?: NpsResult | null;
  ratingDistribution?: RatingDistPoint[];
  heatmapData?: HeatmapDataPoint[];
}

export function AnalyticsCharts({
  trendData,
  modeData,
  sentimentData,
  avgRatingData,
  pollData,
  elementPerformance,
  npsResult,
  ratingDistribution,
  heatmapData,
}: AnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const hasData = trendData.some((d) => d.responses > 0);

  if (!mounted) {
    return (
      <EditorialCard>
        <p className="py-10 text-center text-[13px] text-editorial-neutral-3">Loading charts…</p>
      </EditorialCard>
    );
  }

  if (!hasData) {
    return (
      <EditorialCard>
        <div className="py-10 text-center">
          <p className="text-[14px] text-editorial-ink">No response data in the last 30 days.</p>
          <p className="mt-1.5 text-[13px] text-editorial-neutral-3">
            Charts will appear once you start collecting feedback.
          </p>
        </div>
      </EditorialCard>
    );
  }

  // Sentiment donut — map the legacy positive/negative colors into the
  // editorial sage/clay semantic tones before passing to <Pie />.
  const sentimentEditorial = sentimentData.map((d) => ({
    ...d,
    fill: /negative|down|dislike/i.test(d.name) ? EDITORIAL.alert : EDITORIAL.success,
  }));
  const sentimentTotal = sentimentEditorial.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Response trends (line) */}
      <EditorialCard eyebrow="Trend" title="Response volume over time">
        <ChartFrame>
          <LineChart data={trendData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 3" stroke={EDITORIAL.rule} />
            <XAxis
              dataKey="date"
              tick={CHART_TICK}
              tickLine={false}
              axisLine={CHART_AXIS_LINE}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={CHART_TICK}
              tickLine={false}
              axisLine={CHART_AXIS_LINE}
              allowDecimals={false}
              width={36}
            />
            <Tooltip
              cursor={{ stroke: EDITORIAL.rule, strokeWidth: 1 }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [String(value), 'Responses']}
            />
            <Line
              type="monotone"
              dataKey="responses"
              stroke={EDITORIAL.ink}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: EDITORIAL.accent, stroke: EDITORIAL.paper, strokeWidth: 2 }}
            />
          </LineChart>
        </ChartFrame>
      </EditorialCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Mode distribution */}
        {modeData.length > 0 && (
          <EditorialCard eyebrow="Mix" title="Response types">
            <ChartFrame>
              <BarChart
                data={modeData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="2 3" stroke={EDITORIAL.rule} horizontal={false} />
                <XAxis
                  type="number"
                  tick={CHART_TICK}
                  tickLine={false}
                  axisLine={CHART_AXIS_LINE}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={CHART_TICK}
                  tickLine={false}
                  axisLine={CHART_AXIS_LINE}
                  width={isMobile ? 80 : 110}
                  tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <Tooltip
                  cursor={TOOLTIP_CURSOR}
                  contentStyle={TOOLTIP_STYLE}
                  labelFormatter={(label: string) => label.charAt(0).toUpperCase() + label.slice(1)}
                  formatter={(value) => [String(value), 'Count']}
                />
                <Bar dataKey="value" radius={[0, 2, 2, 0]} fill={EDITORIAL.ink} />
              </BarChart>
            </ChartFrame>
          </EditorialCard>
        )}

        {/* Sentiment donut */}
        {sentimentEditorial.length > 0 && sentimentTotal > 0 && (
          <EditorialCard eyebrow="Sentiment" title="Vote sentiment">
            <ChartFrame>
              <PieChart>
                <Pie
                  data={sentimentEditorial}
                  cx="50%"
                  cy="50%"
                  innerRadius="48%"
                  outerRadius="75%"
                  paddingAngle={1}
                  dataKey="value"
                  stroke={EDITORIAL.paper}
                  strokeWidth={2}
                >
                  {sentimentEditorial.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number, name: string) => [
                    `${value} response${value !== 1 ? 's' : ''}`,
                    name,
                  ]}
                />
              </PieChart>
            </ChartFrame>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-5">
              {sentimentEditorial.map((item) => {
                const pct =
                  sentimentTotal > 0 ? Math.round((item.value / sentimentTotal) * 100) : 0;
                return (
                  <span key={item.name} className="inline-flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.fill }}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                      {item.name}
                    </span>
                    <span className="font-mono text-[12px] tabular-nums text-editorial-ink">
                      {pct}%
                    </span>
                  </span>
                );
              })}
            </div>
          </EditorialCard>
        )}
      </div>

      {/* Rating distribution */}
      {ratingDistribution && ratingDistribution.some((d) => d.count > 0) && (
        <EditorialCard eyebrow="Rating" title="Rating distribution">
          <ChartFrame height="sm">
            <BarChart data={ratingDistribution} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 3" stroke={EDITORIAL.rule} />
              <XAxis
                dataKey="rating"
                tick={CHART_TICK}
                tickLine={false}
                axisLine={CHART_AXIS_LINE}
                tickFormatter={(v) => `${v}★`}
              />
              <YAxis
                tick={CHART_TICK}
                tickLine={false}
                axisLine={CHART_AXIS_LINE}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                cursor={TOOLTIP_CURSOR}
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: number) => [
                  `${value} response${value !== 1 ? 's' : ''}`,
                  'Count',
                ]}
                labelFormatter={(label) => `${label} star${label !== 1 ? 's' : ''}`}
              />
              <Bar dataKey="count" fill={EDITORIAL.ink} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </EditorialCard>
      )}

      {/* NPS score */}
      {npsResult && (
        <EditorialCard eyebrow="NPS" title="Net Promoter Score">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <div
                className="font-display text-5xl font-normal leading-none tracking-[-0.02em] sm:text-6xl"
                style={{ color: npsFill(npsResult.score) }}
              >
                {npsResult.score}
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                Based on {npsResult.total} response{npsResult.total !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Stacked bar — sage (promoters) / ink (passives) / clay (detractors) */}
            <div className="w-full max-w-xl">
              <div className="flex h-2 overflow-hidden rounded-full border border-editorial-neutral-2 bg-editorial-paper">
                {npsResult.detractorPct > 0 && (
                  <div
                    style={{
                      width: `${npsResult.detractorPct}%`,
                      backgroundColor: EDITORIAL.alert,
                    }}
                    aria-label={`${npsResult.detractors} detractors`}
                  />
                )}
                {npsResult.passivePct > 0 && (
                  <div
                    style={{ width: `${npsResult.passivePct}%`, backgroundColor: EDITORIAL.ink }}
                    aria-label={`${npsResult.passives} passives`}
                  />
                )}
                {npsResult.promoterPct > 0 && (
                  <div
                    style={{
                      width: `${npsResult.promoterPct}%`,
                      backgroundColor: EDITORIAL.success,
                    }}
                    aria-label={`${npsResult.promoters} promoters`}
                  />
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <NpsLegend
                  color={EDITORIAL.alert}
                  label="Detractors"
                  count={npsResult.detractors}
                  pct={npsResult.detractorPct}
                />
                <NpsLegend
                  color={EDITORIAL.ink}
                  label="Passives"
                  count={npsResult.passives}
                  pct={npsResult.passivePct}
                />
                <NpsLegend
                  color={EDITORIAL.success}
                  label="Promoters"
                  count={npsResult.promoters}
                  pct={npsResult.promoterPct}
                />
              </div>
            </div>
          </div>
        </EditorialCard>
      )}

      {/* Poll results */}
      {pollData.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="h-px w-6 bg-editorial-neutral-3/60" aria-hidden="true" />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
              Poll results
            </span>
          </div>
          {pollData.map((poll) => (
            <EditorialCard key={poll.elementId} title={poll.elementId}>
              <ChartFrame>
                <BarChart
                  data={poll.options}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="2 3" stroke={EDITORIAL.rule} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={CHART_TICK}
                    tickLine={false}
                    axisLine={CHART_AXIS_LINE}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={CHART_TICK}
                    tickLine={false}
                    axisLine={CHART_AXIS_LINE}
                    width={isMobile ? 100 : 140}
                    tickFormatter={(v: string) => truncateLabel(v, isMobile ? 12 : 18)}
                  />
                  <Tooltip
                    cursor={TOOLTIP_CURSOR}
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value) => [String(value), 'Votes']}
                  />
                  <Bar dataKey="count" fill={EDITORIAL.ink} radius={[0, 2, 2, 0]} />
                </BarChart>
              </ChartFrame>
            </EditorialCard>
          ))}
        </div>
      )}

      {/* Average rating over time */}
      {avgRatingData.length > 0 && (
        <EditorialCard eyebrow="Rating" title="Average rating over time">
          <ChartFrame>
            <LineChart data={avgRatingData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 3" stroke={EDITORIAL.rule} />
              <XAxis dataKey="date" tick={CHART_TICK} tickLine={false} axisLine={CHART_AXIS_LINE} />
              <YAxis
                domain={[0, 5]}
                tick={CHART_TICK}
                tickLine={false}
                axisLine={CHART_AXIS_LINE}
                ticks={[1, 2, 3, 4, 5]}
                width={36}
              />
              <Tooltip
                cursor={{ stroke: EDITORIAL.rule, strokeWidth: 1 }}
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [`${value ?? 0} / 5`, 'Rating']}
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke={EDITORIAL.ink}
                strokeWidth={1.5}
                dot={{ fill: EDITORIAL.ink, r: 2 }}
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
      )}

      {/* Activity heatmap */}
      {heatmapData && heatmapData.length > 0 && <HeatmapChart data={heatmapData} />}

      {/* Element performance */}
      {elementPerformance.length > 0 && (
        <EditorialCard eyebrow="Detail" title="Element performance">
          {/* Mobile: Element ID + Responses only. Avg rating + Positive
              rate hidden below sm so the id column gets real width and the
              headers don't wrap into each other at 375px. Colgroup hidden
              on mobile so the fixed-width hints only apply when all four
              cols render. */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse sm:table-fixed">
              <colgroup className="hidden sm:table-column-group">
                <col />
                <col className="w-[110px]" />
                <col className="w-[110px]" />
                <col className="w-[130px]" />
              </colgroup>
              <thead>
                <tr className="border-y border-editorial-neutral-2">
                  <TableHead>Element ID</TableHead>
                  <TableHead>Responses</TableHead>
                  <th className="hidden py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3 sm:table-cell">
                    Avg rating
                  </th>
                  <th className="hidden py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3 sm:table-cell">
                    Positive rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {elementPerformance.map((el) => (
                  <tr
                    key={el.elementId}
                    className="border-b border-editorial-neutral-2 transition-colors duration-240 hover:bg-editorial-ink/[0.02]"
                  >
                    <TableCell>
                      <code
                        className="block truncate font-mono text-[12px] text-editorial-ink"
                        title={el.elementId}
                      >
                        {el.elementId}
                      </code>
                    </TableCell>
                    <TableCell mono>{el.total}</TableCell>
                    <td className="hidden py-3 text-left font-mono text-[13px] tabular-nums text-editorial-ink sm:table-cell">
                      {el.avgRating !== null ? `${el.avgRating} / 5` : '—'}
                    </td>
                    <td className="hidden py-3 text-left font-mono text-[13px] tabular-nums text-editorial-ink sm:table-cell">
                      {el.positiveRate !== null ? `${el.positiveRate}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </EditorialCard>
      )}
    </div>
  );
}

function NpsLegend({
  color,
  label,
  count,
  pct,
}: {
  color: string;
  label: string;
  count: number;
  pct: number;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
        {label}
      </span>
      <span className="font-mono text-[12px] tabular-nums text-editorial-ink">{count}</span>
      <span className="font-mono text-[11px] tabular-nums text-editorial-neutral-3">{pct}%</span>
    </span>
  );
}
