'use client';

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HeatmapChartProps {
  data: Array<{ dow: number; hour: number; count: number }>;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function HeatmapChart({ data }: HeatmapChartProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    day: string;
    hour: number;
    count: number;
  } | null>(null);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, day: string, hour: number, count: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        day,
        hour,
        count,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  // Build lookup
  const lookup: Record<string, number> = {};
  let maxCount = 0;
  data.forEach((d) => {
    const key = `${d.dow}-${d.hour}`;
    lookup[key] = d.count;
    if (d.count > maxCount) maxCount = d.count;
  });

  if (maxCount === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-500 text-sm">No activity data to display.</p>
      </Card>
    );
  }

  const getCellColor = (count: number): string => {
    if (count === 0) return '#f8fafc';
    const intensity = count / maxCount;
    if (intensity < 0.25) return '#cbd5e1';
    if (intensity < 0.5) return '#94a3b8';
    if (intensity < 0.75) return '#475569';
    return '#1e293b';
  };

  return (
    <Card>
      <CardHeader className="pb-2 px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">Activity Heatmap</CardTitle>
        <p className="text-xs text-gray-400 mt-0.5">Responses by day of week and hour</p>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 pb-4">
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="min-w-[520px]" onMouseLeave={handleMouseLeave}>
            {/* Hour labels */}
            <div className="flex ml-10 mb-1">
              {HOURS.map((h) => (
                <div key={h} className="flex-1 text-center text-[9px] sm:text-[10px] text-gray-400">
                  {h % 3 === 0 ? `${h}:00` : ''}
                </div>
              ))}
            </div>

            {/* Grid */}
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="flex items-center mb-0.5">
                <div className="w-10 text-right pr-2 text-[10px] sm:text-xs text-gray-500 flex-shrink-0">
                  {day}
                </div>
                <div className="flex flex-1 gap-px">
                  {HOURS.map((hour) => {
                    const count = lookup[`${dayIdx}-${hour}`] || 0;
                    return (
                      <div
                        key={hour}
                        className="flex-1 aspect-square rounded-[2px] sm:rounded-[3px] cursor-pointer transition-transform hover:scale-110"
                        style={{ backgroundColor: getCellColor(count) }}
                        onMouseEnter={(e) => handleMouseEnter(e, day, hour, count)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-gray-400">
              <span>Less</span>
              {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-[2px]"
                  style={{
                    backgroundColor:
                      intensity === 0
                        ? '#f8fafc'
                        : intensity < 0.25
                          ? '#cbd5e1'
                          : intensity < 0.5
                            ? '#94a3b8'
                            : intensity < 0.75
                              ? '#475569'
                              : '#1e293b',
                  }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Portal tooltip — renders outside all overflow containers */}
        {tooltip &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              className="fixed pointer-events-none bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded shadow-lg -translate-x-1/2 -translate-y-full whitespace-nowrap"
              style={{ left: tooltip.x, top: tooltip.y, zIndex: 9999 }}
            >
              {tooltip.day} {tooltip.hour}:00–{tooltip.hour + 1}:00 ·{' '}
              <span className="font-medium">
                {tooltip.count} response{tooltip.count !== 1 ? 's' : ''}
              </span>
            </div>,
            document.body
          )}
      </CardContent>
    </Card>
  );
}
