'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ── Types ────────────────────────────────────────────────────────────

interface ElementBenchmark {
  elementId: string;
  total: number;
  avgRating: number | null;
  positiveRate: number | null;
  ratingDelta: number | null;    // vs overall average
  positiveDelta: number | null;  // vs overall average
}

interface Anomaly {
  elementId: string;
  type: 'volume_spike' | 'volume_drop' | 'rating_drop' | 'sentiment_drop';
  description: string;
  severity: 'info' | 'warning' | 'critical';
  currentValue: number;
  baselineValue: number;
}

interface ElementsTabProps {
  elements: ElementBenchmark[];
  anomalies: Anomaly[];
  overallAvgRating: number | null;
  overallPositiveRate: number | null;
}

// ── Helpers ──────────────────────────────────────────────────────────

type SortKey = 'total' | 'avgRating' | 'positiveRate' | 'ratingDelta';

function deltaColor(delta: number | null): string {
  if (delta === null) return 'text-gray-400';
  if (delta > 0.2) return 'text-emerald-600';
  if (delta < -0.2) return 'text-red-500';
  return 'text-gray-500';
}

function deltaPctColor(delta: number | null): string {
  if (delta === null) return 'text-gray-400';
  if (delta > 5) return 'text-emerald-600';
  if (delta < -5) return 'text-red-500';
  return 'text-gray-500';
}

function formatDelta(delta: number | null, suffix = ''): string {
  if (delta === null) return '-';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}${suffix}`;
}

const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200/60',
    dot: 'bg-red-500',
    text: 'text-red-800',
    label: 'text-red-600',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200/60',
    dot: 'bg-amber-500',
    text: 'text-amber-800',
    label: 'text-amber-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200/60',
    dot: 'bg-blue-400',
    text: 'text-blue-700',
    label: 'text-blue-500',
  },
};

// ── Component ────────────────────────────────────────────────────────

export function ElementsTab({
  elements,
  anomalies,
  overallAvgRating,
  overallPositiveRate,
}: ElementsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<SortKey>('total');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(key === 'ratingDelta'); // default asc for delta (worst first)
    }
  };

  const sorted = [...elements].sort((a, b) => {
    const av = a[sortBy] ?? -Infinity;
    const bv = b[sortBy] ?? -Infinity;
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const handleElementClick = (elementId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('elementId', elementId);
    params.delete('tab');
    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  const SortHeader = ({ label, sortKey, align = 'right' }: { label: string; sortKey: SortKey; align?: string }) => (
    <TableHead
      className={`text-xs font-medium uppercase tracking-wider text-gray-400 cursor-pointer select-none hover:text-gray-600 transition-colors ${align === 'right' ? 'text-right' : ''}`}
      onClick={() => handleSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === sortKey && (
          <span className="text-gray-500">{sortAsc ? '\u2191' : '\u2193'}</span>
        )}
      </span>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      {/* Anomaly Alerts */}
      {anomalies.length > 0 && (
        <div className="space-y-2">
          {anomalies.map((anomaly, i) => {
            const style = SEVERITY_STYLES[anomaly.severity];
            return (
              <div
                key={`${anomaly.elementId}-${anomaly.type}-${i}`}
                className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${style.bg} ${style.border}`}
              >
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <code className="text-xs font-mono bg-white/60 px-1.5 py-0.5 rounded text-gray-600 truncate max-w-[200px] sm:max-w-none">
                      {anomaly.elementId}
                    </code>
                    <span className={`text-[10px] uppercase font-semibold tracking-wider ${style.label}`}>
                      {anomaly.severity}
                    </span>
                  </div>
                  <p className={`text-sm mt-0.5 ${style.text}`}>
                    {anomaly.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Benchmarks summary */}
      {overallAvgRating !== null && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-500">
          <span>
            Overall avg rating: <span className="font-medium text-gray-900">{overallAvgRating.toFixed(1)}/5</span>
          </span>
          {overallPositiveRate !== null && (
            <span>
              Overall positive rate: <span className="font-medium text-gray-900">{overallPositiveRate}%</span>
            </span>
          )}
        </div>
      )}

      {/* Element Benchmarking Table */}
      {elements.length === 0 ? (
        <Card className="text-center py-16">
          <h3 className="text-lg font-medium text-gray-900">No element data</h3>
          <p className="mt-2 text-gray-500">
            Elements appear here once you start collecting feedback.
          </p>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Element Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full min-w-[600px]">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="border-b border-gray-200/80">
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Element
                    </TableHead>
                    <SortHeader label="Responses" sortKey="total" />
                    <SortHeader label="Avg Rating" sortKey="avgRating" />
                    <SortHeader label="vs Avg" sortKey="ratingDelta" />
                    <SortHeader label="Positive" sortKey="positiveRate" />
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                      vs Avg
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((el) => (
                    <TableRow
                      key={el.elementId}
                      className="group cursor-pointer transition-colors duration-100 hover:bg-gray-50/50"
                      onClick={() => handleElementClick(el.elementId)}
                    >
                      <TableCell>
                        <code className="text-xs font-mono text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded group-hover:bg-gray-100 transition-colors">
                          {el.elementId}
                        </code>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-gray-900">
                        {el.total}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-gray-900">
                        {el.avgRating !== null ? `${el.avgRating}/5` : '-'}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums text-sm font-medium ${deltaColor(el.ratingDelta)}`}>
                        {formatDelta(el.ratingDelta)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-gray-900">
                        {el.positiveRate !== null ? `${el.positiveRate}%` : '-'}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums text-sm font-medium ${deltaPctColor(el.positiveDelta)}`}>
                        {formatDelta(el.positiveDelta, 'pp')}
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
