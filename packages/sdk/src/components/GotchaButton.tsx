import React, { useState, useEffect, useMemo } from 'react';
import { Size, Theme, GotchaStyles } from '../types';
import { cn } from '../utils/cn';
import { isTouchDevice, getResponsiveSize } from '../utils/device';
import { resolveTheme } from '../theme/resolveTheme';
import { useGotchaContext } from './GotchaProvider';

export interface GotchaButtonProps {
  size: Size;
  theme: Theme;
  customStyles?: GotchaStyles;
  showOnHover: boolean;
  touchBehavior: 'always-visible' | 'tap-to-reveal';
  onClick: () => void;
  isOpen: boolean;
  isParentHovered?: boolean;
  /** Enable entrance animation (default: true) */
  animated?: boolean;
  /** Number of queued offline submissions */
  queuedCount?: number;
}

function getInitialSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * The floating G button — the single most-seen surface of the widget.
 *
 * Editorial aesthetic: a composed paper card (not glassmorphism), hairline
 * border, soft directional shadow, serif G. On hover the button lifts by
 * 1px and the shadow deepens — a quiet, confident hover. On active (press)
 * it settles back by 1px, scales to 97%.
 *
 * The open state is the one brand moment: border switches to burnt sienna
 * and the G glyph turns sienna too. This is the only place on the button
 * the accent appears. It tells the user "you've activated this — it's
 * listening."
 *
 * Entrance: opacity 0 → 1 with a 6px rise over 320ms page-turn. No bubble-
 * pop, no arrive-glow, no letter-in flutter. The whole pre-editorial
 * animation vocabulary is gone; the widget arrives like a card settling
 * onto a page, not a chat bubble bursting onto screen.
 */
export function GotchaButton({
  size,
  theme,
  customStyles,
  showOnHover,
  touchBehavior,
  onClick,
  isOpen,
  isParentHovered = false,
  animated = true,
  queuedCount = 0,
}: GotchaButtonProps) {
  const [isTouch, setIsTouch] = useState(false);
  const [tapRevealed, setTapRevealed] = useState(false);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getInitialSystemTheme);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  const { themeConfig } = useGotchaContext();

  useEffect(() => {
    setIsTouch(isTouchDevice());

    if (typeof window === 'undefined') return;
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? 'dark' : 'light');
    darkQuery.addEventListener('change', handler);
    return () => darkQuery.removeEventListener('change', handler);
  }, []);

  // Determine visibility
  const shouldShow = (() => {
    if (isOpen) return true;
    if (!isTouch && showOnHover) return isParentHovered;
    if (isTouch && touchBehavior === 'tap-to-reveal') return tapRevealed;
    return true;
  })();

  // Mark the entrance animation complete so subsequent hover/press
  // transforms use the smooth page-turn easing.
  useEffect(() => {
    if (shouldShow && !hasEntered) {
      const timer = setTimeout(() => setHasEntered(true), 320);
      return () => clearTimeout(timer);
    }
  }, [shouldShow, hasEntered]);

  const handleClick = () => {
    if (isTouch && touchBehavior === 'tap-to-reveal' && !tapRevealed) {
      setTapRevealed(true);
      return;
    }
    onClick();
  };

  const buttonSize = getResponsiveSize(size, isTouch);
  const t = useMemo(
    () => resolveTheme(theme, systemTheme, themeConfig),
    [theme, systemTheme, themeConfig]
  );

  // The open-state brand moment — border + glyph colour switch to the
  // editorial accent. Computed once per render so the transition can
  // interpolate borderColor smoothly.
  const borderColor = isOpen
    ? t.colors.warning /* sienna */
    : t.colors.border;
  const glyphColor = isOpen ? t.colors.warning : t.colors.glassColor;

  // Transform ladder:
  //   hidden:  scale(0.96), opacity 0 (pre-entrance)
  //   press:   translateY(0) scale(0.97)   — 90ms
  //   hover:   translateY(-1px) scale(1)   — 180ms
  //   rest:    translateY(0) scale(1)      — 180ms
  const getTransform = () => {
    if (!shouldShow) return 'translateY(0) scale(0.96)';
    if (isPressed) return 'translateY(0) scale(0.97)';
    if (isHovered) return 'translateY(-1px) scale(1)';
    return 'translateY(0) scale(1)';
  };

  const transitionDur = isPressed ? '90ms' : '180ms';
  const easing = t.animation.easing.default;

  const baseStyles: React.CSSProperties = {
    position: 'relative',
    width: buttonSize,
    height: buttonSize,
    borderRadius: t.borders.radius.full,
    border: `1px solid ${borderColor}`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: t.colors.glassBackground,
    color: glyphColor,
    boxShadow: isHovered ? t.colors.glassHoverShadow : t.colors.glassShadow,
    transition: hasEntered
      ? `transform ${transitionDur} ${easing}, box-shadow ${transitionDur} ${easing}, border-color ${transitionDur} ${easing}, color ${transitionDur} ${easing}`
      : `opacity 320ms ${easing}, transform 320ms ${easing}`,
    opacity: shouldShow ? 1 : 0,
    transform: getTransform(),
    pointerEvents: shouldShow ? 'auto' : 'none',
    ...customStyles?.button,
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={baseStyles}
      className={cn('gotcha-button', isOpen && 'gotcha-button--open')}
      aria-label="Give feedback on this feature"
      aria-expanded={isOpen}
      aria-haspopup="dialog"
    >
      <GotchaIcon
        size={buttonSize * 0.58}
        color={glyphColor}
        fontFamilyDisplay={t.typography.fontFamilyDisplay}
        animated={animated && !hasEntered}
      />
      {queuedCount > 0 && (
        <span
          aria-label={`${queuedCount} queued`}
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: t.colors.warning,
            border: `1.5px solid ${t.colors.background}`,
          }}
        />
      )}
    </button>
  );
}

function GotchaIcon({
  size,
  color,
  fontFamilyDisplay,
  animated,
}: {
  size: number;
  color: string;
  fontFamilyDisplay: string;
  animated: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <span
      aria-hidden="true"
      style={{
        // The serif G is the brand mark. Fraunces-first with system-serif
        // fallback; weight 600 gives the display-optical character we want.
        fontFamily: fontFamilyDisplay,
        fontWeight: 600,
        fontSize: size,
        fontStyle: 'normal',
        lineHeight: 1,
        color,
        // Fraunces 'G' sits low on the baseline; pull it up 1px so the
        // glyph is optically centred inside the circle. Also nudge right
        // by 0.5px to compensate for the spur's visual weight on the left.
        transform: 'translate(0.5px, -1px)',
        letterSpacing: '-0.02em',
        userSelect: 'none',
        opacity: animated ? (mounted ? 1 : 0) : 1,
        transition: animated
          ? 'opacity 240ms cubic-bezier(0.22, 0.61, 0.36, 1) 120ms'
          : 'none',
      }}
    >
      G
    </span>
  );
}
