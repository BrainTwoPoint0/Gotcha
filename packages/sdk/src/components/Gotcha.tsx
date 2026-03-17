import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ResponseMode,
  GotchaUser,
  Position,
  Size,
  Theme,
  TouchBehavior,
  GotchaStyles,
  GotchaResponse,
  GotchaError,
} from '../types';
import { DEFAULTS } from '../constants';
import { useGotchaContext } from './GotchaProvider';
import { useSubmit } from '../hooks/useSubmit';
import { GotchaButton } from './GotchaButton';
import { GotchaModal } from './GotchaModal';

export interface GotchaProps {
  /** Unique identifier for this element */
  elementId: string;

  // User data
  /** User metadata for segmentation */
  user?: GotchaUser;

  // Behavior
  /** Feedback mode */
  mode?: ResponseMode;

  // Feedback mode field visibility
  /** Show the text input in feedback mode (default: true) */
  showText?: boolean;
  /** Show the star rating in feedback mode (default: true) */
  showRating?: boolean;

  // Vote mode specific
  /** Custom labels for vote buttons (default: Like/Dislike) */
  voteLabels?: { up: string; down: string };

  // Poll mode specific
  /** Required if mode is 'poll' (2-6 options) */
  options?: string[];
  /** Allow selecting multiple options */
  allowMultiple?: boolean;

  // NPS mode specific
  /** Custom NPS question (default: "How likely are you to recommend us?") */
  npsQuestion?: string;
  /** Show follow-up textarea after score selection (default: true) */
  npsFollowUp?: boolean;
  /** Placeholder for NPS follow-up textarea */
  npsFollowUpPlaceholder?: string;
  /** Label for low end of NPS scale (default: "Not likely") */
  npsLowLabel?: string;
  /** Label for high end of NPS scale (default: "Very likely") */
  npsHighLabel?: string;

  // Appearance
  /** Button position relative to parent */
  position?: Position;
  /** Button size */
  size?: Size;
  /** Color theme */
  theme?: Theme;
  /** Custom style overrides */
  customStyles?: GotchaStyles;
  /** Control visibility programmatically */
  visible?: boolean;
  /** Only show when parent is hovered (default: true) */
  showOnHover?: boolean;
  /** Mobile behavior (default: 'always-visible') */
  touchBehavior?: TouchBehavior;

  // Content
  /** Custom prompt text */
  promptText?: string;
  /** Input placeholder text */
  placeholder?: string;
  /** Submit button text */
  submitText?: string;
  /** Post-submission message */
  thankYouMessage?: string;

  // Bug flagging
  /** Show "Report an issue" toggle in feedback form (default: false) */
  enableBugFlag?: boolean;
  /** Custom label for the bug flag toggle (default: "Report an issue") */
  bugFlagLabel?: string;

  // Deduplication
  /** When true and user has already responded, show submitted state and allow review/edit instead of new submission */
  onePerUser?: boolean;

  // Animation
  /** Enable entrance animations on the button and modal (default: true) */
  animated?: boolean;

  // Callbacks
  /** Called after successful submission */
  onSubmit?: (response: GotchaResponse) => void;
  /** Called when modal opens */
  onOpen?: () => void;
  /** Called when modal closes */
  onClose?: () => void;
  /** Called on error */
  onError?: (error: GotchaError) => void;
}

