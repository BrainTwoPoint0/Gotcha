'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { EDITORIAL, EditorialCard, TableHead, TableCell } from './editorial-chart';

interface ElementBenchmark {
  elementId: string;
  total: number;
  avgRating: number | null;
  positiveRate: number | null;
  ratingDelta: number | null;
  positiveDelta: number | null;
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

type SortKey = 'total' | 'avgRating' | 'positiveRate' | 'ratingDelta';

function deltaColor(delta: number | null): string {
  if (delta === null) return 'text-editorial-neutral-3';
  if (delta > 0.2) return 'text-editorial-success';
  if (delta < -0.2) return 'text-editorial-alert';
  return 'text-editorial-neutral-3';
}

function deltaPctColor(delta: number | null): string {
  if (delta === null) return 'text-editorial-neutral-3';
  if (delta > 5) return 'text-editorial-success';
  if (delta < -5) return 'text-editorial-alert';
  return 'text-editorial-neutral-3';
}

function formatDelta(delta: number | null, suffix = ''): string {
  if (delta === null) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}${suffix}`;
}

// Editorial severity palette — left-edge rule + muted tint. Same three
// tiers as the NPS semantic language (sage / ink / clay) so severity
// reads consistently across the dashboard.
const SEVERITY: Record<
  Anomaly['severity'],
  { edge: string; tint: string; label: string; labelClass: string }
> = {
  critical: {
    edge: 'border-l-editorial-alert',
    tint: 'bg-editorial-alert/[0.04]',
    label: 'Critical',
    labelClass: 'text-editorial-alert',
  },
  warning: {
    edge: 'border-l-editorial-accent',
    tint: 'bg-editorial-accent/[0.05]',
    label: 'Warning',
    labelClass: 'text-editorial-accent',
  },
  info: {
    edge: 'border-l-editorial-neutral-3',
    tint: 'bg-editorial-ink/[0.02]',
    label: 'Info',
    labelClass: 'text-editorial-neutral-3',
  },
};

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
    if (archivingId) return;
    setArchivingId(elementId);
    setError(null);
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
      setSortAsc(key === 'ratingDelta');
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

  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: SortKey }) => (
    <th
      onClick={() => handleSort(sortKey)}
      className="cursor-pointer select-none py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === sortKey && <span className="text-editorial-ink">{sortAsc ? '↑' : '↓'}</span>}
      </span>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Error feedback */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border-l-2 border-editorial-alert bg-editorial-alert/[0.04] px-4 py-2.5 text-[13px] text-editorial-ink">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-alert">
            Error
          </span>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Archived element filter banner */}
      {isFilteredElementArchived && (
        <div className="flex items-center gap-3 rounded-md border-l-2 border-editorial-accent bg-editorial-accent/[0.05] px-4 py-2.5 text-[13px] text-editorial-ink">
          <span>
            Selected element{' '}
            <code className="rounded bg-editorial-paper px-1.5 py-0.5 font-mono text-[11px] text-editorial-neutral-3">
              {filteredElementId}
            </code>{' '}
            is archived.
          </span>
          <button
            onClick={handleClearArchivedFilter}
            className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-accent underline underline-offset-2 hover:text-editorial-ink"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Anomaly alerts */}
      {anomalies.length > 0 && (
        <div className="space-y-2">
          {anomalies.map((anomaly, i) => {
            const style = SEVERITY[anomaly.severity];
            return (
              <div
                key={`${anomaly.elementId}-${anomaly.type}-${i}`}
                className={`rounded-md border-l-2 ${style.edge} ${style.tint} px-4 py-3`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.18em] ${style.labelClass}`}
                  >
                    {style.label}
                  </span>
                  <code className="rounded bg-editorial-paper px-1.5 py-0.5 font-mono text-[11px] text-editorial-neutral-3">
                    {anomaly.elementId}
                  </code>
                </div>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-editorial-ink">
                  {anomaly.description}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Benchmarks summary */}
      {overallAvgRating !== null && (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-editorial-neutral-2 pb-4 text-[13px]">
          <span className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
              Overall avg rating
            </span>
            <span className="font-mono tabular-nums text-[14px] text-editorial-ink">
              {overallAvgRating.toFixed(1)} / 5
            </span>
          </span>
          {overallPositiveRate !== null && (
            <span className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                Overall positive rate
              </span>
              <span className="font-mono tabular-nums text-[14px] text-editorial-ink">
                {overallPositiveRate}%
              </span>
            </span>
          )}
        </div>
      )}

      {/* Element benchmarking */}
      {activeElements.length === 0 && archivedElements.length === 0 ? (
        <EditorialCard>
          <div className="py-10 text-center">
            <p className="text-[14px] text-editorial-ink">No element data</p>
            <p className="mt-1.5 text-[13px] text-editorial-neutral-3">
              Elements appear here once you start collecting feedback.
            </p>
          </div>
        </EditorialCard>
      ) : (
        <EditorialCard
          eyebrow="Detail"
          title="Element performance"
          subtitle={
            archivedElements.length > 0
              ? `${activeElements.length} active · ${archivedElements.length} archived`
              : undefined
          }
        >
          {archivedElements.length > 0 && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
              >
                {showArchived ? 'Hide archived' : `Show archived (${archivedElements.length})`}
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-y border-editorial-neutral-2">
                  <TableHead>Element</TableHead>
                  <SortableHeader label="Responses" sortKey="total" />
                  <SortableHeader label="Avg rating" sortKey="avgRating" />
                  <th
                    onClick={() => handleSort('ratingDelta')}
                    className="hidden cursor-pointer select-none py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3 transition-colors hover:text-editorial-ink md:table-cell"
                  >
                    <span className="inline-flex items-center gap-1">
                      vs avg
                      {sortBy === 'ratingDelta' && (
                        <span className="text-editorial-ink">{sortAsc ? '↑' : '↓'}</span>
                      )}
                    </span>
                  </th>
                  <SortableHeader label="Positive" sortKey="positiveRate" />
                  <th className="hidden py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3 md:table-cell">
                    vs avg
                  </th>
                  <th className="hidden py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3 md:table-cell">
                    Trend
                  </th>
                  <th className="w-[44px] py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                    {''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((el) => (
                  <tr
                    key={el.elementId}
                    className="group cursor-pointer border-b border-editorial-neutral-2 transition-colors duration-240 hover:bg-editorial-ink/[0.02]"
                    onClick={() => handleElementClick(el.elementId)}
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
                    <TableCell mono>
                      {el.avgRating !== null ? `${el.avgRating} / 5` : '—'}
                    </TableCell>
                    <td
                      className={`hidden py-3 text-left font-mono text-[13px] tabular-nums md:table-cell ${deltaColor(el.ratingDelta)}`}
                    >
                      {formatDelta(el.ratingDelta)}
                    </td>
                    <TableCell mono>
                      {el.positiveRate !== null ? `${el.positiveRate}%` : '—'}
                    </TableCell>
                    <td
                      className={`hidden py-3 text-left font-mono text-[13px] tabular-nums md:table-cell ${deltaPctColor(el.positiveDelta)}`}
                    >
                      {formatDelta(el.positiveDelta, 'pp')}
                    </td>
                    <td className="hidden py-3 md:table-cell">
                      {mounted &&
                      sparklineData?.[el.elementId] &&
                      sparklineData[el.elementId].length >= 2 ? (
                        <div className="h-5 w-20">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sparklineData[el.elementId]}>
                              <Line
                                type="monotone"
                                dataKey="avg"
                                stroke={EDITORIAL.ink}
                                strokeWidth={1.25}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <span className="text-[13px] text-editorial-neutral-3">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveToggle(el.elementId, true);
                        }}
                        disabled={archivingId === el.elementId}
                        className="rounded p-1 text-editorial-neutral-3 transition-all duration-240 hover:text-editorial-ink md:opacity-0 md:group-hover:opacity-100"
                        title="Archive element"
                        aria-label="Archive element"
                      >
                        <svg
                          className="h-3.5 w-3.5"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showArchived && archivedElements.length > 0 && (
            <div className="mt-6 border-t border-editorial-neutral-2 pt-4">
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px w-6 bg-editorial-neutral-3/60" aria-hidden="true" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                  Archived
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    {archivedElements.map((el) => (
                      <tr
                        key={el.elementId}
                        className="border-b border-editorial-neutral-2 opacity-60 hover:opacity-80"
                      >
                        <TableCell>
                          <code
                            className="block truncate font-mono text-[12px] text-editorial-neutral-3"
                            title={el.elementId}
                          >
                            {el.elementId}
                          </code>
                        </TableCell>
                        <TableCell mono>{el.total}</TableCell>
                        <TableCell mono>
                          {el.avgRating !== null ? `${el.avgRating} / 5` : '—'}
                        </TableCell>
                        <td
                          className={`hidden py-3 text-left font-mono text-[13px] tabular-nums md:table-cell ${deltaColor(el.ratingDelta)}`}
                        >
                          {formatDelta(el.ratingDelta)}
                        </td>
                        <TableCell mono>
                          {el.positiveRate !== null ? `${el.positiveRate}%` : '—'}
                        </TableCell>
                        <td
                          className={`hidden py-3 text-left font-mono text-[13px] tabular-nums md:table-cell ${deltaPctColor(el.positiveDelta)}`}
                        >
                          {formatDelta(el.positiveDelta, 'pp')}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleArchiveToggle(el.elementId, false)}
                            disabled={archivingId === el.elementId}
                            className="rounded p-1 text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
                            title="Unarchive element"
                            aria-label="Unarchive element"
                          >
                            <svg
                              className="h-3.5 w-3.5"
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </EditorialCard>
      )}
    </div>
  );
}
