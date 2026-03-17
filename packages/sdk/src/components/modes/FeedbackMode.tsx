import React, { useState, useEffect, useRef } from 'react';
import { GotchaStyles } from '../../types';
import { ResolvedTheme } from '../../theme/tokens';
import { isTouchDevice } from '../../utils/device';
import { Spinner } from '../Spinner';

interface FeedbackModeProps {
  resolvedTheme: ResolvedTheme;
  placeholder?: string;
  submitText: string;
  isLoading: boolean;
  onSubmit: (data: { content?: string; rating?: number; isBug?: boolean }) => void;
  customStyles?: GotchaStyles;
  initialValues?: {
    content?: string | null;
    rating?: number | null;
  };
  isEditing?: boolean;
  showText?: boolean;
  showRating?: boolean;
  enableBugFlag?: boolean;
  bugFlagLabel?: string;
}

export function FeedbackMode({
  resolvedTheme: t,
  placeholder,
  submitText,
  isLoading,
  onSubmit,
  customStyles,
  initialValues,
  isEditing = false,
  showText = true,
  showRating = true,
  enableBugFlag = false,
  bugFlagLabel,
}: FeedbackModeProps) {
  const [content, setContent] = useState(initialValues?.content || '');
  const [rating, setRating] = useState<number | null>(initialValues?.rating ?? null);
  const [isBug, setIsBug] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  useEffect(() => {
    if (initialValues?.content !== undefined) {
      setContent(initialValues.content || '');
    }
    if (initialValues?.rating !== undefined) {
      setRating(initialValues.rating ?? null);
    }
  }, [initialValues?.content, initialValues?.rating]);

  const canSubmit = (() => {
    if (showText && showRating) return content.trim().length > 0 || rating !== null;
    if (showText) return content.trim().length > 0;
    if (showRating) return rating !== null;
    return false;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      content: showText && content.trim() ? content.trim() : undefined,
      rating: showRating && rating !== null ? rating : undefined,
      isBug: isBug || undefined,
    });
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: isTouch ? '12px 14px' : '10px 12px',
    border: `1px solid ${t.colors.inputBorder}`,
    borderRadius: t.borders.radius.md,
    backgroundColor: t.colors.inputBackground,
    color: t.colors.text,
    fontSize: isTouch ? t.typography.fontSize.lg : t.typography.fontSize.md,
    resize: 'none',
    minHeight: isTouch ? 100 : 80,
    fontFamily: t.typography.fontFamily,
    outline: 'none',
    transition: `border-color ${t.animation.duration.fast} ${t.animation.easing.default}, box-shadow ${t.animation.duration.fast} ${t.animation.easing.default}`,
    lineHeight: 1.5,
    boxShadow: `inset 0 1px 2px rgba(0,0,0,0.04)`,
    ...customStyles?.input,
  };

  const buttonStyles: React.CSSProperties = {
    width: '100%',
    padding: isTouch ? '14px 16px' : '10px 16px',
    border: t.colors.buttonBorder,
    borderRadius: t.borders.radius.md,
    backgroundColor: t.colors.buttonBackground,
    color: t.colors.buttonColor,
    fontSize: isTouch ? t.typography.fontSize.lg : t.typography.fontSize.md,
    fontWeight: t.typography.fontWeight.medium,
    fontFamily: t.typography.fontFamily,
    cursor: isLoading ? 'not-allowed' : 'pointer',
    transition: `all ${t.animation.duration.fast} ${t.animation.easing.default}`,
    letterSpacing: '0.01em',
    ...customStyles?.submitButton,
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Rating */}
      {showRating && (
        <div style={{
          marginBottom: showText ? (isTouch ? 16 : 12) : 0,
          ...(!showText ? { display: 'flex', justifyContent: 'center', padding: '8px 0' } : {}),
        }}>
          <StarRating value={rating} onChange={setRating} theme={t} isTouch={isTouch} large={!showText} />
        </div>
      )}

      {/* Text input */}
      {showText && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder || 'Share your thoughts...'}
          maxLength={5000}
          style={inputStyles}
          disabled={isLoading}
          aria-label="Your feedback"
          onFocus={(e) => {
            e.currentTarget.style.borderColor = t.colors.inputBorderFocus;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${t.colors.inputFocusRing}`;
            e.currentTarget.style.backgroundColor = t.colors.inputBackgroundFocus;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = t.colors.inputBorder;
            e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.04)';
            e.currentTarget.style.backgroundColor = t.colors.inputBackground;
          }}
        />
      )}

      {/* Bug flag toggle */}
      {enableBugFlag && (
        <button
          type="button"
          role="switch"
          aria-checked={isBug}
          onClick={() => setIsBug(!isBug)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            width: '100%',
            marginTop: 10,
            padding: '7px 10px',
            border: `1px solid ${
              isBug ? t.colors.warningBorder : t.colors.border
            }`,
            borderRadius: 7,
            backgroundColor: isBug ? t.colors.warningSurface : 'transparent',
            cursor: 'pointer',
            transition: `all ${t.animation.duration.fast} ${t.animation.easing.default}`,
            fontFamily: t.typography.fontFamily,
            ...customStyles?.bugFlag,
          }}
          onMouseEnter={(e) => {
            if (!isBug) {
              e.currentTarget.style.backgroundColor = t.colors.surfaceHover === t.colors.inputBackgroundFocus
                ? 'rgba(0,0,0,0.02)' : t.colors.surfaceHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!isBug) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke={isBug ? t.colors.warningActive : t.colors.textDisabled}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, transition: `stroke ${t.animation.duration.fast}` }}
          >
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span
            style={{
              fontSize: 12,
              fontWeight: isBug ? t.typography.fontWeight.medium : t.typography.fontWeight.normal,
              color: isBug ? t.colors.warningActive : t.colors.textDisabled,
              transition: `color ${t.animation.duration.fast}`,
              letterSpacing: '0.01em',
            }}
          >
            {isBug ? 'Issue reported' : (bugFlagLabel || 'Report an issue')}
          </span>
          <div
            style={{
              marginLeft: 'auto',
              width: 28,
              height: 16,
              borderRadius: 8,
              backgroundColor: isBug ? t.colors.warning : t.colors.border,
              position: 'relative',
              transition: `background-color ${t.animation.duration.fast} ${t.animation.easing.default}`,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: isBug ? 14 : 2,
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: isBug ? '#ffffff' : t.colors.textDisabled,
                transition: `left ${t.animation.duration.fast} ${t.animation.easing.default}, background-color ${t.animation.duration.fast}`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
              }}
            />
          </div>
        </button>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading || !canSubmit}
        style={{
          ...buttonStyles,
          marginTop: 12,
          opacity: isLoading ? 0.8 : 1,
          backgroundColor: !canSubmit ? t.colors.buttonBackgroundDisabled : t.colors.buttonBackground,
          color: !canSubmit ? t.colors.buttonColorDisabled : t.colors.buttonColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          ...(isLoading ? {
            backgroundImage: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`,
            backgroundSize: '200% 100%',
            animation: 'gotcha-shimmer 1.5s ease infinite',
          } : {}),
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
            e.currentTarget.style.backgroundColor = t.colors.buttonBackground;
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

