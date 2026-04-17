'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EditorialCard } from './editorial-chart';

interface PivotTabProps {
  data: {
    rows: string[];
    cols: string[];
    cells: Record<string, Record<string, number>>;
  } | null;
  dimensions: { key: string; label: string }[];
  selectedRow?: string;
  selectedCol?: string;
}

export function PivotTab({ data, dimensions, selectedRow, selectedCol }: PivotTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rowDim, setRowDim] = useState(selectedRow || '');
  const [colDim, setColDim] = useState(selectedCol || '');

  const applyPivot = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'pivot');
    if (rowDim) params.set('pivotRow', rowDim);
    else params.delete('pivotRow');
    if (colDim) params.set('pivotCol', colDim);
    else params.delete('pivotCol');
    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  // Heatmap intensity — editorial ink at progressive alpha. Matches the
  // heatmap-chart on the main analytics page (5-step ink ramp on paper).
  let maxCell = 0;
  if (data) {
    data.rows.forEach((r) => {
      data.cols.forEach((c) => {
        const val = data.cells[r]?.[c] || 0;
        if (val > maxCell) maxCell = val;
      });
    });
  }

  const cellBg = (count: number): string => {
    if (!count || !maxCell) return '';
    const intensity = count / maxCell;
    if (intensity < 0.2) return 'bg-editorial-ink/[0.05]';
    if (intensity < 0.4) return 'bg-editorial-ink/[0.12]';
    if (intensity < 0.6) return 'bg-editorial-ink/[0.24]';
    if (intensity < 0.8) return 'bg-editorial-ink/[0.55] text-editorial-paper';
    return 'bg-editorial-ink text-editorial-paper';
  };

  return (
    <div className="space-y-6">
      {/* Dimension selectors */}
      <EditorialCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <DimensionField label="Row dimension">
            <Select
              value={rowDim || '__none__'}
              onValueChange={(v) => setRowDim(v === '__none__' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select dimension" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select dimension</SelectItem>
                {dimensions.map((d) => (
                  <SelectItem key={d.key} value={d.key}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DimensionField>

          <DimensionField label="Column dimension">
            <Select
              value={colDim || '__none__'}
              onValueChange={(v) => setColDim(v === '__none__' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select dimension" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select dimension</SelectItem>
                {dimensions.map((d) => (
                  <SelectItem key={d.key} value={d.key}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DimensionField>

          <button
            type="button"
            onClick={applyPivot}
            className="inline-flex items-center justify-center rounded-md bg-editorial-ink px-4 py-2 text-[13px] font-medium text-editorial-paper transition-colors duration-240 ease-page-turn hover:bg-editorial-ink/90 sm:self-end"
          >
            Apply
          </button>
        </div>
      </EditorialCard>

      {/* Empty state */}
      {!data && (
        <EditorialCard>
          <div className="py-10 text-center">
            <p className="text-[14px] text-editorial-ink">Select dimensions</p>
            <p className="mt-1.5 text-[13px] text-editorial-neutral-3">
              Choose a row and column dimension to see a cross-tabulation of your responses.
            </p>
          </div>
        </EditorialCard>
      )}

      {/* Pivot table */}
      {data && data.rows.length > 0 && data.cols.length > 0 && (
        <EditorialCard
          eyebrow="Pivot"
          title={`${dimensions.find((d) => d.key === selectedRow)?.label ?? selectedRow} × ${
            dimensions.find((d) => d.key === selectedCol)?.label ?? selectedCol
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] border-collapse text-[13px]">
              <thead>
                <tr className="border-y border-editorial-neutral-2">
                  <th className="py-2.5 pr-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                    {dimensions.find((d) => d.key === selectedRow)?.label ?? 'Row'}
                  </th>
                  {data.cols.map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-2 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3"
                    >
                      {col}
                    </th>
                  ))}
                  <th className="py-2.5 pl-3 text-right font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => {
                  const rowTotal = data.cols.reduce(
                    (sum, col) => sum + (data.cells[row]?.[col] || 0),
                    0
                  );
                  return (
                    <tr
                      key={row}
                      className="border-b border-editorial-neutral-2 transition-colors duration-240 hover:bg-editorial-ink/[0.02]"
                    >
                      <td className="whitespace-nowrap py-3 pr-3 text-[13px] text-editorial-ink">
                        {row}
                      </td>
                      {data.cols.map((col) => {
                        const count = data.cells[row]?.[col] || 0;
                        return (
                          <td
                            key={col}
                            className={`px-2 py-3 text-center font-mono text-[13px] tabular-nums ${cellBg(count)}`}
                          >
                            {count || '—'}
                          </td>
                        );
                      })}
                      <td className="py-3 pl-3 text-right font-mono text-[13px] tabular-nums text-editorial-ink">
                        {rowTotal}
                      </td>
                    </tr>
                  );
                })}
                {/* Column totals */}
                <tr className="border-t-2 border-editorial-neutral-2">
                  <td className="py-3 pr-3 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                    Total
                  </td>
                  {data.cols.map((col) => {
                    const colTotal = data.rows.reduce(
                      (sum, row) => sum + (data.cells[row]?.[col] || 0),
                      0
                    );
                    return (
                      <td
                        key={col}
                        className="px-2 py-3 text-center font-mono text-[13px] tabular-nums text-editorial-ink"
                      >
                        {colTotal}
                      </td>
                    );
                  })}
                  <td className="py-3 pl-3 text-right font-mono text-[13px] font-semibold tabular-nums text-editorial-ink">
                    {data.rows.reduce(
                      (sum, row) =>
                        sum + data.cols.reduce((s, col) => s + (data.cells[row]?.[col] || 0), 0),
                      0
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </EditorialCard>
      )}

      {data && (data.rows.length === 0 || data.cols.length === 0) && (
        <EditorialCard>
          <p className="py-10 text-center text-[13px] text-editorial-neutral-3">
            No data for the selected dimensions.
          </p>
        </EditorialCard>
      )}
    </div>
  );
}

function DimensionField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="w-full sm:w-auto">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
        {label}
      </span>
      {children}
    </div>
  );
}
