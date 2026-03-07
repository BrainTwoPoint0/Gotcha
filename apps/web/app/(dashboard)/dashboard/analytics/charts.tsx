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
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

interface AnalyticsChartsProps {
  trendData: TrendDataPoint[];
  modeData: ModeDataPoint[];
  sentimentData: SentimentDataPoint[];
  avgRatingData: RatingDataPoint[];
  pollData: PollBreakdownData[];
  elementPerformance: ElementPerformanceData[];
  npsResult?: NpsResult | null;
}

const MODE_COLORS: Record<string, string> = {
  feedback: '#64748b',
  vote: '#22c55e',
  poll: '#a855f7',
  'feature request': '#f97316',
  ab: '#ec4899',
  nps: '#14b8a6',
};

export function AnalyticsCharts({
  trendData,
  modeData,
  sentimentData,
  avgRatingData,
  pollData,
  elementPerformance,
  npsResult,
}: AnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 640);
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const hasData = trendData.some((d) => d.responses > 0);

  if (!mounted) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Loading charts...</p>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No response data in the last 30 days.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Charts will appear once you start collecting feedback.
        </p>
      </Card>
    );
  }

  const fontSize = isMobile ? 10 : 12;
  const yAxisWidth = isMobile ? 70 : 100;

  return (
    <div className="space-y-6">
      {/* Response Trends */}
      <Card>
        <CardHeader className="pb-2 px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Response Trends</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-4">
          <div className="h-52 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={trendData} margin={{ top: 5, right: 8, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  allowDecimals={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: 12,
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mode Distribution */}
        {modeData.length > 0 && (
          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Response Types</CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6 pb-4">
              <div className="h-52 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={modeData} layout="vertical" margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize }}
                      width={yAxisWidth}
                      tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: 12,
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
            </CardContent>
          </Card>
        )}

        {/* Sentiment Breakdown */}
        {sentimentData.length > 0 && (
          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Vote Sentiment</CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6 pb-4">
              <div className="h-52 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="42%"
                      innerRadius="30%"
                      outerRadius="55%"
                      paddingAngle={5}
                      dataKey="value"
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
                        fontSize: 12,
                      }}
                      formatter={(value: number, name: string) => [`${value} responses`, name]}
                    />
                    <Legend
                      formatter={(value: string) => {
                        const total = sentimentData.reduce((s, d) => s + d.value, 0);
                        const item = sentimentData.find((d) => d.name === value);
                        const pct = item && total > 0 ? Math.round((item.value / total) * 100) : 0;
                        return `${value} ${pct}%`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* NPS Score */}
      {npsResult && (
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Net Promoter Score</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="flex flex-col items-center gap-4">
              {/* Score display */}
              <div className="text-center">
                <div
                  className="text-4xl sm:text-5xl font-bold"
                  style={{
                    color: npsResult.score >= 50 ? '#10B981' : npsResult.score >= 0 ? '#F59E0B' : '#EF4444',
                  }}
                >
                  {npsResult.score}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on {npsResult.total} response{npsResult.total !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Stacked bar */}
              <div className="w-full max-w-md">
                <div className="flex rounded-full overflow-hidden h-5 sm:h-6">
                  {npsResult.detractorPct > 0 && (
                    <div
                      style={{ width: `${npsResult.detractorPct}%`, backgroundColor: '#EF4444' }}
                      className="flex items-center justify-center text-white text-[10px] sm:text-xs font-medium"
                    >
                      {npsResult.detractorPct > 10 ? `${npsResult.detractorPct}%` : ''}
                    </div>
                  )}
                  {npsResult.passivePct > 0 && (
                    <div
                      style={{ width: `${npsResult.passivePct}%`, backgroundColor: '#F59E0B' }}
                      className="flex items-center justify-center text-white text-[10px] sm:text-xs font-medium"
                    >
                      {npsResult.passivePct > 10 ? `${npsResult.passivePct}%` : ''}
                    </div>
                  )}
                  {npsResult.promoterPct > 0 && (
                    <div
                      style={{ width: `${npsResult.promoterPct}%`, backgroundColor: '#10B981' }}
                      className="flex items-center justify-center text-white text-[10px] sm:text-xs font-medium"
                    >
                      {npsResult.promoterPct > 10 ? `${npsResult.promoterPct}%` : ''}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-between mt-2 text-[10px] sm:text-xs text-muted-foreground gap-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    Detractors ({npsResult.detractors})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    Passives ({npsResult.passives})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Promoters ({npsResult.promoters})
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Poll Results */}
      {pollData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Poll Results</h3>
          {pollData.map((poll) => (
            <Card key={poll.elementId}>
              <CardHeader className="pb-2 px-4 sm:px-6">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {poll.elementId}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6 pb-4">
                <div className="h-52 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={poll.options} layout="vertical" margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize }} width={yAxisWidth} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Average Rating Over Time */}
      {avgRatingData.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Average Rating Over Time</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-4">
            <div className="h-52 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={avgRatingData} margin={{ top: 5, right: 8, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    domain={[0, 5]}
                    tick={{ fontSize }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    ticks={[1, 2, 3, 4, 5]}
                    width={35}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: 12,
                    }}
                    formatter={(value) => [`${value ?? 0}/5`, 'Rating']}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="#eab308"
                    strokeWidth={2}
                    dot={{ fill: '#eab308', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Element Performance */}
      {elementPerformance.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Element Performance</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6 pb-4">
            <div className="overflow-x-auto">
              <Table className="min-w-[480px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4 sm:pl-0">Element ID</TableHead>
                    <TableHead className="text-right">Responses</TableHead>
                    <TableHead className="text-right">Avg Rating</TableHead>
                    <TableHead className="text-right pr-4 sm:pr-0">Positive Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {elementPerformance.map((el) => (
                    <TableRow key={el.elementId}>
                      <TableCell className="pl-4 sm:pl-0">
                        <code className="text-xs font-mono">{el.elementId}</code>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{el.total}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {el.avgRating !== null ? `${el.avgRating}/5` : '-'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums pr-4 sm:pr-0">
                        {el.positiveRate !== null ? `${el.positiveRate}%` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
