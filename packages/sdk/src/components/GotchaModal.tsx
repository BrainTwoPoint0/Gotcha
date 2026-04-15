import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Theme, GotchaStyles, ResponseMode, ExistingResponse } from '../types';
import { ResolvedTheme } from '../theme/tokens';
import { resolveTheme } from '../theme/resolveTheme';
import { injectStyles } from '../theme/styles';
import { cn } from '../utils/cn';
import { useGotchaContext } from './GotchaProvider';
import { FeedbackMode } from './modes/FeedbackMode';
import { VoteMode } from './modes/VoteMode';
import { PollMode } from './modes/PollMode';
import { Spinner } from './Spinner';
import { NpsMode } from './modes/NpsMode';
import { FollowUpPrompt } from './FollowUpPrompt';

export interface GotchaModalProps {
  mode: ResponseMode;
  theme: Theme;
  customStyles?: GotchaStyles;
  promptText?: string;
  placeholder?: string;
  submitText: string;
  thankYouMessage: string;
  // State
  isLoading: boolean;
  isCheckingExisting?: boolean;
  isSubmitted: boolean;
  phase?: 'form' | 'followUp' | 'success';
  followUpConfig?: { promptText: string; placeholder?: string };
  followUpLoading?: boolean;
  onFollowUpSubmit?: (content: string) => void;
  error: string | null;
  // Edit mode
  existingResponse?: ExistingResponse | null;
  isEditing?: boolean;
  // Vote mode
  voteLabels?: { up: string; down: string };
  // Feedback mode field visibility
  showText?: boolean;
  showRating?: boolean;
  // Poll mode
  options?: string[];
  allowMultiple?: boolean;
  // NPS mode
  npsQuestion?: string;
  npsFollowUp?: boolean;
  npsFollowUpPlaceholder?: string;
  npsLowLabel?: string;
  npsHighLabel?: string;
  // Bug flagging
  enableBugFlag?: boolean;
  bugFlagLabel?: string;
  enableScreenshot?: boolean;
  // Handlers
  onSubmit: (data: { content?: string; rating?: number; vote?: 'up' | 'down'; pollSelected?: string[]; isBug?: boolean; screenshot?: string }) => void;
  onClose: () => void;
  // Position info from parent
  anchorRect?: DOMRect;
  /**
   * When true (desktop portal), use fixed positioning relative to the viewport
   * instead of absolute positioning relative to the container.
   */
  useFixedPosition?: boolean;
  /**
   * Viewport-width state hoisted from the parent so there's a single
   * source of truth across the portal boundary. Without this, the parent
   * and the modal each ran their own matchMedia listeners and could
   * temporarily disagree across React ticks — visible as one-frame flicker
   * during breakpoint crossings.
   */
  isMobile?: boolean;
}

// ── Mode label (small-caps above the H1) ─────────────────────
//
// Matches the dashboard's mono-uppercase eyebrow pattern. The label tells
// the user at a glance what kind of response the modal expects — without
// decoration, without colour. It's the editorial "section name" above the
// headline.
const MODE_LABEL: Record<ResponseMode, string> = {
  feedback: 'Feedback',
  vote: 'Vote',
  poll: 'Poll',
  nps: 'Rate',
};

// ── Default prompts ──────────────────────────────────────────
function getDefaultPrompt(mode: ResponseMode, npsQuestion?: string): string {
  switch (mode) {
    case 'vote':
      return 'What do you think?';
    case 'poll':
      return 'Cast your vote.';
    case 'nps':
      return npsQuestion || 'How likely are you to recommend us?';
    case 'feedback':
    default:
      return 'What do you think of this feature?';
  }
}

// Autoclose timeout in ms — must match the value in Gotcha.tsx so the
// progress rule finishes just as the modal dismisses. 4s gives the
// reading tempo room: the user can take in the "Thanks." + subline
// before the modal slides away.
const AUTOCLOSE_MS = 4000;

