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
import { useHideAfterSubmit } from '../hooks/useHideAfterSubmit';
import { useTriggerConditions } from '../hooks/useTriggerConditions';
import { GotchaButton } from './GotchaButton';
import { GotchaModal } from './GotchaModal';

export interface GotchaProps {
  /** Unique identifier for this element */
  elementId: string;

  // User data
  /** User metadata for segmentation */
  user?: GotchaUser;

  /**
   * Submitter's email address. When set, the dashboard can email the user
   * a "we shipped what you asked for" note when their feedback hits the
   * SHIPPED status. Pass only with explicit user consent — store no other
   * PII in this field.
   */
  userEmail?: string;

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
  /** Enable screenshot capture when bug flag is toggled (uses modern-screenshot, bundled — no extra install needed) */
  enableScreenshot?: boolean;

  // Deduplication
  /** When true and user has already responded, show submitted state and allow review/edit instead of new submission */
  onePerUser?: boolean;
  /** When onePerUser is true, allow a new submission after this many days. Has no effect without onePerUser. */
  cooldownDays?: number;
  /** After submission, hide the widget for this many days (client-side, localStorage).
   *  Independent of cooldownDays — the widget stays hidden for the full duration even if cooldown expires sooner. */
  hideAfterSubmitDays?: number;

  // Trigger conditions
  /** Delay showing widget by N seconds after page load */
  showAfterSeconds?: number;
  /** Show widget after user scrolls past this percentage (0-100) */
  showAfterScrollPercent?: number;
  /** Show widget after user has visited N times (uses localStorage) */
  showAfterVisits?: number;

  // Follow-up
  /** Show a follow-up question after low rating or negative vote */
  followUp?: {
    /** Rating threshold (inclusive) — e.g., 2 means ratings 1-2 trigger follow-up */
    ratingThreshold?: number;
    /** Also trigger on negative vote */
    onNegativeVote?: boolean;
    /** The prompt text shown */
    promptText: string;
    /** Placeholder for the follow-up textarea */
    placeholder?: string;
  };

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
  userEmail,
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
  enableScreenshot = false,
  onePerUser = false,
  cooldownDays,
  hideAfterSubmitDays,
  showAfterSeconds,
  showAfterScrollPercent,
  showAfterVisits,
  followUp,
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
  const {
    disabled,
    activeModalId,
    openModal,
    closeModal,
    defaultUser,
    defaultUserEmail,
    client,
  } = useGotchaContext();

  const { conditionsMet } = useTriggerConditions({
    elementId,
    showAfterSeconds,
    showAfterScrollPercent,
    showAfterVisits,
  });

  const { isHidden, markHidden } = useHideAfterSubmit({
    elementId,
    userId: user?.id || defaultUser?.id,
    hideAfterSubmitDays,
  });
  const [phase, setPhase] = useState<'form' | 'followUp' | 'success'>('form');
  const [lastResponseId, setLastResponseId] = useState<string | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [isParentHovered, setIsParentHovered] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSubmitDataRef = useRef<{ rating?: number; vote?: 'up' | 'down' } | null>(null);

  // SSR-safe mount detection
  useEffect(() => {
    setHasMounted(true);
    setIsMobile(window.innerWidth < 640);
    return () => {
      clearTimeout(autoCloseTimerRef.current);
    };
  }, []);

