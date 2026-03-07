import React, { useState, useEffect } from 'react';
import { GotchaStyles } from '../../types';
import { isTouchDevice } from '../../utils/device';
import { Spinner } from '../Spinner';

interface NpsModeProps {
  theme: 'light' | 'dark' | 'custom';
  submitText: string;
  isLoading: boolean;
  onSubmit: (data: { rating?: number; content?: string }) => void;
  customStyles?: GotchaStyles;
  showFollowUp?: boolean;
  followUpPlaceholder?: string;
  lowLabel?: string;
  highLabel?: string;
  initialValues?: {
    rating?: number | null;
    content?: string | null;
  };
  isEditing?: boolean;
}

// Color per score — smooth gradient from red through amber to green
const SCORE_COLORS = [
  '#ef4444', // 0 — red
  '#f05540', // 1
  '#f1663c', // 2
  '#f27738', // 3
  '#f38834', // 4
  '#f59e0b', // 5 — amber
  '#d4a30e', // 6
  '#b3a812', // 7
  '#79b841', // 8
  '#45c870', // 9
  '#10b981', // 10 — green
];

export function NpsMode({
  theme,
  submitText,
  isLoading,
  onSubmit,
  customStyles,
  showFollowUp = true,
  followUpPlaceholder,
  lowLabel = 'Not likely',
  highLabel = 'Very likely',
  initialValues,
  isEditing = false,
}: NpsModeProps) {
  const [score, setScore] = useState<number | null>(initialValues?.rating ?? null);
  const [content, setContent] = useState(initialValues?.content || '');
  const [isTouch, setIsTouch] = useState(false);
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  useEffect(() => {
    if (initialValues?.rating !== undefined) {
      setScore(initialValues.rating ?? null);
    }
    if (initialValues?.content !== undefined) {
      setContent(initialValues.content || '');
    }
  }, [initialValues?.rating, initialValues?.content]);

  const isDark = theme === 'dark';
  const canSubmit = score !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      rating: score ?? undefined,
      content: showFollowUp && content.trim() ? content.trim() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Score scale */}
      <div style={{ marginBottom: showFollowUp && score !== null ? (isTouch ? 14 : 12) : 0 }}>
        {/* Number buttons */}
        <div
          style={{
            display: 'flex',
            gap: isTouch ? 8 : 6,
            justifyContent: 'center',
          }}
          role="group"
          aria-label="NPS Score"
        >
          {Array.from({ length: 11 }, (_, i) => {
            const selected = score === i;
            const hovered = hoveredScore === i;
            const color = SCORE_COLORS[i];

            return (
              <button
                key={i}
                type="button"
                onClick={() => setScore(i)}
                onMouseEnter={() => setHoveredScore(i)}
                onMouseLeave={() => setHoveredScore(null)}
                aria-label={`Score ${i} out of 10`}
                aria-pressed={selected}
                style={{
                  flex: 1,
                  height: isTouch ? 36 : 32,
                  borderRadius: 8,
                  border: selected
                    ? `2px solid ${color}`
                    : `1.5px solid ${isDark ? `${color}30` : `${color}25`}`,
                  backgroundColor: selected
                    ? color
                    : hovered
                      ? (isDark ? `${color}30` : `${color}18`)
                      : (isDark ? `${color}15` : `${color}0c`),
                  color: selected
                    ? '#fff'
                    : hovered
                      ? color
                      : (isDark ? `${color}cc` : `${color}bb`),
                  fontSize: isTouch ? 13 : 12,
                  fontWeight: selected ? 700 : 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: selected ? 'scale(1.08)' : hovered ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: selected
                    ? `0 2px 8px ${color}40`
                    : 'none',
                  flexShrink: 0,
                }}
              >
                {i}
              </button>
            );
          })}
        </div>

        {/* Labels + category indicator */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 10,
            padding: '0 2px',
          }}
        >
          <span style={{
            fontSize: 10,
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            fontWeight: 500,
          }}>
            {lowLabel}
          </span>


          <span style={{
            fontSize: 10,
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            fontWeight: 500,
          }}>
            {highLabel}
          </span>
        </div>
      </div>

      {/* Follow-up textarea */}
      {showFollowUp && score !== null && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={followUpPlaceholder || 'What\'s the main reason for your score?'}
          style={{
            width: '100%',
            padding: isTouch ? '12px 14px' : '10px 12px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
            borderRadius: 8,
            backgroundColor: isDark ? 'rgba(55,65,81,0.5)' : '#fafbfc',
            color: isDark ? '#f9fafb' : '#111827',
            fontSize: isTouch ? 16 : 14,
            resize: 'vertical' as const,
            minHeight: isTouch ? 80 : 60,
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            lineHeight: 1.5,
            ...customStyles?.input,
          }}
          disabled={isLoading}
          aria-label="Follow-up feedback"
          onFocus={(e) => {
            e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : '#94a3b8';
            e.currentTarget.style.boxShadow = `0 0 0 2px ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`;
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(55,65,81,0.7)' : '#ffffff';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(55,65,81,0.5)' : '#fafbfc';
          }}
        />
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading || !canSubmit}
        style={{
          width: '100%',
          padding: isTouch ? '14px 16px' : '10px 16px',
          border: 'none',
          borderRadius: 8,
          backgroundColor: !canSubmit
            ? (isDark ? '#374151' : '#e2e8f0')
            : (isDark ? '#e2e8f0' : '#1e293b'),
          color: !canSubmit
            ? (isDark ? '#6b7280' : '#94a3b8')
            : (isDark ? '#1e293b' : '#ffffff'),
          fontSize: isTouch ? 16 : 14,
          fontWeight: 500,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          letterSpacing: '0.01em',
          opacity: isLoading ? 0.8 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginTop: 12,
          ...customStyles?.submitButton,
        }}
        onMouseEnter={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = isDark ? '#cbd5e1' : '#334155';
          }
        }}
        onMouseLeave={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = isDark ? '#e2e8f0' : '#1e293b';
          }
        }}
      >
        {isLoading && <Spinner size={isTouch ? 18 : 16} color={isDark ? '#1e293b' : '#ffffff'} />}
        {isLoading ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update' : submitText)}
      </button>
    </form>
  );
}
