import React, { useState, useEffect } from 'react';
import { GotchaStyles } from '../../types';
import { ResolvedTheme } from '../../theme/tokens';
import { isTouchDevice } from '../../utils/device';

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

/**
 * NPS mode — eleven uniform mono-labelled ink squares (0–10).
 *
 * The old version used a rainbow (red→green) scale that pre-decided the
 * valence of each number. Editorial discipline: every score is visually
 * equal at rest. Hover darkens the border; selected state fills the
 * square ink with paper text. The follow-up textarea reveals beneath
 * with a 240ms page-turn.
 *
 * Labels beneath the scale are small-caps mono — "NOT LIKELY" / "VERY
 * LIKELY" — matching the modal header label treatment.
 */
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
    if (initialValues?.rating !== undefined) setScore(initialValues.rating ?? null);
    if (initialValues?.content !== undefined) setContent(initialValues.content || '');
  }, [initialValues?.rating, initialValues?.content]);

  const canSubmit = score !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;
    onSubmit({
      rating: score ?? undefined,
      content: showFollowUp && content.trim() ? content.trim() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Score scale — 11 uniform squares. aspectRatio: 1 enforces
          square cells regardless of container width, killing the
          flex:1 drift that made cells slightly horizontal at 360px
          modal width. */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          gap: isTouch ? 4 : 5,
          justifyContent: 'center',
        }}
        role="group"
        aria-label="NPS Score"
        onMouseLeave={() => setHoveredScore(null)}
      >
        {Array.from({ length: 11 }, (_, i) => {
          const selected = score === i;
          const hovered = hoveredScore === i;

          return (
            <button
              key={i}
              type="button"
              onClick={() => setScore(i)}
              onMouseEnter={() => setHoveredScore(i)}
              aria-label={`Score ${i} out of 10`}
              aria-pressed={selected}
              style={{
                flex: 1,
                minWidth: 0,
                aspectRatio: '1',
                borderRadius: t.borders.radius.sm,
                border: `1px solid ${
                  selected
                    ? t.colors.buttonBackground
                    : hovered
                      ? t.colors.inputBorderFocus
                      : t.colors.border
                }`,
                backgroundColor: selected
                  ? t.colors.buttonBackground
                  : 'transparent',
                color: selected ? t.colors.buttonColor : t.colors.text,
                fontSize: 15,
                fontWeight: selected
                  ? t.typography.fontWeight.medium
                  : t.typography.fontWeight.normal,
                // Tabular numerals so the column widths stay uniform as the
                // selection moves across the scale.
                fontFamily:
                  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
                fontVariantNumeric: 'tabular-nums',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: `background-color ${t.animation.duration.fast} ${t.animation.easing.default}, border-color ${t.animation.duration.fast} ${t.animation.easing.default}, color ${t.animation.duration.fast} ${t.animation.easing.default}`,
                outline: 'none',
                ...customStyles?.npsButton,
                ...(selected ? customStyles?.npsButtonSelected : {}),
              }}
            >
              {i}
            </button>
          );
        })}
      </div>

      {/* Labels — small-caps mono, matches modal header eyebrow. Color
          raised from textSecondary to text so the 11px labels hold
          contrast at small optical size (WCAG AA). The valence cue
          (which end is good/bad) is the label copy itself, not a
          rainbow gradient. */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
          padding: '0 2px',
          ...customStyles?.npsLabels,
        }}
      >
        {[lowLabel, highLabel].map((label) => (
          <span
            key={label}
            style={{
              fontFamily: t.typography.fontFamily,
              fontSize: 11,
              color: t.colors.text,
              fontWeight: t.typography.fontWeight.medium,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Follow-up textarea — reveals when a score is chosen */}
      {showFollowUp && score !== null && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={followUpPlaceholder || "What's the main reason for your score?"}
          maxLength={5000}
          style={{
            width: '100%',
            padding: isTouch ? '12px 0' : '10px 0',
            marginTop: 18,
            border: 'none',
            borderBottom: `1px solid ${t.colors.inputBorder}`,
            borderRadius: 0,
            backgroundColor: 'transparent',
            color: t.colors.text,
            fontSize: isTouch ? t.typography.fontSize.lg : t.typography.fontSize.md,
            resize: 'none',
            minHeight: isTouch ? 72 : 56,
            fontFamily: t.typography.fontFamily,
            outline: 'none',
            transition: `border-color ${t.animation.duration.fast} ${t.animation.easing.default}`,
            lineHeight: 1.55,
            animation: `gotcha-expand-in ${t.animation.duration.normal} ${t.animation.easing.default} both`,
            overflow: 'hidden',
            ...customStyles?.input,
          }}
          disabled={isLoading}
          aria-label="Follow-up feedback"
          onFocus={(e) => {
            e.currentTarget.style.borderBottomColor = t.colors.inputBorderFocus;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderBottomColor = t.colors.inputBorder;
          }}
        />
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !canSubmit}
        style={{
          width: '100%',
          marginTop: 18,
          padding: isTouch ? '14px 16px' : '11px 16px',
          border: 'none',
          borderRadius: t.borders.radius.sm,
          backgroundColor: !canSubmit
            ? t.colors.buttonBackgroundDisabled
            : t.colors.buttonBackground,
          color: !canSubmit ? t.colors.buttonColorDisabled : t.colors.buttonColor,
          fontSize: t.typography.fontSize.sm,
          fontWeight: t.typography.fontWeight.medium,
          fontFamily: t.typography.fontFamily,
          cursor: isLoading || !canSubmit ? 'not-allowed' : 'pointer',
          transition: `background-color ${t.animation.duration.fast} ${t.animation.easing.default}`,
          fontStyle: isLoading ? 'italic' : 'normal',
          ...customStyles?.submitButton,
        }}
        onMouseEnter={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = t.colors.buttonBackgroundHover;
          }
        }}
        onMouseLeave={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = t.colors.buttonBackground;
          }
        }}
      >
        {isLoading
          ? (isEditing ? 'Updating…' : 'Sending…')
          : (isEditing ? 'Update' : submitText)}
      </button>
    </form>
  );
}
