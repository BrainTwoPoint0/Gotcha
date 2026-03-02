'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Gotcha } from 'gotcha-feedback';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
            <div className="w-full sm:w-auto space-y-1">
              <Label>Project</Label>
              <Select
                value={projectId || '__all__'}
                onValueChange={(v) => setProjectId(v === '__all__' ? '' : v)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto space-y-1">
              <Label>Element</Label>
              <Select
                value={elementId || '__all__'}
                onValueChange={(v) => setElementId(v === '__all__' ? '' : v)}
              >
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="All Elements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Elements</SelectItem>
                  {elements.map((el) => (
                    <SelectItem key={el.elementIdRaw} value={el.elementIdRaw}>
                      {el.elementIdRaw} ({el.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto space-y-1">
              <Label>Group By</Label>
              <Select
                value={groupBy || '__none__'}
                onValueChange={(v) => setGroupBy(v === '__none__' ? '' : v)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select a field</SelectItem>
                  {availableFields.map((field) => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={applyFilters} className="flex-1 sm:flex-none">
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {availableFields.length === 0 && (
        <Card className="p-6 text-center">
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
        </Card>
      )}

      {!hasData && availableFields.length > 0 && groupBy && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No response data for the selected filters.</p>
        </Card>
      )}

      {!mounted && hasData && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Loading charts...</p>
        </Card>
      )}

      {mounted && hasData && (
        <>
          {/* Response Volume by Segment */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Response Volume by Segment</CardTitle>
                <Gotcha
                  elementId="segments-volume-chart"
                  mode="poll"
                  options={['Keep', 'Remove']}
                  position="inline"
                  theme="light"
                  showOnHover={false}
                  size="sm"
                  promptText="Should we keep this chart?"
                />
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Average Rating by Segment */}
            {ratingData.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Avg Rating by Segment</CardTitle>
                    <Gotcha
                      elementId="segments-rating-chart"
                      mode="poll"
                      options={['Keep', 'Remove']}
                      position="inline"
                      theme="light"
                      showOnHover={false}
                      size="sm"
                      promptText="Should we keep this chart?"
                    />
                  </div>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}

            {/* Positive Rate by Segment */}
            {sentimentData.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Positive Rate by Segment</CardTitle>
                    <Gotcha
                      elementId="segments-sentiment-chart"
                      mode="poll"
                      options={['Keep', 'Remove']}
                      position="inline"
                      theme="light"
                      showOnHover={false}
                      size="sm"
                      promptText="Should we keep this chart?"
                    />
                  </div>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Segment Comparison</CardTitle>
                <Gotcha
                  elementId="segments-comparison-table"
                  mode="poll"
                  options={['Keep', 'Remove']}
                  position="inline"
                  theme="light"
                  showOnHover={false}
                  size="sm"
                  promptText="Should we keep this table?"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Segment</TableHead>
                    <TableHead>Responses</TableHead>
                    <TableHead>Avg Rating</TableHead>
                    <TableHead>Positive Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segmentData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.segment}</TableCell>
                      <TableCell>{row.count}</TableCell>
                      <TableCell>{row.avgRating !== null ? `${row.avgRating}/5` : '-'}</TableCell>
                      <TableCell>
                        {row.positiveRate !== null ? `${row.positiveRate}%` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