interface StarRatingProps {
  value: number | null;
  onChange: (rating: number) => void;
  theme: ResolvedTheme;
  isTouch: boolean;
  large?: boolean;
}

function StarRating({ value, onChange, theme: t, isTouch, large = false }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [pulsing, setPulsing] = useState<number | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const starSize = large ? (isTouch ? 36 : 28) : (isTouch ? 28 : 18);
  const buttonPadding = large ? (isTouch ? 8 : 5) : (isTouch ? 8 : 3);

  useEffect(() => {
    return () => { clearTimeout(pulseTimerRef.current); };
  }, []);

  const handleClick = (star: number) => {
    setPulsing(star);
    onChange(star);
    clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => setPulsing(null), 300);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: large ? (isTouch ? 8 : 6) : (isTouch ? 6 : 2),
      }}
      role="group"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hovered ?? value ?? 0) >= star;
        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            aria-label={`Rate ${star} out of 5`}
            aria-pressed={value === star}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: buttonPadding,
              color: isFilled ? t.colors.starFilled : t.colors.starEmpty,
              transition: `color 0.15s ${t.animation.easing.default}`,
              transform: pulsing === star ? 'scale(1)' : ((hovered !== null && hovered >= star) ? 'scale(1.1)' : 'scale(1)'),
              animation: pulsing === star ? `gotcha-star-pulse 0.3s ${t.animation.easing.spring}` : 'none',
              filter: isFilled ? `drop-shadow(0 0 3px ${t.colors.starFilled}40)` : 'none',
              transitionDelay: `${(star - 1) * 30}ms`,
            }}
          >
            <svg width={starSize} height={starSize} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
