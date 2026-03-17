'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
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
  ratingDelta: number | null; // vs overall average
  positiveDelta: number | null; // vs overall average
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
  sparklineData?: Record<string, Array<{ day: string; avg: number }>>;
  archivedElementIds: string[];
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
  sparklineData,
  archivedElementIds: initialArchivedIds,
}: ElementsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<SortKey>('total');
  const [sortAsc, setSortAsc] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedIds, setArchivedIds] = useState<string[]>(initialArchivedIds);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setMounted(true);
  }, []);

  const archivedSet = useMemo(() => new Set(archivedIds), [archivedIds]);
  const activeElements = elements.filter((el) => !archivedSet.has(el.elementId));
  const archivedElements = elements.filter((el) => archivedSet.has(el.elementId));

  // Check if currently filtered element is archived
  const filteredElementId = searchParams.get('elementId');
  const isFilteredElementArchived = filteredElementId && archivedSet.has(filteredElementId);

  const revertArchiveState = (elementId: string, archive: boolean) => {
    if (archive) {
      setArchivedIds((prev) => prev.filter((id) => id !== elementId));
    } else {
      setArchivedIds((prev) => [...prev, elementId]);
    }
  };

  const handleArchiveToggle = async (elementId: string, archive: boolean) => {
    // Guard against rapid double-click while another operation is in-flight
    if (archivingId) return;

    setArchivingId(elementId);
    setError(null);
    // Optimistic update
    if (archive) {
      setArchivedIds((prev) => [...prev, elementId]);
    } else {
      setArchivedIds((prev) => prev.filter((id) => id !== elementId));
    }

    try {
      const res = archive
        ? await fetch('/api/elements/archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ elementId }),
          })
        : await fetch(`/api/elements/archive?elementId=${encodeURIComponent(elementId)}`, {
            method: 'DELETE',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
          });
      if (!res.ok) {
        revertArchiveState(elementId, archive);
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Failed to update archive status');
      } else {
        router.refresh();
      }
    } catch {
      revertArchiveState(elementId, archive);
      setError('Network error — please try again');
    } finally {
      setArchivingId(null);
    }
  };

  const handleClearArchivedFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('elementId');
    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(key === 'ratingDelta'); // default asc for delta (worst first)
    }
  };

  const sorted = [...activeElements].sort((a, b) => {
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

  const SortHeader = ({
    label,
    sortKey,
    align = 'right',
  }: {
    label: string;
    sortKey: SortKey;
    align?: string;
  }) => (
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
      {/* Error feedback */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200/60 bg-red-50 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Archived element filter banner */}
      {isFilteredElementArchived && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-amber-200/60 bg-amber-50 text-sm text-amber-800">
          <span>
            Selected element{' '}
            <code className="text-xs font-mono bg-white/60 px-1.5 py-0.5 rounded">
              {filteredElementId}
            </code>{' '}
            is archived.
          </span>
          <button
            onClick={handleClearArchivedFilter}
            className="ml-auto text-xs font-medium text-amber-600 hover:text-amber-800 underline underline-offset-2"
          >
            Clear filter
          </button>
        </div>
      )}

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
                    <span
                      className={`text-[10px] uppercase font-semibold tracking-wider ${style.label}`}
                    >
                      {anomaly.severity}
                    </span>
                  </div>
                  <p className={`text-sm mt-0.5 ${style.text}`}>{anomaly.description}</p>
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
            Overall avg rating:{' '}
            <span className="font-medium text-gray-900">{overallAvgRating.toFixed(1)}/5</span>
          </span>
          {overallPositiveRate !== null && (
            <span>
              Overall positive rate:{' '}
              <span className="font-medium text-gray-900">{overallPositiveRate}%</span>
            </span>
          )}
        </div>
      )}

      {/* Element Benchmarking Table */}
      {activeElements.length === 0 && archivedElements.length === 0 ? (
        <Card className="text-center py-16">
          <h3 className="text-lg font-medium text-gray-900">No element data</h3>
          <p className="mt-2 text-gray-500">
            Elements appear here once you start collecting feedback.
          </p>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Element Performance</CardTitle>
              {archivedElements.length > 0 && (
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showArchived ? 'Hide' : 'Show'} archived ({archivedElements.length})
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full min-w-[750px]">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className="w-[13%]" />
                  <col className="w-[8%]" />
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
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-center">
                      Trend
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-center"></TableHead>
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
                      <TableCell
                        className={`text-right tabular-nums text-sm font-medium ${deltaColor(el.ratingDelta)}`}
                      >
                        {formatDelta(el.ratingDelta)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-gray-900">
                        {el.positiveRate !== null ? `${el.positiveRate}%` : '-'}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums text-sm font-medium ${deltaPctColor(el.positiveDelta)}`}
                      >
                        {formatDelta(el.positiveDelta, 'pp')}
                      </TableCell>
                      <TableCell className="text-center">
                        {mounted &&
                        sparklineData?.[el.elementId] &&
                        sparklineData[el.elementId].length >= 2 ? (
                          <div className="w-16 h-5 mx-auto">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={sparklineData[el.elementId]}>
                                <Line
                                  type="monotone"
                                  dataKey="avg"
                                  stroke="#64748b"
                                  strokeWidth={1.5}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveToggle(el.elementId, true);
                          }}
                          disabled={archivingId === el.elementId}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1 rounded"
                          title="Archive element"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                            />
                          </svg>
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {showArchived && archivedElements.length > 0 && (
                <div className="border-t border-gray-200/80 mt-2 pt-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2">
                    Archived
                  </p>
                  <Table className="table-fixed w-full min-w-[750px]">
                    <colgroup>
                      <col className="w-[24%]" />
                      <col className="w-[11%]" />
                      <col className="w-[11%]" />
                      <col className="w-[11%]" />
                      <col className="w-[11%]" />
                      <col className="w-[11%]" />
                      <col className="w-[13%]" />
                      <col className="w-[8%]" />
                    </colgroup>
                    <TableBody>
                      {archivedElements.map((el) => (
                        <TableRow
                          key={el.elementId}
                          className="group opacity-50 hover:opacity-75 transition-opacity"
                        >
                          <TableCell>
                            <code className="text-xs font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                              {el.elementId}
                            </code>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm text-gray-500">
                            {el.total}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm text-gray-500">
                            {el.avgRating !== null ? `${el.avgRating}/5` : '-'}
                          </TableCell>
                          <TableCell
                            className={`text-right tabular-nums text-sm font-medium ${deltaColor(el.ratingDelta)}`}
                          >
                            {formatDelta(el.ratingDelta)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm text-gray-500">
                            {el.positiveRate !== null ? `${el.positiveRate}%` : '-'}
                          </TableCell>
                          <TableCell
                            className={`text-right tabular-nums text-sm font-medium ${deltaPctColor(el.positiveDelta)}`}
                          >
                            {formatDelta(el.positiveDelta, 'pp')}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-gray-300 text-xs">—</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => handleArchiveToggle(el.elementId, false)}
                              disabled={archivingId === el.elementId}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                              title="Unarchive element"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0 3-3m-3 3-3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                                />
                              </svg>
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
