import React, { useEffect, useState } from 'react';
import { isTouchDevice } from '../../utils/device';
import { Spinner } from '../Spinner';

interface VoteModeProps {
  theme: 'light' | 'dark' | 'custom';
  isLoading: boolean;
  onSubmit: (data: { vote: 'up' | 'down' }) => void;
  initialVote?: 'up' | 'down' | null;
  isEditing?: boolean;
}

export function VoteMode({ theme, isLoading, onSubmit, initialVote, isEditing = false }: VoteModeProps) {
  const [isTouch, setIsTouch] = useState(false);
  const [activeVote, setActiveVote] = useState<'up' | 'down' | null>(initialVote || null);
  const [previousVote, setPreviousVote] = useState<'up' | 'down' | null>(initialVote || null);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  // Update when initialVote changes (e.g., after loading existing response)
  useEffect(() => {
    if (initialVote !== undefined) {
      setPreviousVote(initialVote);
      setActiveVote(initialVote);
    }
  }, [initialVote]);

  // Reset active vote when loading completes (but keep previous vote for edit mode)
  useEffect(() => {
    if (!isLoading && !isEditing) {
      setActiveVote(null);
    }
  }, [isLoading, isEditing]);

  const handleVote = (vote: 'up' | 'down') => {
    setActiveVote(vote);
    onSubmit({ vote });
  };

  const isDark = theme === 'dark';

  const getButtonStyles = (voteType: 'up' | 'down'): React.CSSProperties => {
    const isSelected = previousVote === voteType;
    return {
      flex: 1,
      padding: isTouch ? '16px 20px' : '12px 16px',
      border: isSelected
        ? `2px solid ${voteType === 'up' ? '#22c55e' : '#ef4444'}`
        : `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      borderRadius: isTouch ? 12 : 8,
      backgroundColor: isSelected
        ? (voteType === 'up' ? (isDark ? '#14532d' : '#dcfce7') : (isDark ? '#450a0a' : '#fee2e2'))
        : (isDark ? '#374151' : '#f9fafb'),
      color: isDark ? '#f9fafb' : '#111827',
      fontSize: isTouch ? 28 : 24,
      cursor: isLoading ? 'not-allowed' : 'pointer',
      transition: 'all 150ms ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isTouch ? 10 : 8,
    };
  };

  const iconSize = isTouch ? 28 : 24;

  return (
    <div
      style={{
        display: 'flex',
        gap: isTouch ? 16 : 12,
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
      >
        {isLoading && activeVote === 'up' ? (
          <>
            <Spinner size={iconSize} color={isDark ? '#f9fafb' : '#111827'} />
            <span style={{ fontSize: isTouch ? 16 : 14, fontWeight: 500 }}>
              {isEditing ? 'Updating...' : 'Sending...'}
            </span>
          </>
        ) : (
          <>
            <ThumbsUpIcon size={iconSize} />
            <span style={{ fontSize: isTouch ? 16 : 14, fontWeight: 500 }}>
              {previousVote === 'up' ? 'Liked' : 'Like'}
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
      >
        {isLoading && activeVote === 'down' ? (
          <>
            <Spinner size={iconSize} color={isDark ? '#f9fafb' : '#111827'} />
            <span style={{ fontSize: isTouch ? 16 : 14, fontWeight: 500 }}>
              {isEditing ? 'Updating...' : 'Sending...'}
            </span>
          </>
        ) : (
          <>
            <ThumbsDownIcon size={iconSize} />
            <span style={{ fontSize: isTouch ? 16 : 14, fontWeight: 500 }}>
              {previousVote === 'down' ? 'Disliked' : 'Dislike'}
            </span>
          </>
        )}
      </button>
    </div>
  );
}

function ThumbsUpIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbsDownIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}