  // Track offline queue length
  useEffect(() => {
    setQueuedCount(client.getQueueLength());
    const handleOnline = () => {
      // Queue will be flushed by provider; update count after a delay
      setTimeout(() => setQueuedCount(client.getQueueLength()), 2000);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [client]);

  const isOpen = activeModalId === elementId;

  // Reset phase when modal is closed externally (e.g., another modal opens)
  useEffect(() => {
    if (!isOpen) {
      setPhase('form');
      clearTimeout(autoCloseTimerRef.current);
    }
  }, [isOpen]);

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

  const { submit, isLoading, isCheckingExisting, error, existingResponse, isEditing } = useSubmit({
    elementId,
    mode,
    pollOptions: options,
    user,
    userEmail: userEmail ?? defaultUserEmail,
    onePerUser,
    cooldownDays,
    onSuccess: (response) => {
      setLastResponseId(response.id);
      if (hideAfterSubmitDays) markHidden();
      onSubmit?.(response);

      // Check if follow-up should trigger
      const shouldFollowUp = followUp && lastSubmitDataRef.current && (
        (followUp.ratingThreshold != null && lastSubmitDataRef.current.rating != null &&
         lastSubmitDataRef.current.rating <= followUp.ratingThreshold) ||
        (followUp.onNegativeVote && lastSubmitDataRef.current.vote === 'down')
      );

      if (shouldFollowUp && mode !== 'poll') {
        setPhase('followUp');
      } else {
        setPhase('success');
        autoCloseTimerRef.current = setTimeout(() => {
          closeModal();
          setPhase('form');
        }, 3000);
      }
    },
    onError: (err) => {
      console.warn('[Gotcha] Submission failed:', err instanceof Error ? err.message : err);
      onError?.(err as unknown as GotchaError);
    },
  });

  const handleOpen = useCallback(() => {
    if (containerRef.current) {
      // Measure the actual button element, not the container div.
      // The container (inline-flex) can be larger than the button due to
      // line-height, baseline alignment, or inherited layout styles from
      // the parent — causing the modal to appear with a gap.
      const button = containerRef.current.querySelector('button');
      setAnchorRect((button ?? containerRef.current).getBoundingClientRect());
    }
    openModal(elementId);
    onOpen?.();
  }, [elementId, openModal, onOpen]);

  const handleClose = useCallback(() => {
    clearTimeout(autoCloseTimerRef.current);
    closeModal();
    setPhase('form');
    onClose?.();
  }, [closeModal, onClose]);

  // Wrap submit to capture rating/vote for follow-up check
  const handleSubmit = useCallback(
    (data: { content?: string; rating?: number; vote?: 'up' | 'down'; pollSelected?: string[]; isBug?: boolean }) => {
      lastSubmitDataRef.current = { rating: data.rating, vote: data.vote };
      submit(data);
    },
    [submit]
  );

  // Handle follow-up submission
  const handleFollowUpSubmit = useCallback(
    async (content: string) => {
      if (!lastResponseId) return;
      setFollowUpLoading(true);
      try {
        await client.updateResponse(lastResponseId, { content });
      } catch (err) {
        // If follow-up fails, still show success — initial response is already saved
        console.warn('[Gotcha] Follow-up submission failed:', err instanceof Error ? err.message : err);
      } finally {
        setFollowUpLoading(false);
        setPhase('success');
        autoCloseTimerRef.current = setTimeout(() => {
          closeModal();
          setPhase('form');
        }, 3000);
      }
    },
    [lastResponseId, closeModal, client]
  );

  const effectiveSubmitText = (onePerUser && isEditing) ? 'Update' : submitText;

  if (disabled || !visible || isHidden || !conditionsMet) return null;

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
    isCheckingExisting: onePerUser && isCheckingExisting,
    isSubmitted: phase === 'success',
    phase,
    followUpConfig: followUp,
    followUpLoading,
    onFollowUpSubmit: handleFollowUpSubmit,
    error,
    existingResponse: onePerUser ? existingResponse : null,
    isEditing: onePerUser && isEditing,
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
    enableScreenshot,
    onSubmit: handleSubmit,
    onClose: handleClose,
    anchorRect: anchorRect || undefined,
    useFixedPosition: !isMobile,
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
        queuedCount={queuedCount}
      />

      {/* Desktop: portal without backdrop, anchored via fixed positioning */}
      {isOpen && !isMobile && hasMounted && createPortal(
        <GotchaModal {...modalProps} />,
        document.body
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
