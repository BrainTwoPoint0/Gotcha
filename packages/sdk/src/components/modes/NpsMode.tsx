import React, { useState, useEffect } from 'react';
import { GotchaStyles } from '../../types';
import { ResolvedTheme } from '../../theme/tokens';
import { isTouchDevice } from '../../utils/device';
import { Spinner } from '../Spinner';

interface NpsModeProps {
  resolvedTheme: ResolvedTheme;
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

export function NpsMode({
  resolvedTheme: t,
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

  const canSubmit = score !== null;
  const npsColors = t.colors.npsColors;

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
      <div>
        {/* Number buttons — always single row */}
        <div
          style={{
            display: 'flex',
            gap: isTouch ? 4 : 6,
            justifyContent: 'center',
          }}
          role="group"
          aria-label="NPS Score"
        >
          {Array.from({ length: 11 }, (_, i) => {
            const selected = score === i;
            const hovered = hoveredScore === i;
            const color = npsColors[i];

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
                  minWidth: 0,
                  height: isTouch ? 34 : 32,
                  borderRadius: t.borders.radius.sm,
                  border: selected
                    ? `2px solid ${color}`
                    : `1.5px solid ${color}25`,
                  backgroundColor: selected
                    ? color
                    : hovered
                      ? `${color}25`
                      : `${color}0c`,
                  color: selected
                    ? '#fff'
                    : hovered
                      ? color
                      : `${color}bb`,
                  fontSize: 12,
                  fontWeight: selected ? t.typography.fontWeight.bold : t.typography.fontWeight.semibold,
                  fontFamily: t.typography.fontFamily,
                  fontVariantNumeric: 'tabular-nums',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: `all 0.2s ${t.animation.easing.spring}`,
                  transform: selected ? 'scale(1.08)' : hovered ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: selected
                    ? `0 0 12px ${color}40`
                    : 'none',
                  ...customStyles?.npsButton,
                  ...(selected ? customStyles?.npsButtonSelected : {}),
                }}
              >
                {i}
              </button>
            );
          })}
        </div>

        {/* Labels */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 6,
            padding: '0 2px',
            ...customStyles?.npsLabels,
          }}
        >
          <span style={{
            fontSize: t.typography.fontSize.xs,
            color: t.colors.textDisabled,
            fontWeight: t.typography.fontWeight.medium,
            letterSpacing: '0.02em',
          }}>
            {lowLabel}
          </span>
          <span style={{
            fontSize: t.typography.fontSize.xs,
            color: t.colors.textDisabled,
            fontWeight: t.typography.fontWeight.medium,
            letterSpacing: '0.02em',
          }}>
            {highLabel}
          </span>
        </div>
      </div>

      {/* Follow-up textarea — animated reveal */}
      {showFollowUp && score !== null && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={followUpPlaceholder || 'What\'s the main reason for your score?'}
          maxLength={5000}
          style={{
            width: '100%',
            padding: isTouch ? '12px 14px' : '10px 12px',
            border: `1px solid ${t.colors.inputBorder}`,
            borderRadius: t.borders.radius.md,
            backgroundColor: t.colors.inputBackground,
            color: t.colors.text,
            fontSize: isTouch ? t.typography.fontSize.lg : t.typography.fontSize.md,
            resize: 'vertical' as const,
            minHeight: isTouch ? 80 : 60,
            fontFamily: t.typography.fontFamily,
            outline: 'none',
            transition: `border-color ${t.animation.duration.fast} ${t.animation.easing.default}, box-shadow ${t.animation.duration.fast} ${t.animation.easing.default}`,
            lineHeight: 1.5,
            animation: `gotcha-expand-in 0.3s ${t.animation.easing.default} both`,
            overflow: 'hidden',
            ...customStyles?.input,
          }}
          disabled={isLoading}
          aria-label="Follow-up feedback"
          onFocus={(e) => {
            e.currentTarget.style.borderColor = t.colors.inputBorderFocus;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${t.colors.inputFocusRing}`;
            e.currentTarget.style.backgroundColor = t.colors.inputBackgroundFocus;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = t.colors.inputBorder;
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.backgroundColor = t.colors.inputBackground;
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
          border: t.colors.buttonBorder,
          borderRadius: t.borders.radius.md,
          backgroundColor: !canSubmit ? t.colors.buttonBackgroundDisabled : t.colors.buttonBackground,
          color: !canSubmit ? t.colors.buttonColorDisabled : t.colors.buttonColor,
          fontSize: isTouch ? t.typography.fontSize.lg : t.typography.fontSize.md,
          fontWeight: t.typography.fontWeight.medium,
          fontFamily: t.typography.fontFamily,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: `all ${t.animation.duration.fast} ${t.animation.easing.default}`,
          letterSpacing: '0.01em',
          opacity: isLoading ? 0.8 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginTop: 12,
          ...(isLoading ? {
            backgroundImage: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`,
            backgroundSize: '200% 100%',
            animation: 'gotcha-shimmer 1.5s ease infinite',
          } : {}),
          ...customStyles?.submitButton,
        }}
        onMouseEnter={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = t.colors.buttonBackgroundHover;
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = t.shadows.button;
          }
        }}
        onMouseLeave={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = !canSubmit ? t.colors.buttonBackgroundDisabled : t.colors.buttonBackground;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {isLoading && <Spinner size={isTouch ? 18 : 16} color={t.colors.buttonColor} />}
        {isLoading ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update' : submitText)}
      </button>
    </form>
  );
}