export function Gotcha({
  elementId,
  user,
  mode = 'feedback',
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
  onePerUser = false,
  animated = true,
  position = DEFAULTS.POSITION,
  size = DEFAULTS.SIZE,
  theme = DEFAULTS.THEME,
  customStyles,
  visible = true,
  showOnHover = DEFAULTS.SHOW_ON_HOVER,
  touchBehavior = DEFAULTS.TOUCH_BEHAVIOR,
  promptText,
  placeholder,
  submitText = DEFAULTS.SUBMIT_TEXT,
  thankYouMessage = DEFAULTS.THANK_YOU_MESSAGE,
  onSubmit,
  onOpen,
  onClose,
  onError,
}: GotchaProps) {
  const { disabled, activeModalId, openModal, closeModal } = useGotchaContext();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isParentHovered, setIsParentHovered] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // SSR-safe mount detection
  useEffect(() => {
    setHasMounted(true);
    setIsMobile(window.innerWidth < 640);
    return () => {
      clearTimeout(autoCloseTimerRef.current);
    };
  }, []);

  const isOpen = activeModalId === elementId;

  // Scroll lock on mobile when modal is open
  useEffect(() => {
    if (!isOpen || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen, isMobile]);

  // Attach hover listeners to the parent element
  useEffect(() => {
    if (!showOnHover) return;

    const container = containerRef.current;
    if (!container) return;

    const parent = container.parentElement;
    if (!parent) return;

    const handleMouseEnter = () => setIsParentHovered(true);
    const handleMouseLeave = () => setIsParentHovered(false);

    parent.addEventListener('mouseenter', handleMouseEnter);
    parent.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      parent.removeEventListener('mouseenter', handleMouseEnter);
      parent.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [showOnHover]);

  const { submit, isLoading, error, existingResponse, isEditing } = useSubmit({
    elementId,
    mode,
    pollOptions: options,
    user,
    onSuccess: (response) => {
      setIsSubmitted(true);
      onSubmit?.(response);
      autoCloseTimerRef.current = setTimeout(() => {
        closeModal();
        setIsSubmitted(false);
      }, 3000);
    },
    onError: (err) => {
      console.warn('[Gotcha] Submission failed:', err instanceof Error ? err.message : err);
      onError?.(err as unknown as GotchaError);
    },
  });

  const handleOpen = useCallback(() => {
    if (containerRef.current) {
      setAnchorRect(containerRef.current.getBoundingClientRect());
    }
    openModal(elementId);
    onOpen?.();
  }, [elementId, openModal, onOpen]);

  const handleClose = useCallback(() => {
    clearTimeout(autoCloseTimerRef.current);
    closeModal();
    setIsSubmitted(false);
    onClose?.();
  }, [closeModal, onClose]);

  const handleSubmit = useCallback(
    (data: { content?: string; rating?: number; vote?: 'up' | 'down'; pollSelected?: string[]; isBug?: boolean }) => {
      submit(data);
    },
    [submit]
  );

  const effectiveSubmitText = isEditing ? 'Update' : submitText;

  if (disabled || !visible) return null;

  const positionStyles: Record<Position, React.CSSProperties> = {
    'top-right': { position: 'absolute', top: 0, right: 0, transform: 'translate(50%, -50%)' },
    'top-left': { position: 'absolute', top: 0, left: 0, transform: 'translate(-50%, -50%)' },
    'bottom-right': { position: 'absolute', bottom: 0, right: 0, transform: 'translate(50%, 50%)' },
    'bottom-left': { position: 'absolute', bottom: 0, left: 0, transform: 'translate(-50%, 50%)' },
    'inline': { position: 'relative', display: 'inline-flex' },
  };

  const modalProps = {
    mode,
    theme,
    customStyles,
    promptText,
    placeholder,
    submitText: effectiveSubmitText,
    thankYouMessage,
    isLoading,
    isSubmitted,
    error,
    existingResponse,
    isEditing,
    showText,
    showRating,
    voteLabels,
    options,
    allowMultiple,
    npsQuestion,
    npsFollowUp,
    npsFollowUpPlaceholder,
    npsLowLabel,
    npsHighLabel,
    enableBugFlag,
    bugFlagLabel,
    onSubmit: handleSubmit,
    onClose: handleClose,
    anchorRect: anchorRect || undefined,
  };

  return (
    <div
      ref={containerRef}
      style={{
        ...positionStyles[position],
        zIndex: isOpen ? 10000 : 'auto',
      }}
      className="gotcha-container"
      data-gotcha-element={elementId}
    >
      <GotchaButton
        size={size}
        theme={theme}
        customStyles={customStyles}
        showOnHover={showOnHover}
        touchBehavior={touchBehavior}
        onClick={handleOpen}
        isOpen={isOpen}
        isParentHovered={isParentHovered}
        animated={animated}
      />

      {isOpen && !isMobile && (
        <GotchaModal {...modalProps} />
      )}

      {/* Mobile: frosted glass backdrop portal */}
      {isOpen && isMobile && hasMounted && createPortal(
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          className="gotcha-overlay-enter"
          onClick={handleClose}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <GotchaModal {...modalProps} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
