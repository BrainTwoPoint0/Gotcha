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

  // Poll mode specific (Phase 2)
  /** Required if mode is 'poll' (2-6 options) */
  options?: string[];
  /** Allow selecting multiple options */
  allowMultiple?: boolean;
  /** Show results after voting */
  showResults?: boolean;

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
  showResults = true,
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile for portal rendering (SSR-safe)
  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  // This instance's modal is open if activeModalId matches our elementId
  const isOpen = activeModalId === elementId;

  // Attach hover listeners to the parent element (not the button container)
  useEffect(() => {
    if (!showOnHover) return;

    const container = containerRef.current;
    if (!container) return;

    // Find the parent element with position: relative
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
      // Auto-close after 3 seconds
      setTimeout(() => {
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
    closeModal();
    setIsSubmitted(false);
    onClose?.();
  }, [closeModal, onClose]);

  const handleSubmit = useCallback(
    (data: { content?: string; rating?: number; vote?: 'up' | 'down'; pollSelected?: string[] }) => {
      submit(data);
    },
    [submit]
  );

  // Don't render if disabled or not visible
  if (disabled || !visible) return null;

  // Position styles
  const positionStyles: Record<Position, React.CSSProperties> = {
    'top-right': { position: 'absolute', top: 0, right: 0, transform: 'translate(50%, -50%)' },
    'top-left': { position: 'absolute', top: 0, left: 0, transform: 'translate(-50%, -50%)' },
    'bottom-right': { position: 'absolute', bottom: 0, right: 0, transform: 'translate(50%, 50%)' },
    'bottom-left': { position: 'absolute', bottom: 0, left: 0, transform: 'translate(-50%, 50%)' },
    'inline': { position: 'relative', display: 'inline-flex' },
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
      />

      {isOpen && !isMobile && (
        <GotchaModal
          mode={mode}
          theme={theme}
          customStyles={customStyles}
          promptText={promptText}
          placeholder={placeholder}
          submitText={submitText}
          thankYouMessage={isEditing ? 'Your feedback has been updated!' : thankYouMessage}
          isLoading={isLoading}
          isSubmitted={isSubmitted}
          error={error}
          existingResponse={existingResponse}
          isEditing={isEditing}
          showText={showText}
          showRating={showRating}
          voteLabels={voteLabels}
          options={options}
          allowMultiple={allowMultiple}
          onSubmit={handleSubmit}
          onClose={handleClose}
          anchorRect={anchorRect || undefined}
        />
      )}

      {/* On mobile, render modal via portal to escape parent transform */}
      {isOpen && isMobile && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}
          onClick={handleClose}
          aria-hidden="true"
        >
          <div onClick={(e) => e.stopPropagation()}>
            <GotchaModal
              mode={mode}
              theme={theme}
              customStyles={customStyles}
              promptText={promptText}
              placeholder={placeholder}
              submitText={submitText}
              thankYouMessage={isEditing ? 'Your feedback has been updated!' : thankYouMessage}
              isLoading={isLoading}
              isSubmitted={isSubmitted}
              error={error}
              existingResponse={existingResponse}
              isEditing={isEditing}
              showText={showText}
              showRating={showRating}
              voteLabels={voteLabels}
              options={options}
              allowMultiple={allowMultiple}
              onSubmit={handleSubmit}
              onClose={handleClose}
              anchorRect={anchorRect || undefined}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
