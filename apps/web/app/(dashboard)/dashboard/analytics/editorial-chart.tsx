'use client';

/**
 * Shared editorial primitives for the analytics pages — EditorialCard,
 * ChartFrame, DataTable helpers, and the palette/tick/tooltip tokens that
 * every chart on `/dashboard/analytics/**` uses.
 *
 * Consolidating here keeps the visual vocabulary consistent across
 * `charts.tsx`, `segments/segment-charts.tsx`, and any future tab files
 * without duplicating the palette constants or the chart-axis defaults.
 */

import React from 'react';
import { ResponsiveContainer, XAxis } from 'recharts';

// ── Palette ───────────────────────────────────────────────────
// rgb() literals mirror the CSS custom properties in app/globals.css so
// chart fills stay in lockstep with the rest of the dashboard.
export const EDITORIAL = {
  ink: 'rgb(26 23 20)',
  paper: 'rgb(250 248 244)',
  accent: 'rgb(212 83 42)',
  rule: 'rgb(232 226 217)',
  muted: 'rgb(107 101 93)',
  success: 'rgb(74 107 62)',
  alert: 'rgb(155 58 46)',
} as const;

// ── Shared chart tokens ───────────────────────────────────────
// Every BarChart / LineChart axis references these so the entire page
// reads as one designed system, not five different chart libraries.
export const CHART_TICK: React.ComponentProps<typeof XAxis>['tick'] = {
  fontSize: 11,
  fill: EDITORIAL.muted,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

export const CHART_AXIS_LINE = { stroke: EDITORIAL.rule };

export const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: EDITORIAL.paper,
  border: `1px solid ${EDITORIAL.rule}`,
  borderRadius: 6,
  fontSize: 12,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
  color: EDITORIAL.ink,
  padding: '8px 10px',
  boxShadow: 'none',
};

export const TOOLTIP_CURSOR = { fill: 'rgba(26,23,20,0.04)' };

// ── Truncation ────────────────────────────────────────────────
export const SEGMENT_LABEL_MAX = 22;
export function truncateLabel(value: string, max = SEGMENT_LABEL_MAX): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

// ── NPS semantic fill ─────────────────────────────────────────
// Three-tier: sage promoters (≥50), ink passives (0–49), clay detractors
// (<0). Matches the stacked-bar segmentation language used in the NPS
// breakdown card.
export function npsFill(value: number | null): string {
  if (value === null) return EDITORIAL.muted;
  if (value >= 50) return EDITORIAL.success;
  if (value >= 0) return EDITORIAL.ink;
  return EDITORIAL.alert;
}

// ── EditorialCard ─────────────────────────────────────────────
// Hairline-bordered paper card with optional eyebrow + Fraunces title
// header. Drop-in replacement for shadcn Card inside the analytics pages.
export function EditorialCard({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-editorial-neutral-2 bg-editorial-paper p-6 md:p-8">
      {(eyebrow || title) && (
        <header className="mb-5 border-b border-editorial-neutral-2 pb-4">
          {eyebrow && (
            <div className="mb-2 flex items-center gap-3">
              <span className="h-px w-6 bg-editorial-neutral-3/60" aria-hidden="true" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                {eyebrow}
              </span>
            </div>
          )}
          {title && (
            <h2 className="font-display text-[1.25rem] font-normal leading-[1.25] tracking-[-0.01em] text-editorial-ink sm:text-[1.4rem]">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-1.5 text-[13px] leading-[1.55] text-editorial-neutral-3">{subtitle}</p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

// ── ChartFrame ────────────────────────────────────────────────
// Fixed-height responsive container so every chart on the page shares a
// consistent vertical rhythm.
export function ChartFrame({
  children,
  height = 'md',
}: {
  children: React.ReactElement;
  height?: 'sm' | 'md' | 'lg';
}) {
  const cls = {
    sm: 'h-44 min-h-[176px] sm:h-52 sm:min-h-[208px]',
    md: 'h-56 min-h-[192px] sm:h-64 sm:min-h-[256px]',
    lg: 'h-72 min-h-[240px] sm:h-80 sm:min-h-[320px]',
  }[height];
  return (
    <div className={cls}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

// ── Table helpers ─────────────────────────────────────────────
// Editorial table primitives — small-caps mono headers + ink body cells
// with tabular-nums alignment, hairline row rules, and a subtle hover
// tint. Left-aligned by default; values sit directly under their headers
// so long rows don't create rivers of whitespace.
export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
      {children}
    </th>
  );
}

export function TableCell({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td
      className={`py-3 text-left text-[13px] text-editorial-ink ${
        mono ? 'font-mono tabular-nums' : ''
      }`}
    >
      {children}
    </td>
  );
}

export function EditorialTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse">{children}</table>
    </div>
  );
}
