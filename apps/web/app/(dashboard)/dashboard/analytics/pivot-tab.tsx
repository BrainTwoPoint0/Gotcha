'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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

  // Calculate max for intensity shading
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
    if (intensity < 0.2) return 'bg-slate-50';
    if (intensity < 0.4) return 'bg-slate-100';
    if (intensity < 0.6) return 'bg-slate-200';
    if (intensity < 0.8) return 'bg-slate-300';
    return 'bg-slate-400 text-white';
  };

  return (
    <div className="space-y-6">
      {/* Dimension selectors */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
            <div className="w-full sm:w-auto space-y-1">
              <Label>Row Dimension</Label>
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
            </div>

            <div className="w-full sm:w-auto space-y-1">
              <Label>Column Dimension</Label>
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
            </div>

            <Button onClick={applyPivot} className="flex-1 sm:flex-none">
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {!data && (
        <Card className="text-center py-16">
          <h3 className="text-lg font-medium text-gray-900">Select dimensions</h3>
          <p className="mt-2 text-gray-500">
            Choose a row and column dimension to see a cross-tabulation of your responses.
          </p>
        </Card>
      )}

      {/* Pivot table */}
      {data && data.rows.length > 0 && data.cols.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {dimensions.find((d) => d.key === selectedRow)?.label ?? selectedRow} ×{' '}
              {dimensions.find((d) => d.key === selectedCol)?.label ?? selectedCol}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-2 pl-4 sm:pl-2 text-xs font-medium uppercase text-gray-400">
                      {dimensions.find((d) => d.key === selectedRow)?.label ?? 'Row'}
                    </th>
                    {data.cols.map((col) => (
                      <th
                        key={col}
                        className="text-center p-2 text-xs font-medium uppercase text-gray-400 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                    <th className="text-center p-2 pr-4 sm:pr-2 text-xs font-medium uppercase text-gray-500">
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
                      <tr key={row} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="p-2 pl-4 sm:pl-2 font-medium text-gray-700 whitespace-nowrap">
                          {row}
                        </td>
                        {data.cols.map((col) => {
                          const count = data.cells[row]?.[col] || 0;
                          return (
                            <td
                              key={col}
                              className={`text-center p-2 tabular-nums ${cellBg(count)}`}
                            >
                              {count || '-'}
                            </td>
                          );
                        })}
                        <td className="text-center p-2 pr-4 sm:pr-2 font-medium tabular-nums text-gray-900">
                          {rowTotal}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Column totals */}
                  <tr className="border-t-2 border-gray-200">
                    <td className="p-2 pl-4 sm:pl-2 font-medium text-gray-500 text-xs uppercase">
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
                          className="text-center p-2 font-medium tabular-nums text-gray-900"
                        >
                          {colTotal}
                        </td>
                      );
                    })}
                    <td className="text-center p-2 pr-4 sm:pr-2 font-bold tabular-nums text-gray-900">
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
          </CardContent>
        </Card>
      )}

      {data && (data.rows.length === 0 || data.cols.length === 0) && (
        <Card className="text-center py-12">
          <p className="text-gray-500">No data for the selected dimensions.</p>
        </Card>
      )}
    </div>
  );
}
