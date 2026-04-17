'use client';

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { EditorialCard } from './editorial-chart';

interface HeatmapChartProps {
  data: Array<{ dow: number; hour: number; count: number }>;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Editorial five-step intensity scale — paper at zero, ramping through
// progressively deeper ink tints. Matches the rest of the dashboard's
// ink-on-paper vocabulary; no slate-blue.
const CELL_EMPTY = 'rgb(250 248 244)'; // paper
const CELL_STEPS = [
  'rgba(26, 23, 20, 0.08)',
  'rgba(26, 23, 20, 0.22)',
  'rgba(26, 23, 20, 0.45)',
  'rgba(26, 23, 20, 0.72)',
  'rgba(26, 23, 20, 1)',
];

function stepForIntensity(intensity: number): string {
  if (intensity === 0) return CELL_EMPTY;
  if (intensity < 0.25) return CELL_STEPS[0];
  if (intensity < 0.5) return CELL_STEPS[1];
  if (intensity < 0.75) return CELL_STEPS[2];
  if (intensity < 1) return CELL_STEPS[3];
  return CELL_STEPS[4];
}

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

  // Build lookup + find max for intensity normalization.
  const lookup: Record<string, number> = {};
  let maxCount = 0;
  data.forEach((d) => {
    const key = `${d.dow}-${d.hour}`;
    lookup[key] = d.count;
    if (d.count > maxCount) maxCount = d.count;
  });

  if (maxCount === 0) {
    return (
      <EditorialCard>
        <p className="py-10 text-center text-[13px] text-editorial-neutral-3">
          No activity data to display.
        </p>
      </EditorialCard>
    );
  }

  return (
    <EditorialCard
      eyebrow="Activity"
      title="When feedback arrives"
      subtitle="Responses by day of week and hour of day."
    >
      <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
        <div className="min-w-[540px]" onMouseLeave={handleMouseLeave}>
          {/* Hour tick labels */}
          <div className="mb-2 ml-12 flex">
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex-1 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-editorial-neutral-3/80 sm:text-[10px]"
              >
                {h % 3 === 0 ? `${h}:00` : ''}
              </div>
            ))}
          </div>

          {/* Grid */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="mb-0.5 flex items-center">
              <div className="w-12 shrink-0 pr-3 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3">
                {day}
              </div>
              <div className="flex flex-1 gap-[2px]">
                {HOURS.map((hour) => {
                  const count = lookup[`${dayIdx}-${hour}`] || 0;
                  const intensity = count / maxCount;
                  return (
                    <div
                      key={hour}
                      className="aspect-square flex-1 cursor-pointer rounded-[2px] border border-editorial-neutral-2/60 transition-transform duration-240 hover:scale-[1.08]"
                      style={{ backgroundColor: stepForIntensity(intensity) }}
                      onMouseEnter={(e) => handleMouseEnter(e, day, hour, count)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="mt-5 flex items-center justify-end gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3">
              Less
            </span>
            {[CELL_EMPTY, ...CELL_STEPS].map((color, i) => (
              <div
                key={i}
                className="h-3 w-3 rounded-[2px] border border-editorial-neutral-2/60"
                style={{ backgroundColor: color }}
              />
            ))}
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3">
              More
            </span>
          </div>
        </div>
      </div>

      {/* Portal tooltip — renders outside all overflow containers */}
      {tooltip &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="pointer-events-none fixed -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-editorial-neutral-2 bg-editorial-paper px-2.5 py-1.5 font-mono text-[11px] text-editorial-ink"
            style={{ left: tooltip.x, top: tooltip.y, zIndex: 9999 }}
          >
            <span className="uppercase tracking-[0.14em] text-editorial-neutral-3">
              {tooltip.day} {tooltip.hour}:00
            </span>
            <span className="mx-2 text-editorial-neutral-3">·</span>
            <span className="tabular-nums text-editorial-ink">
              {tooltip.count} response{tooltip.count !== 1 ? 's' : ''}
            </span>
          </div>,
          document.body
        )}
    </EditorialCard>
  );
}
