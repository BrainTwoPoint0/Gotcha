import React, { useState, useEffect, useMemo } from 'react';
import { Theme, Size } from '../types';
import { useScore } from '../hooks/useScore';
import { resolveTheme } from '../theme/resolveTheme';
import { useGotchaContext } from './GotchaProvider';

export type ScoreVariant = 'stars' | 'number' | 'compact' | 'votes';

export interface GotchaScoreProps {
  elementId: string;
  variant?: ScoreVariant;
  showCount?: boolean;
  size?: Size;
  theme?: Theme;
  refreshInterval?: number;
  style?: React.CSSProperties;
}

const SIZE_MAP: Record<Size, {
  fontSize: number;
  ratingFontSize: number;
  starSize: number;
  gap: number;
  pillPx: number;
  pillPy: number;
  barHeight: number;
  iconSize: number;
}> = {
  sm: { fontSize: 11, ratingFontSize: 13, starSize: 13, gap: 5, pillPx: 8, pillPy: 4, barHeight: 3, iconSize: 12 },
  md: { fontSize: 12.5, ratingFontSize: 15, starSize: 15, gap: 6, pillPx: 10, pillPy: 5, barHeight: 4, iconSize: 14 },
  lg: { fontSize: 14, ratingFontSize: 18, starSize: 18, gap: 8, pillPx: 12, pillPy: 6, barHeight: 5, iconSize: 16 },
};

/** Crisp, rounded 5-point star SVG with partial fill via clipPath */
function Stars({ rating, size, filledColor, emptyColor }: {
  rating: number;
  size: number;
  filledColor: string;
  emptyColor: string;
}) {
  const clipId = `gotcha-star-clip-${Math.random().toString(36).slice(2, 8)}`;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill = Math.min(1, Math.max(0, rating - (i - 1)));
    const id = `${clipId}-${i}`;
    stars.push(
      <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
        <defs>
          <clipPath id={id}>
            <rect x="0" y="0" width={24 * fill} height="24" />
          </clipPath>
        </defs>
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={emptyColor}
        />
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={filledColor}
          clipPath={`url(#${id})`}
        />
      </svg>
    );
  }
  return <span style={{ display: 'inline-flex', gap: Math.max(1, size * 0.08), alignItems: 'center' }}>{stars}</span>;
}

/** Compact positive rate bar */
function PositiveBar({ rate, height, filledColor, trackColor }: {
  rate: number;
  height: number;
  filledColor: string;
  trackColor: string;
}) {
  return (
    <span style={{
      display: 'inline-block',
      width: 48,
      height,
      borderRadius: height,
      backgroundColor: trackColor,
      overflow: 'hidden',
      verticalAlign: 'middle',
    }}>
      <span style={{
        display: 'block',
        width: `${rate}%`,
        height: '100%',
        borderRadius: height,
        background: filledColor,
        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }} />
    </span>
  );
}

/** Thumbs up SVG icon — outlined stroke to match VoteMode's treatment */
function ThumbIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block' }}
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

export function GotchaScore({
  elementId,
  variant = 'stars',
  showCount = true,
  size = 'md',
  theme = 'auto',
  refreshInterval,
  style,
}: GotchaScoreProps) {
  const { score, isLoading } = useScore({ elementId, refreshInterval });
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mq.matches ? 'dark' : 'light');
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const { themeConfig } = useGotchaContext();
  const t = useMemo(() => resolveTheme(theme, systemTheme, themeConfig), [theme, systemTheme, themeConfig]);

  if (isLoading || !score) return null;
  const s = SIZE_MAP[size];

  // Color tokens from resolved theme
  const ratingColor = t.colors.text;
  const mutedColor = t.colors.textDisabled;
  const starFilled = t.colors.starFilled;
  const starEmpty = t.colors.starEmpty;
  const positiveColor = t.colors.voteUp;
  const positiveTrack = t.colors.starEmpty;

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: s.gap,
    fontFamily: t.typography.fontFamily,
    lineHeight: 1,
    WebkitFontSmoothing: 'antialiased',
    ...style,
  };

  // Rating number: body-sans at bold weight, tabular numerals so widths
  // stay uniform across rating changes. Reads as a data readout — the
  // counterpart to the editorial count label beneath.
  const ratingNumberStyle: React.CSSProperties = {
    fontFamily: t.typography.fontFamily,
    fontSize: s.ratingFontSize,
    fontWeight: 700,
    color: ratingColor,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.01em',
    lineHeight: 1,
  };

  // Count label — small-caps mono, matches modal eyebrow + dashboard
  // stat-card sub-text pattern. Quiet typographic signature that ties
  // the score surface into the rest of the editorial system.
  const countLabelStyle: React.CSSProperties = {
    fontFamily:
      "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
    fontSize: Math.max(9, s.fontSize - 1),
    color: mutedColor,
    fontWeight: 400,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  };

  const countText = (n: number, singular: string) => {
    const label = n === 1 ? singular : `${singular}s`;
    return `${n.toLocaleString()} ${label}`;
  };

  // ── Votes variant ──────────────────────────────────────────────
  if (variant === 'votes') {
    const { voteCount, positiveRate } = score;
    const total = voteCount.up + voteCount.down;
    if (total === 0) return null;

    return (
      <span style={baseStyle}>
        <ThumbIcon size={s.iconSize} color={positiveColor} />
        <span style={{ ...ratingNumberStyle, color: positiveColor }}>{positiveRate}%</span>
        <PositiveBar rate={positiveRate ?? 0} height={s.barHeight} filledColor={positiveColor} trackColor={positiveTrack} />
        {showCount && (
          <span style={countLabelStyle}>{countText(total, 'vote')}</span>
        )}
      </span>
    );
  }

  // ── Rating-based variants ──────────────────────────────────────
  const { averageRating, totalResponses } = score;
  if (averageRating === null || totalResponses === 0) return null;

  const displayRating = averageRating.toFixed(1);

  // ── Compact ────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <span style={baseStyle}>
        <svg width={s.starSize} height={s.starSize} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={starFilled}
          />
        </svg>
        <span style={ratingNumberStyle}>{displayRating}</span>
        {showCount && (
          <span style={countLabelStyle}>({totalResponses.toLocaleString()})</span>
        )}
      </span>
    );
  }

  // ── Number ─────────────────────────────────────────────────────
  if (variant === 'number') {
    return (
      <span style={baseStyle}>
        <span style={ratingNumberStyle}>{displayRating}</span>
        <span style={{ ...countLabelStyle, marginLeft: 2 }}>/ 5</span>
        {showCount && (
          <span style={{ ...countLabelStyle, marginLeft: 2 }}>
            ({countText(totalResponses, 'response')})
          </span>
        )}
      </span>
    );
  }

  // ── Stars (default) ────────────────────────────────────────────
  return (
    <span style={baseStyle}>
      <Stars rating={averageRating} size={s.starSize} filledColor={starFilled} emptyColor={starEmpty} />
      <span style={ratingNumberStyle}>{displayRating}</span>
      {showCount && (
        <span style={countLabelStyle}>({countText(totalResponses, 'response')})</span>
      )}
    </span>
  );
}