export function GotchaModal({
  mode,
  theme,
  customStyles,
  promptText,
  placeholder,
  submitText,
  thankYouMessage,
  isLoading,
  isCheckingExisting = false,
  isSubmitted,
  phase = 'form',
  followUpConfig,
  followUpLoading = false,
  onFollowUpSubmit,
  error,
  existingResponse,
  isEditing = false,
  showText = true,
  showRating = true,
  voteLabels,
  options,
  allowMultiple = false,
  npsQuestion,
  npsFollowUp = true,
  npsFollowUpPlaceholder,
  npsLowLabel,
  npsHighLabel,
  enableBugFlag = false,
  bugFlagLabel,
  enableScreenshot = false,
  onSubmit,
  onClose,
  anchorRect,
  useFixedPosition = false,
  isMobile: isMobileProp,
}: GotchaModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Read viewport width from the prop when provided (single source of
  // truth — Gotcha.tsx owns the live matchMedia listener). Fall back to
  // internal state only if the modal is rendered without the prop (legacy
  // or direct instantiation path).
  const [internalIsMobile, setInternalIsMobile] = useState(false);
  const isMobile = isMobileProp ?? internalIsMobile;
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  const { themeConfig } = useGotchaContext();

  // Colour-scheme tracking only. Mobile state comes from the parent via
  // the `isMobile` prop (single source of truth across the portal
  // boundary). If the prop isn't provided, we fall back to an internal
  // matchMedia listener so the modal still self-adapts when rendered
  // standalone.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const syncTheme = (e: MediaQueryListEvent | MediaQueryList) =>
      setSystemTheme(e.matches ? 'dark' : 'light');
    syncTheme(darkQuery);
    const darkHandler = (e: MediaQueryListEvent) => syncTheme(e);
    darkQuery.addEventListener('change', darkHandler);

    const listeners: Array<() => void> = [
      () => darkQuery.removeEventListener('change', darkHandler),
    ];

    if (isMobileProp === undefined) {
      const mobileQuery = window.matchMedia('(max-width: 1023px)');
      const syncMobile = () => setInternalIsMobile(mobileQuery.matches);
      syncMobile();
      mobileQuery.addEventListener('change', syncMobile);
      listeners.push(() => mobileQuery.removeEventListener('change', syncMobile));
    }

    return () => {
      for (const off of listeners) off();
    };
  }, [isMobileProp]);

  // Resolve theme with provider config
  const t: ResolvedTheme = useMemo(
    () => resolveTheme(theme, systemTheme, themeConfig),
    [theme, systemTheme, themeConfig]
  );

  // Re-inject styles when theme changes
  useEffect(() => {
    injectStyles(t);
  }, [t]);

  // Determine if modal should appear above or below the anchor.
  const showAbove = (() => {
    if (typeof window === 'undefined' || !anchorRect) return false;
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    return spaceBelow < 340;
  })();

  // Focus trap — use ref for onClose so effect runs once
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    firstFocusableRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const prompt = promptText || getDefaultPrompt(mode, npsQuestion);
  const modeLabel = MODE_LABEL[mode];

  // Slightly wider on NPS because the 0–10 scale needs elbow room; poll
  // wants room for 4-word options. Feedback/vote stay tight.
  const modalPadding = isMobile ? 24 : 28;
  const modalWidth = mode === 'nps' ? 420 : mode === 'poll' ? 400 : 360;

  // Animation class
  const animationClass = isMobile
    ? 'gotcha-modal-enter-center'
    : showAbove
    ? 'gotcha-modal-enter-above'
    : 'gotcha-modal-enter';

  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;

  // Modal container styles. Editorial card: flat paper, hairline border,
  // soft layered shadow, no gradient, no backdrop blur. The container is
  // a composed object on a page, not a glass panel floating above one.
  const baseContainer: React.CSSProperties = {
    padding: 0, // padding now lives per-section so we can hairline-rule the header
    borderRadius: t.borders.radius.lg,
    background: t.colors.background,
    color: t.colors.text,
    boxShadow: t.shadows.modal,
    border: `${t.borders.width}px solid ${t.colors.border}`,
    fontFamily: t.typography.fontFamily,
    textAlign: 'left' as const,
    overflow: 'hidden', // so the success-autoclose progress rule clips cleanly
  };

  const modalStyles: React.CSSProperties = isMobile
    ? {
        ...baseContainer,
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100vw - 32px)',
        maxWidth: modalWidth,
        zIndex: 9999,
        ...customStyles?.modal,
      }
    : useFixedPosition && anchorRect && viewportHeight
    ? (() => {
        const viewportWidth = window.innerWidth;
        const edgePadding = 24;
        const centerX = anchorRect.left + anchorRect.width / 2;
        const idealLeft = centerX - modalWidth / 2;
        const clampedLeft = Math.max(edgePadding, Math.min(idealLeft, viewportWidth - modalWidth - edgePadding));
        return {
          ...baseContainer,
          position: 'fixed' as const,
          left: clampedLeft,
          width: modalWidth,
          zIndex: 99999,
          ...(showAbove
            ? { bottom: viewportHeight - anchorRect.top + 10 }
            : { top: anchorRect.bottom + 10 }),
          ...customStyles?.modal,
        };
      })()
    : {
        ...baseContainer,
        position: 'absolute' as const,
        left: '50%',
        width: modalWidth,
        zIndex: 9999,
        ...(showAbove
          ? { bottom: '100%', marginBottom: 10, transform: 'translateX(-50%)' }
          : { top: '100%', marginTop: 10, transform: 'translateX(-50%)' }),
        ...customStyles?.modal,
      };

  // Form-field stagger (desktop only — on mobile the modal centers via
  // translate, which conflicts with per-child translateY animations).
  const fadeUpStyle = (index: number): React.CSSProperties =>
    isMobile
      ? {}
      : {
          animation: `gotcha-fade-up ${t.animation.duration.normal} ${t.animation.easing.default} both`,
          animationDelay: `${index * 0.04}s`,
        };

  // Padding around the body content (below the header rule). 20/20 top
  // keeps the rule 20px off the content (vs the header's 16px rule gap) —
  // ~36px total around the hairline, matching editorial print discipline
  // of ~1.5× cap-height.
  const bodyPadding = isMobile ? '20px 24px 24px' : '20px 28px 24px';

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={isSubmitted ? 'Feedback submitted' : undefined}
      aria-labelledby={isSubmitted ? undefined : 'gotcha-modal-title'}
      data-gotcha
      style={modalStyles}
      className={cn('gotcha-modal', 'gotcha-root', animationClass)}
    >
      {/* Header — small-caps eyebrow, serif H1, hairline rule beneath.
          Not rendered on success state (see below). */}
      {!isSubmitted && (
        <header
          style={{
            padding: isMobile ? '20px 24px 16px' : '22px 28px 16px',
            borderBottom: `${t.borders.width}px solid ${t.colors.border}`,
            position: 'relative',
          }}
        >
          {/* Small-caps mode label — eyebrow hairline at 16px + 8px gap
              reads as a single typographic unit (hairline+label), not two
              parts of a form. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
              ...fadeUpStyle(0),
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: 16,
                height: 1,
                backgroundColor: t.colors.warning /* sienna hairline — brand accent */,
              }}
            />
            <span
              style={{
                fontFamily: t.typography.fontFamily,
                fontSize: 10,
                fontWeight: t.typography.fontWeight.medium,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: t.colors.textSecondary,
              }}
            >
              {modeLabel}
            </span>
          </div>

          {/* Serif H1 — the prompt itself. Tracking -0.01em matches
              Georgia's already-narrow letter-fit. Fraunces at display
              optical sizes will tolerate -0.015em; guard that for 1.2.1. */}
          <h2
            id="gotcha-modal-title"
            style={{
              margin: 0,
              paddingRight: isMobile ? 52 : 44,
              fontFamily: t.typography.fontFamilyDisplay,
              fontSize: isMobile ? 22 : 20,
              fontWeight: t.typography.fontWeight.semibold,
              letterSpacing: '-0.01em',
              lineHeight: 1.25,
              color: t.colors.text,
              ...fadeUpStyle(1),
              ...customStyles?.title,
            }}
          >
            {prompt}
          </h2>

          {/* Close — muted → ink on hover. Hit target 32×32 desktop (WCAG
              2.5.5 minimum) / 44×44 mobile (HIG); visible glyph stays
              compact. Denser stroke (1.5) at 12×12 reads as a
              typographic mark rather than a thin ui control. */}
          <button
            ref={firstFocusableRef}
            type="button"
            onClick={onClose}
            aria-label="Close feedback form"
            style={{
              position: 'absolute',
              top: isMobile ? 14 : 16,
              right: isMobile ? 14 : 18,
              width: isMobile ? 44 : 32,
              height: isMobile ? 44 : 32,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              cursor: 'pointer',
              color: t.colors.closeButton,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: t.borders.radius.sm,
              transition: `color ${t.animation.duration.fast} ${t.animation.easing.default}`,
              ...customStyles?.closeButton,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = t.colors.closeButtonHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = t.colors.closeButton;
            }}
          >
            <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
              <path
                d="M1 1L11 11M1 11L11 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>
      )}

      {/* Body */}
      <div style={{ padding: isSubmitted ? 0 : bodyPadding, position: 'relative' }}>
        {/* Error — left-edge clay bar only. No tinted background; the
            edge + ink body carries the signal with editorial restraint.
            The " — try again?" suffix uses a real em-dash (already in
            source) as the visual separator, so no marginLeft needed. */}
        {error && !isSubmitted && (
          <div
            role="alert"
            style={{
              padding: '2px 0 2px 14px',
              marginBottom: 16,
              borderLeft: `2px solid ${t.colors.error}`,
              color: t.colors.text,
              fontSize: t.typography.fontSize.sm,
              lineHeight: 1.55,
              ...fadeUpStyle(2),
              ...customStyles?.errorMessage,
            }}
          >
            {error}
            <span style={{ color: t.colors.textSecondary }}>
              {' '}— try again?
            </span>
          </div>
        )}

        {/* Success — editorial checkmark + serif "Thanks." + progress rule */}
        {isSubmitted && (
          <div
            style={{
              padding: isMobile ? '32px 24px 28px' : '36px 28px 28px',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            {/* Check path length ~30 units — dasharray + offset 30 means
                the stroke starts fully hidden and draws in over 320ms. */}
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              style={{
                display: 'block',
                margin: '0 auto 14px',
                ...customStyles?.successIcon,
              }}
            >
              <path
                d="M10 20.5L17 27.5L31 13.5"
                stroke={t.colors.success}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 30,
                  strokeDashoffset: 30,
                  animation: `gotcha-check-draw 320ms ${t.animation.easing.default} forwards`,
                }}
              />
            </svg>

            <p
              style={{
                margin: 0,
                fontFamily: t.typography.fontFamilyDisplay,
                fontSize: 22,
                fontWeight: t.typography.fontWeight.semibold,
                letterSpacing: '-0.015em',
                color: t.colors.text,
                ...customStyles?.successMessage,
              }}
            >
              {thankYouMessage === 'Gotcha!' || thankYouMessage === 'Thanks for your feedback!'
                ? 'Thanks.'
                : thankYouMessage}
            </p>

            <p
              style={{
                margin: '8px 0 0',
                fontFamily: t.typography.fontFamily,
                fontSize: t.typography.fontSize.sm,
                color: t.colors.textSecondary,
                fontStyle: 'italic',
              }}
            >
              We&rsquo;ll close this in a moment.
            </p>

            {/* Autoclose progress rule — 1px sage bar across the modal's
                inner bottom edge that fills left-to-right over the
                autoclose period. Inset by 1px so it doesn't visually
                fight the modal's bottom border. Subtle affordance; the
                modal is dismissing on its own without any chrome shout. */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 1,
                right: 1,
                bottom: 1,
                height: 1,
                backgroundColor: t.colors.success,
                transformOrigin: 'left center',
                animation: `gotcha-progress ${AUTOCLOSE_MS}ms linear forwards`,
              }}
            />
          </div>
        )}

        {/* Follow-up question */}
        {phase === 'followUp' && followUpConfig && onFollowUpSubmit && !isSubmitted && (
          <div style={fadeUpStyle(2)}>
            <FollowUpPrompt
              resolvedTheme={t}
              promptText={followUpConfig.promptText}
              placeholder={followUpConfig.placeholder}
              isLoading={followUpLoading}
              onSubmit={onFollowUpSubmit}
            />
          </div>
        )}

        {/* Checking for existing response */}
        {phase === 'form' && isCheckingExisting && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '24px 0',
            ...fadeUpStyle(2),
          }}>
            <Spinner size={20} color={t.colors.textSecondary} />
          </div>
        )}

        {/* Form content based on mode */}
        {phase === 'form' && !isCheckingExisting && !isSubmitted && (
          <div style={fadeUpStyle(2)}>
            {mode === 'feedback' && (
              <FeedbackMode
                resolvedTheme={t}
                placeholder={placeholder}
                submitText={submitText}
                isLoading={isLoading}
                onSubmit={onSubmit}
                customStyles={customStyles}
                initialValues={existingResponse ? {
                  content: existingResponse.content,
                  rating: existingResponse.rating,
                } : undefined}
                isEditing={isEditing}
                showText={showText}
                showRating={showRating}
                enableBugFlag={enableBugFlag}
                bugFlagLabel={bugFlagLabel}
                enableScreenshot={enableScreenshot}
              />
            )}
            {mode === 'vote' && (
              <VoteMode
                resolvedTheme={t}
                isLoading={isLoading}
                onSubmit={onSubmit}
                initialVote={existingResponse?.vote || undefined}
                isEditing={isEditing}
                labels={voteLabels}
              />
            )}
            {mode === 'nps' && (
              <NpsMode
                resolvedTheme={t}
                submitText={submitText}
                isLoading={isLoading}
                onSubmit={onSubmit}
                showFollowUp={npsFollowUp}
                followUpPlaceholder={npsFollowUpPlaceholder}
                lowLabel={npsLowLabel}
                highLabel={npsHighLabel}
                customStyles={customStyles}
                initialValues={existingResponse ? {
                  rating: existingResponse.rating,
                  content: existingResponse.content,
                } : undefined}
                isEditing={isEditing}
              />
            )}
            {mode === 'poll' && options && options.length > 0 && (
              <PollMode
                resolvedTheme={t}
                options={options}
                allowMultiple={allowMultiple}
                isLoading={isLoading}
                onSubmit={onSubmit}
                initialSelected={existingResponse?.pollSelected || undefined}
                isEditing={isEditing}
              />
            )}
          </div>
        )}
      </div>

      {/* Screen reader announcement — single announcement at a time so
          AT doesn't read both "submitted" and "error" if a race occurs. */}
      <div aria-live="polite" className="sr-only" style={{ position: 'absolute', left: -9999 }}>
        {isSubmitted
          ? 'Thank you. Your feedback has been submitted.'
          : error
            ? `Error: ${error}`
            : ''}
      </div>
    </div>
  );
}
