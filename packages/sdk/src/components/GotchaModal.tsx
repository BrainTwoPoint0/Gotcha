import React, { useRef, useEffect, useState } from 'react';
import { Theme, GotchaStyles, ResponseMode, ExistingResponse } from '../types';
import { cn } from '../utils/cn';
import { FeedbackMode } from './modes/FeedbackMode';
import { VoteMode } from './modes/VoteMode';

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
  isSubmitted: boolean;
  error: string | null;
  // Edit mode
  existingResponse?: ExistingResponse | null;
  isEditing?: boolean;
  // Handlers
  onSubmit: (data: { content?: string; rating?: number; vote?: 'up' | 'down' }) => void;
  onClose: () => void;
  // Position info from parent
  anchorRect?: DOMRect;
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
  isSubmitted,
  error,
  existingResponse,
  isEditing = false,
  onSubmit,
  onClose,
  anchorRect,
}: GotchaModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Detect mobile and system theme after mount (SSR-safe)
  useEffect(() => {
    setIsMobile(window.innerWidth < 640);

    // Detect system theme preference
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(darkQuery.matches ? 'dark' : 'light');

    // Listen for theme changes
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    darkQuery.addEventListener('change', handler);
    return () => darkQuery.removeEventListener('change', handler);
  }, []);

  // Trigger animation after mount
  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  // Resolve theme
  const resolvedTheme = theme === 'auto' ? systemTheme : theme;

  const isDark = resolvedTheme === 'dark';

  // Determine if modal should appear above or below
  const modalHeight = 280; // approximate modal height
  const spaceBelow = anchorRect
    ? window.innerHeight - anchorRect.bottom
    : window.innerHeight / 2;
  const showAbove = spaceBelow < modalHeight + 20;

  // Focus trap
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    // Focus first element
    firstFocusableRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
  }, [onClose]);

  const defaultPrompt = mode === 'vote'
    ? 'What do you think?'
    : 'What do you think of this feature?';

  // Responsive sizing - on mobile, use fixed positioning centered on screen
  const modalPadding = isMobile ? 20 : 16;

  const modalStyles: React.CSSProperties = isMobile
    ? {
        // Mobile: fixed position, centered on screen
        position: 'fixed',
        left: '50%',
        top: '50%',
        width: 'calc(100vw - 32px)',
        maxWidth: 320,
        padding: modalPadding,
        borderRadius: 12,
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        zIndex: 9999,
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? 'translate(-50%, -50%) scale(1)'
          : 'translate(-50%, -50%) scale(0.95)',
        ...customStyles?.modal,
      }
    : {
        // Desktop: absolute position relative to button
        position: 'absolute',
        left: '50%',
        width: 320,
        padding: modalPadding,
        borderRadius: 8,
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        zIndex: 9999,
        ...(showAbove
          ? { bottom: '100%', marginBottom: 8 }
          : { top: '100%', marginTop: 8 }),
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? 'translateX(-50%) scale(1) translateY(0)'
          : `translateX(-50%) scale(0.95) translateY(${showAbove ? '10px' : '-10px'})`,
        ...customStyles?.modal,
      };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gotcha-modal-title"
      style={modalStyles}
      className={cn('gotcha-modal', isDark && 'gotcha-modal--dark')}
    >
      {/* Close button - larger on touch devices */}
      <button
        ref={firstFocusableRef}
        type="button"
        onClick={onClose}
        aria-label="Close feedback form"
        style={{
          position: 'absolute',
          top: isMobile ? 12 : 8,
          right: isMobile ? 12 : 8,
          width: isMobile ? 36 : 24,
          height: isMobile ? 36 : 24,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: isDark ? '#9ca3af' : '#6b7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
        }}
      >
        <svg width={isMobile ? 18 : 14} height={isMobile ? 18 : 14} viewBox="0 0 14 14" fill="none">
          <path
            d="M1 1L13 13M1 13L13 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Title */}
      <h2
        id="gotcha-modal-title"
        style={{
          margin: '0 0 12px 0',
          fontSize: isMobile ? 16 : 14,
          fontWeight: 500,
          paddingRight: isMobile ? 40 : 24,
        }}
      >
        {promptText || defaultPrompt}
      </h2>

      {/* Success state */}
      {isSubmitted && (
        <div
          style={{
            textAlign: 'center',
            padding: '20px 0',
            color: isDark ? '#10b981' : '#059669',
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            style={{ margin: '0 auto 8px' }}
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p style={{ margin: 0, fontSize: 14 }}>{thankYouMessage}</p>
        </div>
      )}

      {/* Error state */}
      {error && !isSubmitted && (
        <div
          style={{
            padding: 8,
            marginBottom: 12,
            borderRadius: 4,
            backgroundColor: isDark ? '#7f1d1d' : '#fef2f2',
            color: isDark ? '#fecaca' : '#dc2626',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Form content based on mode */}
      {!isSubmitted && (
        <>
          {mode === 'feedback' && (
            <FeedbackMode
              theme={resolvedTheme}
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
            />
          )}
          {mode === 'vote' && (
            <VoteMode
              theme={resolvedTheme}
              isLoading={isLoading}
              onSubmit={onSubmit}
              initialVote={existingResponse?.vote || undefined}
              isEditing={isEditing}
            />
          )}
        </>
      )}

      {/* Screen reader announcement */}
      <div aria-live="polite" className="sr-only" style={{ position: 'absolute', left: -9999 }}>
        {isSubmitted && 'Thank you! Your feedback has been submitted.'}
        {error && `Error: ${error}`}
      </div>
    </div>
  );
}
