import React, { useState, useEffect, useRef } from 'react';
import { GotchaStyles } from '../../types';
import { ResolvedTheme } from '../../theme/tokens';
import { isTouchDevice } from '../../utils/device';
import { ScreenshotPreview } from '../ScreenshotPreview';

interface FeedbackModeProps {
  resolvedTheme: ResolvedTheme;
  placeholder?: string;
  submitText: string;
  isLoading: boolean;
  onSubmit: (data: { content?: string; rating?: number; isBug?: boolean; screenshot?: string }) => void;
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
  enableScreenshot?: boolean;
}

/**
 * Feedback mode — stars + textarea + optional bug flag + screenshot.
 *
 * Editorial details:
 *   - Stars: ink stroke when empty, ink fill when rated. Hover cascades the
 *     fill up to the cursor with a 30ms per-star stagger. No glow, no pulse.
 *   - Textarea: transparent, hairline border, italic placeholder. Focus
 *     darkens the border to ink — no 3px glow ring.
 *   - Submit: ink pill, "Sending…" italic for the loading state, no spinner.
 *   - Bug flag: a hairline-bordered row with a checkbox-style indicator
 *     on the right. Active state uses sienna (warning token) — aligned
 *     with the dashboard's bug-report affordance.
 *   - Screenshot: paper-framed preview with a mono caption and a remove
 *     affordance that surfaces on hover (clay colour — the destructive
 *     brand moment).
 */
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
  enableScreenshot = false,
}: FeedbackModeProps) {
  const [content, setContent] = useState(initialValues?.content || '');
  const [rating, setRating] = useState<number | null>(initialValues?.rating ?? null);
  const [isBug, setIsBug] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturingScreenshot, setCapturingScreenshot] = useState(false);
  const [screenshotError, setScreenshotError] = useState(false);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  useEffect(() => {
    if (initialValues?.content !== undefined) setContent(initialValues.content || '');
    if (initialValues?.rating !== undefined) setRating(initialValues.rating ?? null);
  }, [initialValues?.content, initialValues?.rating]);

  const canSubmit = (() => {
    if (showText && showRating) return content.trim().length > 0 || rating !== null;
    if (showText) return content.trim().length > 0;
    if (showRating) return rating !== null;
    return false;
  })();

  const handleScreenshotCapture = async () => {
    setCapturingScreenshot(true);
    setScreenshotError(false);
    try {
      const { captureScreenshot } = await import('../../utils/screenshot');
      const result = await captureScreenshot();
      if (result) setScreenshot(result);
      else setScreenshotError(true);
    } catch {
      setScreenshotError(true);
    } finally {
      setCapturingScreenshot(false);
    }
    // Deliberately no auto-clear — 3s dismiss was too fast to read on
    // mobile. The error persists until the user taps "Try again" or
    // toggles bug-flag off.
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;
    onSubmit({
      content: showText && content.trim() ? content.trim() : undefined,
      rating: showRating && rating !== null ? rating : undefined,
      isBug: isBug || undefined,
      screenshot: screenshot || undefined,
    });
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: isTouch ? '12px 0' : '10px 0',
    border: 'none',
    borderBottom: `1px solid ${t.colors.inputBorder}`,
    borderRadius: 0,
    backgroundColor: 'transparent',
    color: t.colors.text,
    fontSize: isTouch ? t.typography.fontSize.lg : t.typography.fontSize.md,
    resize: 'none',
    minHeight: isTouch ? 96 : 80,
    fontFamily: t.typography.fontFamily,
    outline: 'none',
    transition: `border-color ${t.animation.duration.fast} ${t.animation.easing.default}`,
    lineHeight: 1.55,
    ...customStyles?.input,
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Rating */}
      {showRating && (
        <div
          style={{
            marginBottom: showText ? (isTouch ? 18 : 16) : 0,
            ...(!showText ? { display: 'flex', justifyContent: 'center', padding: '6px 0' } : {}),
          }}
        >
          <StarRating value={rating} onChange={setRating} theme={t} isTouch={isTouch} large={!showText} />
        </div>
      )}

      {/* Text input — hairline-only bottom border, transparent ground */}
      {showText && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder || 'Share your thoughts…'}
          maxLength={5000}
          style={inputStyles}
          disabled={isLoading}
          aria-label="Your feedback"
          onFocus={(e) => {
            e.currentTarget.style.borderBottomColor = t.colors.inputBorderFocus;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderBottomColor = t.colors.inputBorder;
          }}
        />
      )}

      {/* Bug flag toggle — editorial row with a checkbox indicator */}
      {enableBugFlag && (
        <button
          type="button"
          role="switch"
          aria-checked={isBug}
          onClick={() => setIsBug(!isBug)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            marginTop: 16,
            padding: isTouch ? '12px 12px' : '10px 12px',
            border: `1px solid ${isBug ? t.colors.warningBorder : t.colors.border}`,
            borderRadius: t.borders.radius.sm,
            backgroundColor: isBug ? t.colors.warningSurface : 'transparent',
            cursor: 'pointer',
            transition: `all ${t.animation.duration.fast} ${t.animation.easing.default}`,
            fontFamily: t.typography.fontFamily,
            ...customStyles?.bugFlag,
          }}
        >
          {/* Checkbox indicator (left) — hairline square that fills sienna when active */}
          <span
            aria-hidden="true"
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              border: `1px solid ${isBug ? t.colors.warningActive : t.colors.border}`,
              backgroundColor: isBug ? t.colors.warning : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: `all ${t.animation.duration.fast} ${t.animation.easing.default}`,
            }}
          >
            {isBug && (
              <svg width={8} height={8} viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path
                  d="M2 5L4 7L8 3"
                  stroke={t.colors.primaryText}
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>

          <span
            style={{
              fontSize: t.typography.fontSize.sm,
              fontWeight: t.typography.fontWeight.normal,
              color: isBug ? t.colors.text : t.colors.textSecondary,
              letterSpacing: '0',
              textAlign: 'left',
              flex: 1,
            }}
          >
            {isBug ? 'Reported as an issue' : (bugFlagLabel || 'Report an issue')}
          </span>
        </button>
      )}

      {/* Screenshot capture button — ghost with mono label */}
      {enableBugFlag && enableScreenshot && isBug && !screenshot && (
        <button
          type="button"
          onClick={handleScreenshotCapture}
          disabled={capturingScreenshot}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            marginTop: 8,
            padding: '9px 12px',
            border: `1px solid ${t.colors.border}`,
            borderRadius: t.borders.radius.sm,
            backgroundColor: 'transparent',
            cursor: capturingScreenshot ? 'progress' : 'pointer',
            fontFamily: t.typography.fontFamily,
            fontSize: t.typography.fontSize.xs,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: t.colors.textSecondary,
            transition: `all ${t.animation.duration.fast} ${t.animation.easing.default}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = t.colors.inputBorderFocus;
            e.currentTarget.style.color = t.colors.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = t.colors.border;
            e.currentTarget.style.color = t.colors.textSecondary;
          }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <circle cx="12" cy="10" r="3" />
            <path d="M2 17l4-4 3 3 4-4 9 9" />
          </svg>
          {capturingScreenshot ? 'Capturing…' : 'Attach screenshot'}
        </button>
      )}

      {screenshotError && (
        <div
          role="alert"
          style={{
            marginTop: 8,
            padding: '6px 0 6px 10px',
            borderLeft: `2px solid ${t.colors.error}`,
            fontSize: t.typography.fontSize.xs,
            color: t.colors.text,
            fontFamily: t.typography.fontFamily,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <span>Screenshot capture unavailable.</span>
          <button
            type="button"
            onClick={handleScreenshotCapture}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: t.colors.text,
              fontFamily: t.typography.fontFamily,
              fontSize: t.typography.fontSize.xs,
              textDecoration: 'underline',
              textDecorationColor: t.colors.border,
              textUnderlineOffset: 3,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Screenshot preview */}
      {enableBugFlag && enableScreenshot && isBug && screenshot && (
        <ScreenshotPreview
          src={screenshot}
          onRemove={() => setScreenshot(null)}
          resolvedTheme={t}
        />
      )}

      {/* Submit — ink button, italic "Sending…" when loading, no spinner */}
      <button
        type="submit"
        disabled={isLoading || !canSubmit}
        style={{
          width: '100%',
          padding: isTouch ? '14px 16px' : '11px 16px',
          marginTop: 18,
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

interface StarRatingProps {
  value: number | null;
  onChange: (rating: number) => void;
  theme: ResolvedTheme;
  isTouch: boolean;
  large?: boolean;
}

function StarRating({ value, onChange, theme: t, isTouch, large = false }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const starSize = large ? (isTouch ? 34 : 28) : (isTouch ? 26 : 20);
  const gap = large ? (isTouch ? 8 : 8) : (isTouch ? 6 : 6);
  const buttonPadding = large ? (isTouch ? 6 : 4) : (isTouch ? 6 : 2);

  // Hover cascade: when the cursor lands on a star, fill light-to-right up
  // to that position with a 30ms stagger so each star lights in sequence.
  // When the cursor leaves, every star returns to resting state in
  // parallel (no reverse cascade — felt wrong on unhover). Clicks commit
  // immediately (value update) and the stagger no longer applies because
  // hovered is still the cursor position.
  const delayFor = (star: number): string =>
    hovered !== null && hovered >= star ? `${(star - 1) * 30}ms` : '0ms';

  return (
    <div
      style={{ display: 'flex', gap }}
      role="group"
      aria-label="Rating"
      onMouseLeave={() => setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hovered ?? value ?? 0) >= star;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            aria-label={`Rate ${star} out of 5`}
            aria-pressed={value === star}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: buttonPadding,
              color: isFilled ? t.colors.starFilled : t.colors.starEmpty,
              transition: `color 180ms ${t.animation.easing.default}`,
              transitionDelay: delayFor(star),
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg
              width={starSize}
              height={starSize}
              viewBox="0 0 24 24"
              fill={isFilled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={isFilled ? 0 : 1.5}
              strokeLinejoin="round"
            >
              <path d="M12 3.5L14.472 8.506L20 9.308L16 13.205L16.944 18.706L12 16.107L7.056 18.706L8 13.205L4 9.308L9.528 8.506L12 3.5Z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
