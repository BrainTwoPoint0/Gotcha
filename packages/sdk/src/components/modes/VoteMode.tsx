import React, { useEffect, useState } from 'react';
import { ResolvedTheme } from '../../theme/tokens';
import { isTouchDevice } from '../../utils/device';
import { Spinner } from '../Spinner';

interface VoteModeProps {
  resolvedTheme: ResolvedTheme;
  isLoading: boolean;
  onSubmit: (data: { vote: 'up' | 'down' }) => void;
  initialVote?: 'up' | 'down' | null;
  isEditing?: boolean;
  labels?: { up: string; down: string };
}

export function VoteMode({ resolvedTheme: t, isLoading, onSubmit, initialVote, isEditing = false, labels }: VoteModeProps) {
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

  const getButtonStyles = (voteType: 'up' | 'down'): React.CSSProperties => {
    const isSelected = previousVote === voteType;
    const color = voteType === 'up' ? t.colors.voteUp : t.colors.voteDown;
    const surface = voteType === 'up' ? t.colors.voteUpSurface : t.colors.voteDownSurface;
    const border = voteType === 'up' ? t.colors.voteUpBorder : t.colors.voteDownBorder;

    return {
      flex: 1,
      minWidth: 0,
      overflow: 'hidden' as const,
      padding: isTouch ? '14px 18px' : '10px 14px',
      border: isSelected
        ? `2px solid ${border}`
        : `1px solid ${t.colors.border}`,
      borderRadius: t.borders.radius.lg - 2,
      background: isSelected
        ? `linear-gradient(135deg, ${surface}, ${surface})`
        : t.colors.surface,
      color: isSelected ? color : t.colors.textSecondary,
      fontSize: isTouch ? 28 : 24,
      fontFamily: t.typography.fontFamily,
      cursor: isLoading ? 'not-allowed' : 'pointer',
      transition: `all 0.2s ${t.animation.easing.default}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isTouch ? 10 : 8,
    };
  };

  const iconSize = isTouch ? 24 : 20;

  return (
    <div
      style={{
        display: 'flex',
        gap: isTouch ? 12 : 10,
      }}
      role="group"
      aria-label="Vote"
    >
      <button
        type="button"
        onClick={() => handleVote('up')}
        disabled={isLoading}
        style={getButtonStyles('up')}
        aria-label="Vote up - I like this"
        aria-pressed={previousVote === 'up'}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = t.shadows.button;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {isLoading && activeVote === 'up' ? (
          <>
            <Spinner size={iconSize} color={t.colors.text} />
            <span style={{ fontSize: isTouch ? 15 : 13, fontWeight: t.typography.fontWeight.medium, letterSpacing: '0.01em' }}>
              {isEditing ? 'Updating...' : 'Sending...'}
            </span>
          </>
        ) : (
          <>
            <ThumbsUpIcon size={iconSize} />
            <span style={{ fontSize: isTouch ? 15 : 13, fontWeight: t.typography.fontWeight.medium, letterSpacing: '0.01em' }}>
              {labels?.up || (previousVote === 'up' ? 'Liked' : 'Like')}
            </span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => handleVote('down')}
        disabled={isLoading}
        style={getButtonStyles('down')}
        aria-label="Vote down - I don't like this"
        aria-pressed={previousVote === 'down'}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = t.shadows.button;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {isLoading && activeVote === 'down' ? (
          <>
            <Spinner size={iconSize} color={t.colors.text} />
            <span style={{ fontSize: isTouch ? 15 : 13, fontWeight: t.typography.fontWeight.medium, letterSpacing: '0.01em' }}>
              {isEditing ? 'Updating...' : 'Sending...'}
            </span>
          </>
        ) : (
          <>
            <ThumbsDownIcon size={iconSize} />
            <span style={{ fontSize: isTouch ? 15 : 13, fontWeight: t.typography.fontWeight.medium, letterSpacing: '0.01em' }}>
              {labels?.down || (previousVote === 'down' ? 'Disliked' : 'Dislike')}
            </span>
          </>
        )}
      </button>
    </div>
  );
}

function ThumbsUpIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbsDownIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}
