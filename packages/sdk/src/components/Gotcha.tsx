import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
} from "../types";
import { DEFAULTS } from "../constants";
import { useGotchaContext } from "./GotchaProvider";
import { useSubmit } from "../hooks/useSubmit";
import { useHideAfterSubmit } from "../hooks/useHideAfterSubmit";
import { useTriggerConditions } from "../hooks/useTriggerConditions";
import { GotchaButton } from "./GotchaButton";
import { GotchaModal } from "./GotchaModal";

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
  mode = "feedback",
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
    debug,
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
  const [phase, setPhase] = useState<"form" | "followUp" | "success">("form");
  const [lastResponseId, setLastResponseId] = useState<string | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [isParentHovered, setIsParentHovered] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSubmitDataRef = useRef<{
    rating?: number;
    vote?: "up" | "down";
  } | null>(null);

  // Full SubmitData payload for the most recent click. Held so the failure
  // toast's "Retry" button can re-fire the exact same payload — the modal
  // has closed by the time the user sees the toast, so we can't re-read
  // form state from children. Cleared on successful settle.
  const pendingDataRef = useRef<{
    content?: string;
    title?: string;
    rating?: number;
    vote?: "up" | "down";
    pollSelected?: string[];
    isBug?: boolean;
    screenshot?: string;
  } | null>(null);

  // Failure toast — only shown when the optimistic UI was already flipped
  // to success but the background POST rejected. Preserves the payload so
  // the user can retry without reopening the modal.
  const [failureToast, setFailureToast] = useState<{
    message: string;
    retrying: boolean;
  } | null>(null);

  // SSR-safe mount detection + live viewport tracking. Uses matchMedia so
  // we only re-render when the viewport actually crosses the breakpoint,
  // not on every resize pixel.
  //
  // Breakpoint at 1023px (Tailwind `lg:` — standard laptop threshold).
  // Below that, the modal centres with a full-width backdrop; above, it
  // anchors beneath the button. Two lower breakpoints (639, 767) were
  // tested first and both left a middle-viewport dead-zone where the
  // modal hugged the button in a narrow column with the rest of the
  // viewport empty — neither small enough for the mobile centered
  // treatment nor wide enough for anchored-popover to read as integrated.
  // Anchored-popover is a desktop pattern; it needs desktop width to work.
  useEffect(() => {
    setHasMounted(true);
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
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
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [client]);

  const isOpen = activeModalId === elementId;

  // Re-measure the anchor rect when viewport changes while the modal is
  // open. Only runs on desktop (isMobile=false) because the mobile
  // centered layout ignores anchorRect entirely — re-measuring during a
  // drag across the breakpoint just caused a per-pixel flicker without
  // any visual benefit.
  //
  // rAF-throttled: resize events fire at ~60Hz during a drag; without
  // throttling React re-renders the portal modal dozens of times per
  // second, causing position jitter. Coalescing into the next animation
  // frame keeps the modal rock-steady.
  useEffect(() => {
    if (!isOpen || isMobile) return;
    let rafId = 0;
    const reanchor = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const el = containerRef.current;
        if (!el) return;
        const button = el.querySelector("button");
        setAnchorRect((button ?? el).getBoundingClientRect());
      });
    };
    window.addEventListener("resize", reanchor);
    window.addEventListener("scroll", reanchor, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", reanchor);
      window.removeEventListener("scroll", reanchor);
    };
  }, [isOpen, isMobile]);

  // Reset phase when modal is closed externally (e.g., another modal opens)
  useEffect(() => {
    if (!isOpen) {
      setPhase("form");
      clearTimeout(autoCloseTimerRef.current);
    }
  }, [isOpen]);

  // Scroll lock on mobile when modal is open
  useEffect(() => {
    if (!isOpen || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
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

    parent.addEventListener("mouseenter", handleMouseEnter);
    parent.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      parent.removeEventListener("mouseenter", handleMouseEnter);
      parent.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [showOnHover]);

  const {
    submit,
    isLoading,
    isCheckingExisting,
    error,
    existingResponse,
    isEditing,
  } = useSubmit({
    elementId,
    mode,
    pollOptions: options,
    user,
    userEmail: userEmail ?? defaultUserEmail,
    onePerUser,
    cooldownDays,
    // Phase flip happens synchronously in handleSubmit (optimistic UI);
    // onSuccess reconciles the server-returned id + clears any pending
    // retry toast from a previous attempt.
    onSuccess: (response) => {
      setLastResponseId(response.id);
      onSubmit?.(response);
      setFailureToast(null);
      pendingDataRef.current = null;
    },
    onError: (err) => {
      console.warn(
        "[Gotcha] Submission failed:",
        err instanceof Error ? err.message : err,
      );
      onError?.(err as unknown as GotchaError);
      // Background POST rejected after the optimistic success flip.
      // Show a retry toast with the preserved payload so the user can
      // recover without losing their input. The modal has already moved
      // on — never silently swallow the failure.
      if (pendingDataRef.current) {
        setFailureToast({
          message: err instanceof Error ? err.message : "Something went wrong",
          retrying: false,
        });
      }
    },
  });

  const handleOpen = useCallback(() => {
    if (containerRef.current) {
      // Measure the actual button element, not the container div.
      // The container (inline-flex) can be larger than the button due to
      // line-height, baseline alignment, or inherited layout styles from
      // the parent — causing the modal to appear with a gap.
      const button = containerRef.current.querySelector("button");
      setAnchorRect((button ?? containerRef.current).getBoundingClientRect());
    }
    openModal(elementId);
    onOpen?.();
  }, [elementId, openModal, onOpen]);

  const handleClose = useCallback(() => {
    clearTimeout(autoCloseTimerRef.current);
    closeModal();
    setPhase("form");
    onClose?.();
  }, [closeModal, onClose]);

  // Optimistic submit — flip phase BEFORE the server round-trip so the
  // user sees the success state (or follow-up prompt) within one paint
  // frame. The POST runs in the background via submit(); onSuccess
  // reconciles the id, onError shows a retry toast with preserved data.
  //
  // Follow-up decision + markHidden() both run from in-hand data (rating,
  // vote) — they never needed the server response.
  const handleSubmit = useCallback(
    (data: {
      content?: string;
      title?: string;
      rating?: number;
      vote?: "up" | "down";
      pollSelected?: string[];
      isBug?: boolean;
      screenshot?: string;
    }) => {
      lastSubmitDataRef.current = { rating: data.rating, vote: data.vote };
      pendingDataRef.current = data;

      const shouldFollowUp =
        followUp &&
        ((followUp.ratingThreshold != null &&
          data.rating != null &&
          data.rating <= followUp.ratingThreshold) ||
          (followUp.onNegativeVote && data.vote === "down"));

      if (shouldFollowUp && mode !== "poll") {
        setPhase("followUp");
      } else {
        setPhase("success");
        autoCloseTimerRef.current = setTimeout(() => {
          closeModal();
          setPhase("form");
        }, 4000);
      }

      if (hideAfterSubmitDays) markHidden();

      // Fire the POST in background. onSuccess/onError in useSubmit
      // handle reconciliation; swallow rejection here so the unhandled
      // promise doesn't bubble to the host page.
      const submitStart =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      submit(data)
        .catch(() => {
          // Handled in onError.
        })
        .finally(() => {
          if (debug) {
            const ms =
              (typeof performance !== "undefined"
                ? performance.now()
                : Date.now()) - submitStart;
            console.log(`[Gotcha] Server ack in ${ms.toFixed(0)}ms`);
          }
        });
    },
    [
      submit,
      followUp,
      mode,
      hideAfterSubmitDays,
      markHidden,
      closeModal,
      debug,
    ],
  );

  // Retry the most recent failed submission. The modal has closed by
  // this point — we fire the POST silently and dismiss the toast on
  // success (via onSuccess → setFailureToast(null)). On a second
  // failure, onError re-shows the toast with the new error.
  const handleRetrySubmission = useCallback(() => {
    const data = pendingDataRef.current;
    if (!data || !failureToast || failureToast.retrying) return;
    setFailureToast({ ...failureToast, retrying: true });
    submit(data).catch(() => {
      // onError re-paints the toast.
    });
  }, [failureToast, submit]);

  const handleDismissToast = useCallback(() => {
    setFailureToast(null);
    pendingDataRef.current = null;
  }, []);

  // Handle follow-up submission
  const handleFollowUpSubmit = useCallback(
    async (content: string) => {
      if (!lastResponseId) return;
      setFollowUpLoading(true);
      try {
        await client.updateResponse(lastResponseId, { content });
      } catch (err) {
        // If follow-up fails, still show success — initial response is already saved
        console.warn(
          "[Gotcha] Follow-up submission failed:",
          err instanceof Error ? err.message : err,
        );
      } finally {
        setFollowUpLoading(false);
        setPhase("success");
        autoCloseTimerRef.current = setTimeout(() => {
          closeModal();
          setPhase("form");
        }, 4000);
      }
    },
    [lastResponseId, closeModal, client],
  );

  const effectiveSubmitText = onePerUser && isEditing ? "Update" : submitText;

  if (disabled || !visible || isHidden || !conditionsMet) return null;

  const positionStyles: Record<Position, React.CSSProperties> = {
    "top-right": {
      position: "absolute",
      top: 0,
      right: 0,
      transform: "translate(50%, -50%)",
    },
    "top-left": {
      position: "absolute",
      top: 0,
      left: 0,
      transform: "translate(-50%, -50%)",
    },
    "bottom-right": {
      position: "absolute",
      bottom: 0,
      right: 0,
      transform: "translate(50%, 50%)",
    },
    "bottom-left": {
      position: "absolute",
      bottom: 0,
      left: 0,
      transform: "translate(-50%, 50%)",
    },
    inline: { position: "relative", display: "inline-flex" },
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
    isSubmitted: phase === "success",
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
    isMobile,
  };

  return (
    <div
      ref={containerRef}
      style={{
        ...positionStyles[position],
        // Intentionally `auto` even when open: the modal is portaled to
        // document.body and sits at z-index 99999 in the root stacking
        // context. Elevating the container here traps it inside the host
        // page's stacking context, and the button then renders over the
        // portal at anchor-adjacent positions (the original "G floats on
        // top of the modal" bug). Leave the button's own stacking to the
        // host page — the modal's portal handles above/below behaviour.
        zIndex: "auto",
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

      {/* Single portal that adapts between desktop-anchored and mobile-
          centred layouts without unmounting GotchaModal. Keeping the same
          wrapper tree across breakpoints means form state (textarea
          content, selected stars/poll options, NPS score, bug flag,
          screenshot) survives a viewport resize across the 1023px
          threshold — without this, dragging a browser narrow mid-
          submission would wipe the user's work.

          The outer wrapper stays `position: fixed; inset: 0` in both
          layouts; only opacity + pointer-events toggle on isMobile. On
          desktop the backdrop is transparent + click-through (modal
          anchors via its own internal fixed-position calc). On mobile
          it's a 40% ink wash with 8px blur + click-to-close. Keeping
          layout constant — no jump from static-flow to fixed-fullscreen
          — kills the paint flicker that showed up when dragging across
          the breakpoint. */}
      {failureToast &&
        hasMounted &&
        createPortal(
          <FailureToast
            message={failureToast.message}
            retrying={failureToast.retrying}
            onRetry={handleRetrySubmission}
            onDismiss={handleDismissToast}
          />,
          document.body,
        )}

      {isOpen &&
        hasMounted &&
        createPortal(
          <div
            role="presentation"
            onClick={isMobile ? handleClose : undefined}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              backgroundColor: isMobile ? "rgba(26,23,20,0.32)" : "transparent",
              backdropFilter: isMobile ? "blur(8px)" : "none",
              WebkitBackdropFilter: isMobile ? "blur(8px)" : "none",
              pointerEvents: isMobile ? "auto" : "none",
              transition:
                "background-color 180ms cubic-bezier(0.22, 0.61, 0.36, 1)",
            }}
          >
            <div
              onClick={isMobile ? (e) => e.stopPropagation() : undefined}
              style={{ pointerEvents: "auto" }}
            >
              <GotchaModal {...modalProps} />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

/**
 * Failure toast — shown only when the background POST rejects after the
 * optimistic phase flip. Bottom-right on desktop, bottom-centre on mobile.
 * Never blocks interaction with the host page; `role="status"` +
 * `aria-live="polite"` so screen readers announce without interrupting.
 *
 * Keeps the retry count implicit: if the retry also fails, the `onError`
 * callback re-renders this same toast with a fresh message. If the retry
 * succeeds, `onSuccess` clears `failureToast` state and the toast unmounts.
 */
function FailureToast({
  message,
  retrying,
  onRetry,
  onDismiss,
}: {
  message: string;
  retrying: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="editorial"
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 99998,
        maxWidth: 360,
        borderRadius: 6,
        border: "1px solid rgba(155, 58, 46, 0.35)",
        backgroundColor: "#FAF8F4",
        boxShadow: "0 4px 16px rgba(26, 23, 20, 0.12)",
        padding: "14px 16px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
        color: "#1A1714",
        animation: "gotcha-fade-up 240ms cubic-bezier(0.22, 0.61, 0.36, 1)",
      }}
    >
      <div
        style={{
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Courier New', monospace",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          color: "#9B3A2E",
          marginBottom: 6,
        }}
      >
        Couldn&rsquo;t save
      </div>
      <p
        style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#1A1714" }}
      >
        {message || "Your feedback didn\u2019t reach us. Retry?"}
      </p>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          style={{
            backgroundColor: "#1A1714",
            color: "#FAF8F4",
            border: "none",
            borderRadius: 4,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 500,
            cursor: retrying ? "default" : "pointer",
            opacity: retrying ? 0.6 : 1,
            transition: "opacity 180ms",
          }}
        >
          {retrying ? "Retrying\u2026" : "Retry"}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            backgroundColor: "transparent",
            color: "#6B655D",
            border: "1px solid #E8E2D9",
            borderRadius: 4,
            padding: "6px 14px",
            fontSize: 12,
            cursor: "pointer",
            transition: "color 180ms",
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
