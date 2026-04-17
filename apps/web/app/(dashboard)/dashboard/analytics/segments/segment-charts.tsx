'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import {
  EDITORIAL,
  CHART_TICK,
  CHART_AXIS_LINE,
  TOOLTIP_STYLE,
  TOOLTIP_CURSOR,
  EditorialCard,
  ChartFrame,
  EditorialTable,
  TableHead,
  TableCell,
  truncateLabel,
  npsFill,
} from '../editorial-chart';

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
  npsScore: number | null;
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
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [projectId, setProjectId] = useState(selectedProjectId || '');
  const [elementId, setElementId] = useState(selectedElementId || '');
  const [groupBy, setGroupBy] = useState(selectedGroupBy || '');

  useEffect(() => {
    setMounted(true);
    // Track viewport for Y-axis label widths. On narrow screens a wide
    // label column crushes the bars to a few pixels — drop to 100px.
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const yAxisWidth = isMobile ? 100 : 160;
  const labelMax = isMobile ? 14 : 22;

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (projectId) params.set('projectId', projectId);
    if (elementId) params.set('elementId', elementId);
    if (groupBy) params.set('groupBy', groupBy);
    router.push(`/dashboard/analytics/segments?${params.toString()}`);
  };

  const hasData = segmentData.length > 0;

  // Prepare chart data — keep the full raw segment name on a `fullName`
  // field so the tooltip can show the un-truncated value even when the
  // Y-axis label is shortened.
  const countData = segmentData.map((d) => ({
    name: truncateLabel(d.segment, labelMax),
    fullName: d.segment,
    value: d.count,
  }));

  const ratingData = segmentData
    .filter((d) => d.avgRating !== null)
    .map((d) => ({
      name: truncateLabel(d.segment, labelMax),
      fullName: d.segment,
      value: d.avgRating,
    }));

  const sentimentData = segmentData
    .filter((d) => d.positiveRate !== null)
    .map((d) => ({
      name: truncateLabel(d.segment, labelMax),
      fullName: d.segment,
      value: d.positiveRate,
    }));

  const npsData = segmentData
    .filter((d) => d.npsScore !== null)
    .map((d) => ({
      name: truncateLabel(d.segment, labelMax),
      fullName: d.segment,
      value: d.npsScore,
    }));

  return (
    <div className="space-y-6">
      {/* Filters card */}
      <EditorialCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterField label="Project">
            <Select
              value={projectId || '__all__'}
              onValueChange={(v) => setProjectId(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Element">
            <Select
              value={elementId || '__all__'}
              onValueChange={(v) => setElementId(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="All elements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All elements</SelectItem>
                {elements.map((el) => (
                  <SelectItem key={el.elementIdRaw} value={el.elementIdRaw}>
                    {el.elementIdRaw} ({el.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Group by">
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
          </FilterField>

          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex items-center justify-center rounded-md bg-editorial-ink px-4 py-2 text-[13px] font-medium text-editorial-paper transition-colors duration-240 ease-page-turn hover:bg-editorial-ink/90 sm:self-end"
          >
            Apply
          </button>
        </div>
      </EditorialCard>

      {availableFields.length === 0 && (
        <EditorialCard>
          <div className="py-4 text-center">
            <h3 className="font-display text-[1.25rem] font-normal leading-[1.3] tracking-[-0.01em] text-editorial-ink">
              No user metadata found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-[1.55] text-editorial-neutral-3">
              To use segmentation, pass user attributes when collecting feedback.
            </p>
            <pre className="mx-auto mt-5 max-w-lg overflow-x-auto rounded-md border border-editorial-neutral-2 bg-editorial-ink/[0.02] p-4 text-left font-mono text-[12px] leading-[1.55] text-editorial-ink">
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
        </EditorialCard>
      )}

      {!hasData && availableFields.length > 0 && groupBy && (
        <EditorialCard>
          <p className="py-10 text-center text-[13px] text-editorial-neutral-3">
            No response data for the selected filters.
          </p>
        </EditorialCard>
      )}

      {!mounted && hasData && (
        <EditorialCard>
          <p className="py-10 text-center text-[13px] text-editorial-neutral-3">Loading charts…</p>
        </EditorialCard>
      )}

      {mounted && hasData && (
        <>
          {/* Response Volume by Segment */}
          <EditorialCard eyebrow="Volume" title="Response volume by segment">
            <ChartFrame>
              <BarChart data={countData} layout="vertical">
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
                  width={yAxisWidth}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(26,23,20,0.04)' }}
                  contentStyle={TOOLTIP_STYLE}
                  labelFormatter={(_, payload) =>
                    (payload?.[0]?.payload as { fullName?: string } | undefined)?.fullName ?? ''
                  }
                  formatter={(value) => [String(value), 'Responses']}
                />
                <Bar dataKey="value" radius={[0, 2, 2, 0]} fill={EDITORIAL.ink} />
              </BarChart>
            </ChartFrame>
          </EditorialCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {ratingData.length > 0 && (
              <EditorialCard eyebrow="Rating" title="Average rating by segment">
                <ChartFrame>
                  <BarChart data={ratingData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="2 3"
                      stroke={EDITORIAL.rule}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={CHART_TICK}
                      tickLine={false}
                      axisLine={CHART_AXIS_LINE}
                      domain={[0, 5]}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={CHART_TICK}
                      tickLine={false}
                      axisLine={CHART_AXIS_LINE}
                      width={yAxisWidth}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(26,23,20,0.04)' }}
                      contentStyle={TOOLTIP_STYLE}
                      labelFormatter={(_, payload) =>
                        (payload?.[0]?.payload as { fullName?: string } | undefined)?.fullName ?? ''
                      }
                      formatter={(value) => [`${value ?? 0} / 5`, 'Rating']}
                    />
                    <Bar dataKey="value" radius={[0, 2, 2, 0]} fill={EDITORIAL.ink} />
                  </BarChart>
                </ChartFrame>
              </EditorialCard>
            )}

            {sentimentData.length > 0 && (
              <EditorialCard eyebrow="Sentiment" title="Positive rate by segment">
                <ChartFrame>
                  <BarChart data={sentimentData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="2 3"
                      stroke={EDITORIAL.rule}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={CHART_TICK}
                      tickLine={false}
                      axisLine={CHART_AXIS_LINE}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={CHART_TICK}
                      tickLine={false}
                      axisLine={CHART_AXIS_LINE}
                      width={yAxisWidth}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(26,23,20,0.04)' }}
                      contentStyle={TOOLTIP_STYLE}
                      labelFormatter={(_, payload) =>
                        (payload?.[0]?.payload as { fullName?: string } | undefined)?.fullName ?? ''
                      }
                      formatter={(value) => [`${value ?? 0}%`, 'Positive']}
                    />
                    <Bar dataKey="value" radius={[0, 2, 2, 0]} fill={EDITORIAL.ink} />
                  </BarChart>
                </ChartFrame>
              </EditorialCard>
            )}
          </div>

          {/* NPS by Segment — semantic three-tier colour (sage / muted / clay).
              Matches the rest of the product's "max 2 jobs per colour" discipline:
              the tiers aren't reached for anywhere else on this page. */}
          {npsData.length > 0 &&
            (() => {
              // Clamp the NPS axis to the actual data range instead of the
              // theoretical [-100, 100]. If every segment is positive we
              // start at 0; if every one is negative we end at 0. Only show
              // both halves when the data actually crosses zero.
              const values = npsData.map((d) => d.value).filter((v): v is number => v !== null);
              const minV = Math.min(...values);
              const maxV = Math.max(...values);
              const npsDomain: [number, number] =
                minV >= 0 ? [0, 100] : maxV <= 0 ? [-100, 0] : [-100, 100];
              return (
                <EditorialCard eyebrow="NPS" title="NPS by segment">
                  <ChartFrame>
                    <BarChart data={npsData} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="2 3"
                        stroke={EDITORIAL.rule}
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={CHART_TICK}
                        tickLine={false}
                        axisLine={CHART_AXIS_LINE}
                        domain={npsDomain}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={CHART_TICK}
                        tickLine={false}
                        axisLine={CHART_AXIS_LINE}
                        width={yAxisWidth}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(26,23,20,0.04)' }}
                        contentStyle={TOOLTIP_STYLE}
                        labelFormatter={(_, payload) =>
                          (payload?.[0]?.payload as { fullName?: string } | undefined)?.fullName ??
                          ''
                        }
                        formatter={(value) => [`${value ?? 0}`, 'NPS']}
                      />
                      <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                        {npsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={npsFill(entry.value)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartFrame>
                </EditorialCard>
              );
            })()}

          {/* Comparison table */}
          <EditorialCard eyebrow="Detail" title="Segment comparison">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-y border-editorial-neutral-2">
                    <TableHead>Segment</TableHead>
                    <TableHead>Responses</TableHead>
                    <th className="hidden py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3 sm:table-cell">
                      Avg rating
                    </th>
                    <th className="hidden py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3 sm:table-cell">
                      Positive rate
                    </th>
                    <TableHead>NPS</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {/* Drop zero-count rows — pure noise, no data to compare. */}
                  {segmentData
                    .filter((r) => r.count > 0)
                    .map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-editorial-neutral-2 transition-colors duration-240 hover:bg-editorial-ink/[0.02]"
                      >
                        <TableCell>
                          <span className="block truncate" title={row.segment}>
                            {row.segment}
                          </span>
                        </TableCell>
                        <TableCell mono>{row.count}</TableCell>
                        <td className="hidden py-3 text-left font-mono text-[13px] tabular-nums text-editorial-ink sm:table-cell">
                          {row.avgRating !== null ? `${row.avgRating} / 5` : '—'}
                        </td>
                        <td className="hidden py-3 text-left font-mono text-[13px] tabular-nums text-editorial-ink sm:table-cell">
                          {row.positiveRate !== null ? `${row.positiveRate}%` : '—'}
                        </td>
                        <TableCell mono>
                          {row.npsScore !== null ? (
                            <span style={{ color: npsFill(row.npsScore) }}>{row.npsScore}</span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </EditorialCard>
        </>
      )}
    </div>
  );
}

/** FilterField — mono-caps label over a shadcn Select. Local because
 *  it's specific to the segments filter row; not reused elsewhere. */
function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="w-full sm:w-auto">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
        {label}
      </span>
      {children}
    </div>
  );
}
