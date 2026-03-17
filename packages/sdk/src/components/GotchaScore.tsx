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

/** Thumbs up SVG icon */
function ThumbIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'block' }}>
      <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66a4.8 4.8 0 00-.88-1.12L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z" />
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
    letterSpacing: '-0.01em',
    WebkitFontSmoothing: 'antialiased',
    ...style,
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
        <span style={{ fontSize: s.ratingFontSize, fontWeight: 600, color: positiveColor, fontVariantNumeric: 'tabular-nums' }}>
          {positiveRate}%
        </span>
        <PositiveBar rate={positiveRate ?? 0} height={s.barHeight} filledColor={positiveColor} trackColor={positiveTrack} />
        {showCount && (
          <span style={{ fontSize: s.fontSize, color: mutedColor, fontWeight: 400 }}>
            {countText(total, 'vote')}
          </span>
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
        <span style={{ fontSize: s.ratingFontSize, fontWeight: 700, color: ratingColor, fontVariantNumeric: 'tabular-nums' }}>
          {displayRating}
        </span>
        {showCount && (
          <span style={{ fontSize: s.fontSize, color: mutedColor, fontWeight: 400 }}>
            ({totalResponses.toLocaleString()})
          </span>
        )}
      </span>
    );
  }

  // ── Number ─────────────────────────────────────────────────────
  if (variant === 'number') {
    return (
      <span style={baseStyle}>
        <span style={{ fontSize: s.ratingFontSize, fontWeight: 700, color: ratingColor, fontVariantNumeric: 'tabular-nums' }}>
          {displayRating}
        </span>
        <span style={{ fontSize: s.fontSize, color: mutedColor, fontWeight: 400 }}>/ 5</span>
        {showCount && (
          <span style={{
            fontSize: s.fontSize,
            color: mutedColor,
            fontWeight: 400,
            marginLeft: 2,
          }}>
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
      <span style={{ fontSize: s.ratingFontSize, fontWeight: 700, color: ratingColor, fontVariantNumeric: 'tabular-nums' }}>
        {displayRating}
      </span>
      {showCount && (
        <span style={{ fontSize: s.fontSize, color: mutedColor, fontWeight: 400 }}>
          ({countText(totalResponses, 'response')})
        </span>
      )}
    </span>
  );
}
