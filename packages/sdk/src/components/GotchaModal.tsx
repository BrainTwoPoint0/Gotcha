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
}

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
}: GotchaModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [isMobile, setIsMobile] = useState(false);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  const { themeConfig } = useGotchaContext();

  // Detect mobile and system theme after mount (SSR-safe)
  useEffect(() => {
    setIsMobile(window.innerWidth < 640);

    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(darkQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    darkQuery.addEventListener('change', handler);
    return () => darkQuery.removeEventListener('change', handler);
  }, []);

  // Resolve theme with provider config
  const t: ResolvedTheme = useMemo(
    () => resolveTheme(theme, systemTheme, themeConfig),
    [theme, systemTheme, themeConfig]
  );

  // Re-inject styles when theme changes
  useEffect(() => {
    injectStyles(t);
  }, [t]);

  // Determine if modal should appear above or below
  // Only compute on client after mount (anchorRect is only set on client)
  const showAbove = (() => {
    if (typeof window === 'undefined' || !anchorRect) return false;
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    return spaceBelow < 300;
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

  const defaultPrompt = mode === 'vote'
    ? 'What do you think?'
    : mode === 'poll'
    ? 'Cast your vote'
    : mode === 'nps'
    ? (npsQuestion || 'How likely are you to recommend us?')
    : 'What do you think of this feature?';

  const modalPadding = isMobile ? 24 : 20;
  const modalWidth = mode === 'nps' ? 420 : 340;

  // Animation class
  const animationClass = isMobile
    ? 'gotcha-modal-enter-center'
    : showAbove
    ? 'gotcha-modal-enter-above'
    : 'gotcha-modal-enter';

  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;

  const modalStyles: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100vw - 32px)',
        maxWidth: modalWidth,
        padding: modalPadding,
        borderRadius: t.borders.radius.lg + 2,
        background: t.colors.backgroundGradient,
        color: t.colors.text,
        boxShadow: t.shadows.modal,
        border: `${t.borders.width}px solid ${t.colors.border}`,
        zIndex: 9999,
        fontFamily: t.typography.fontFamily,
        ...customStyles?.modal,
        textAlign: 'left' as const,
      }
    : useFixedPosition && anchorRect && viewportHeight
    ? (() => {
        const viewportWidth = window.innerWidth;
        const edgePadding = 24;
        const centerX = anchorRect.left + anchorRect.width / 2;
        // Clamp so modal stays within viewport
        const idealLeft = centerX - modalWidth / 2;
        const clampedLeft = Math.max(edgePadding, Math.min(idealLeft, viewportWidth - modalWidth - edgePadding));
        return {
          position: 'fixed' as const,
          left: clampedLeft,
          width: modalWidth,
          padding: modalPadding,
          borderRadius: t.borders.radius.lg,
          background: t.colors.backgroundGradient,
          color: t.colors.text,
          boxShadow: t.shadows.modal,
          border: `${t.borders.width}px solid ${t.colors.border}`,
          zIndex: 99999,
          fontFamily: t.typography.fontFamily,
          ...(showAbove
            ? { bottom: viewportHeight - anchorRect.top + 8 }
            : { top: anchorRect.bottom + 8 }),
          ...customStyles?.modal,
          textAlign: 'left' as const,
        };
      })()
    : {
        position: 'absolute' as const,
        left: '50%',
        width: modalWidth,
        padding: modalPadding,
        borderRadius: t.borders.radius.lg,
        background: t.colors.backgroundGradient,
        color: t.colors.text,
        boxShadow: t.shadows.modal,
        border: `${t.borders.width}px solid ${t.colors.border}`,
        zIndex: 9999,
        fontFamily: t.typography.fontFamily,
        ...(showAbove
          ? { bottom: '100%', marginBottom: 8, transform: 'translateX(-50%)' }
          : { top: '100%', marginTop: 8, transform: 'translateX(-50%)' }),
        ...customStyles?.modal,
        textAlign: 'left' as const,
      };

  // Stagger delay for form elements (desktop only — mobile centering is disrupted by staggered opacity)
  const fadeUpStyle = (index: number): React.CSSProperties =>
    isMobile
      ? {}
      : {
          animation: `gotcha-fade-up ${t.animation.duration.normal} ${t.animation.easing.default} both`,
          animationDelay: `${index * 0.05}s`,
        };

  // "Gotcha!" success branding
  const isDefaultThankYou = thankYouMessage === 'Gotcha!' || thankYouMessage === 'Thanks for your feedback!';

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={isSubmitted ? 'Feedback submitted' : undefined}
      aria-labelledby={isSubmitted ? undefined : 'gotcha-modal-title'}
      data-gotcha
      style={modalStyles}
      className={cn('gotcha-modal', animationClass)}
    >
      {/* Close button */}
      <button
        ref={firstFocusableRef}
        type="button"
        onClick={onClose}
        aria-label="Close feedback form"
        style={{
          position: 'absolute',
          top: isMobile ? 10 : 6,
          right: isMobile ? 10 : 6,
          width: isMobile ? 40 : 36,
          height: isMobile ? 40 : 36,
          border: 'none',
          background: 'transparent',
          outline: 'none',
          cursor: 'pointer',
          zIndex: 10,
          color: t.colors.closeButton,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: t.borders.radius.sm,
          transition: `all ${t.animation.duration.fast} ${t.animation.easing.default}`,
          ...customStyles?.closeButton,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = t.colors.closeButtonBg;
          e.currentTarget.style.color = t.colors.closeButtonHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = t.colors.closeButton;
        }}
      >
        <svg width={isMobile ? 16 : 14} height={isMobile ? 16 : 14} viewBox="0 0 14 14" fill="none">
          <path
            d="M1 1L13 13M1 13L13 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Title */}
      {!isSubmitted && (
        <h2
          id="gotcha-modal-title"
          style={{
            margin: '0 0 16px 0',
            fontSize: isMobile ? t.typography.fontSize.lg : t.typography.fontSize.md,
            fontWeight: t.typography.fontWeight.semibold,
            paddingRight: isMobile ? 44 : 38,
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
            textAlign: 'left',
            fontFamily: t.typography.fontFamily,
            ...fadeUpStyle(0),
            ...customStyles?.title,
          }}
        >
          {promptText || defaultPrompt}
        </h2>
      )}

      {/* Success state — "Gotcha!" branding moment */}
      {isSubmitted && (
        <div
          style={{
            textAlign: 'center',
            padding: '28px 0 20px',
          }}
        >
          {/* Animated checkmark circle */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: t.colors.successSurface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              animation: `gotcha-success-pop 0.4s ${t.animation.easing.spring} both, gotcha-glow-pulse 0.8s ease 0.4s`,
              ...customStyles?.successIcon,
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke={t.colors.success}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 24,
                  strokeDashoffset: 0,
                  animation: `gotcha-check-draw 0.4s ease 0.2s both`,
                }}
              />
            </svg>
          </div>

          {/* Primary message */}
          <p
            style={{
              margin: 0,
              fontSize: isDefaultThankYou ? 22 : t.typography.fontSize.md,
              fontWeight: isDefaultThankYou ? t.typography.fontWeight.bold : t.typography.fontWeight.medium,
              color: t.colors.text,
              fontFamily: isDefaultThankYou ? "'Carter One', cursive" : t.typography.fontFamily,
              animation: `gotcha-success-text 0.3s ease 0.3s both`,
              ...customStyles?.successMessage,
            }}
          >
            {isDefaultThankYou ? 'Gotcha!' : thankYouMessage}
          </p>

          {/* Subtitle (only for default message) */}
          {isDefaultThankYou && (
            <p
              style={{
                margin: '6px 0 0',
                fontSize: t.typography.fontSize.sm,
                fontWeight: t.typography.fontWeight.normal,
                color: t.colors.textSecondary,
                animation: `gotcha-success-text 0.3s ease 0.45s both`,
              }}
            >
              Thanks for your feedback!
            </p>
          )}
        </div>
      )}

      {/* Error state */}
      {error && !isSubmitted && (
        <div
          style={{
            padding: '8px 10px',
            marginBottom: 12,
            borderRadius: t.borders.radius.sm,
            backgroundColor: t.colors.errorSurface,
            border: `1px solid ${t.colors.errorBorder}`,
            color: t.colors.error,
            fontSize: t.typography.fontSize.sm,
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            ...fadeUpStyle(1),
            ...customStyles?.errorMessage,
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {error}
        </div>
      )}

      {/* Follow-up question */}
      {phase === 'followUp' && followUpConfig && onFollowUpSubmit && (
        <div style={fadeUpStyle(1)}>
          <FollowUpPrompt
            resolvedTheme={t}
            promptText={followUpConfig.promptText}
            placeholder={followUpConfig.placeholder}
            isLoading={followUpLoading}
            onSubmit={onFollowUpSubmit}
          />
        </div>
      )}

      {/* Loading state while checking for existing response */}
      {phase === 'form' && isCheckingExisting && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '24px 0',
          ...fadeUpStyle(1),
        }}>
          <Spinner size={24} color={t.colors.textSecondary} />
        </div>
      )}

      {/* Form content based on mode */}
      {phase === 'form' && !isCheckingExisting && (
        <div style={fadeUpStyle(1)}>
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

      {/* Screen reader announcement */}
      <div aria-live="polite" className="sr-only" style={{ position: 'absolute', left: -9999 }}>
        {isSubmitted && 'Thank you! Your feedback has been submitted.'}
        {error && `Error: ${error}`}
      </div>
    </div>
  );
}
