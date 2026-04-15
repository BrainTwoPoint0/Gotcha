import React, { useEffect, useState } from 'react';
import { ResolvedTheme } from '../../theme/tokens';
import { isTouchDevice } from '../../utils/device';

interface VoteModeProps {
  resolvedTheme: ResolvedTheme;
  isLoading: boolean;
  onSubmit: (data: { vote: 'up' | 'down' }) => void;
  initialVote?: 'up' | 'down' | null;
  isEditing?: boolean;
  labels?: { up: string; down: string };
}

/**
 * Vote mode — two editorial pills. Up/down semantics come from the icon
 * shape and the label, not from colour. Selected state fills the pill
 * with ink. Unselected is paper with a hairline border; hover darkens
 * the border to ink.
 *
 * Loading affordance: the active pill's label switches to italic
 * "Sending…". No translateY bounce, no spinner, no shimmer — the
 * editorial discipline is to stay still while waiting.
 *
 * Back-compat: reads vote* tokens (voteUp / voteUpSurface / voteUpBorder
 * and down equivalents) so customers who override them via `themeConfig`
 * still get their override. Default values in tokens.ts now resolve to
 * the same ink/rule pair, so the default aesthetic is uniform.
 */
export function VoteMode({
  resolvedTheme: t,
  isLoading,
  onSubmit,
  initialVote,
  isEditing = false,
  labels,
}: VoteModeProps) {
  const [isTouch, setIsTouch] = useState(false);
  const [activeVote, setActiveVote] = useState<'up' | 'down' | null>(initialVote || null);
  const [previousVote, setPreviousVote] = useState<'up' | 'down' | null>(initialVote || null);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  useEffect(() => {
    if (initialVote !== undefined) {
      setPreviousVote(initialVote);
      setActiveVote(initialVote);
    }
  }, [initialVote]);

  useEffect(() => {
    if (!isLoading && !isEditing) {
      setActiveVote(null);
    }
  }, [isLoading, isEditing]);

  const handleVote = (vote: 'up' | 'down') => {
    setActiveVote(vote);
    onSubmit({ vote });
  };

  const iconSize = isTouch ? 24 : 20;

  const getButtonStyles = (voteType: 'up' | 'down'): React.CSSProperties => {
    const isSelected = previousVote === voteType;
    // Read through the vote-specific tokens so customer overrides survive.
    const accent = voteType === 'up' ? t.colors.voteUp : t.colors.voteDown;
    const surface = voteType === 'up' ? t.colors.voteUpSurface : t.colors.voteDownSurface;
    const border = voteType === 'up' ? t.colors.voteUpBorder : t.colors.voteDownBorder;
    return {
      flex: 1,
      minWidth: 0,
      padding: isTouch ? '14px 18px' : '11px 16px',
      border: `1px solid ${isSelected ? accent : border}`,
      borderRadius: t.borders.radius.full,
      background: isSelected ? accent : surface,
      color: isSelected ? t.colors.primaryText : t.colors.text,
      fontSize: isTouch ? 15 : 13,
      fontWeight: t.typography.fontWeight.medium,
      fontFamily: t.typography.fontFamily,
      cursor: isLoading ? 'not-allowed' : 'pointer',
      transition: `background-color ${t.animation.duration.fast} ${t.animation.easing.default}, border-color ${t.animation.duration.fast} ${t.animation.easing.default}, color ${t.animation.duration.fast} ${t.animation.easing.default}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isTouch ? 10 : 8,
      outline: 'none',
    };
  };

  const buildLabel = (voteType: 'up' | 'down', isSelected: boolean): string => {
    if (labels?.[voteType]) return labels[voteType];
    if (voteType === 'up') return isSelected ? 'Liked' : 'Like';
    return isSelected ? 'Disliked' : 'Dislike';
  };

  return (
    <div
      style={{ display: 'flex', gap: isTouch ? 12 : 10 }}
      role="group"
      aria-label="Vote"
    >
      {(['up', 'down'] as const).map((voteType) => {
        const isSelected = previousVote === voteType;
        const isActiveLoading = isLoading && activeVote === voteType;
        const label = buildLabel(voteType, isSelected);
        // aria-label matches the visible label so screen-reader users hear
        // "Like / Liked" rather than a longer expanded description that
        // drifts from sighted UX.
        const ariaLabel = isActiveLoading
          ? `${label}, submitting`
          : label;
        const inactiveBorder =
          voteType === 'up' ? t.colors.voteUpBorder : t.colors.voteDownBorder;
        return (
          <button
            key={voteType}
            type="button"
            onClick={() => handleVote(voteType)}
            disabled={isLoading}
            style={getButtonStyles(voteType)}
            aria-label={ariaLabel}
            aria-pressed={isSelected}
            onMouseEnter={(e) => {
              if (isLoading || isSelected) return;
              e.currentTarget.style.borderColor = t.colors.inputBorderFocus;
            }}
            onMouseLeave={(e) => {
              if (isSelected) return;
              e.currentTarget.style.borderColor = inactiveBorder;
            }}
          >
            {voteType === 'up' ? <ThumbsUpIcon size={iconSize} /> : <ThumbsDownIcon size={iconSize} />}
            <span style={{ fontStyle: isActiveLoading ? 'italic' : 'normal' }}>
              {isActiveLoading
                ? (isEditing ? 'Updating…' : 'Sending…')
                : label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ThumbsUpIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbsDownIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}
