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
  /** Enable entrance animations (default: true) */
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
  const [hasPopped, setHasPopped] = useState(false);

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

  // Mark bubble pop as done after first appearance
  useEffect(() => {
    if (shouldShow && !hasPopped) {
      const timer = setTimeout(() => setHasPopped(true), 600);
      return () => clearTimeout(timer);
    }
  }, [shouldShow, hasPopped]);

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

  // Compute transform based on state
  const getTransform = () => {
    if (!shouldShow) return 'scale(0.6)';
    if (isPressed) return 'scale(0.95)';
    if (isHovered) return 'scale(1.08)';
    return 'scale(1)';
  };

  const baseStyles: React.CSSProperties = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: '50%',
    border: t.colors.glassBorder,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: t.colors.glassBackground,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    color: t.colors.glassColor,
    boxShadow: isHovered ? t.colors.glassHoverShadow : t.colors.glassShadow,
    transition: hasPopped ? `all 0.3s ${t.animation.easing.spring}` : 'none',
    opacity: shouldShow ? 1 : 0,
    transform: getTransform(),
    filter: isPressed ? 'brightness(0.95)' : 'brightness(1)',
    pointerEvents: shouldShow ? 'auto' : 'none',
    ...(animated && shouldShow && !hasPopped ? {
      animation: 'gotcha-bubble-pop 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both, gotcha-arrive-glow 1200ms ease-in-out 600ms both',
    } : {}),
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
      <GotchaIcon size={buttonSize * 0.65} animated={animated} />
      {queuedCount > 0 && (
        <div
          aria-label={`${queuedCount} queued`}
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: t.colors.warning,
            border: '1.5px solid rgba(255,255,255,0.9)',
          }}
        />
      )}
    </button>
  );
}

function GotchaIcon({ size, animated = true }: { size: number; animated?: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <span
      aria-hidden="true"
      style={{
        fontFamily: "'Carter One', cursive",
        fontSize: size,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: size * 0.05,
        marginRight: size * 0.05,
        userSelect: 'none',
        opacity: animated ? 0 : (mounted ? 1 : 0),
        ...(animated && mounted ? {
          animation: 'gotcha-letter-in 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 200ms both',
        } : {}),
      }}
    >
      G
    </span>
  );
}
