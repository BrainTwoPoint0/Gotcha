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

  return (
    <div className="space-y-6">
      {/* Response Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Response Trends</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mode Distribution */}
        {modeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Response Types</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

        {/* Sentiment Breakdown */}
        {sentimentData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Vote Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}
      </div>

      {/* Poll Results */}
      {pollData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Poll Results</h3>
          {pollData.map((poll) => (
            <Card key={poll.elementId}>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {poll.elementId}
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Average Rating Over Time */}
      {avgRatingData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Average Rating Over Time</CardTitle>
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
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Element Performance */}
      {elementPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Element Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Element ID</TableHead>
                    <TableHead className="text-right">Responses</TableHead>
                    <TableHead className="text-right">Avg Rating</TableHead>
                    <TableHead className="text-right">Positive Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {elementPerformance.map((el) => (
                    <TableRow key={el.elementId}>
                      <TableCell className="font-medium">{el.elementId}</TableCell>
                      <TableCell className="text-right">{el.total}</TableCell>
                      <TableCell className="text-right">
                        {el.avgRating !== null ? `${el.avgRating}/5` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
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
