import React, { useState, useEffect } from 'react';
import { Size, Theme, GotchaStyles } from '../types';
import { cn } from '../utils/cn';
import { isTouchDevice, getResponsiveSize } from '../utils/device';

export interface GotchaButtonProps {
  size: Size;
  theme: Theme;
  customStyles?: GotchaStyles;
  showOnHover: boolean;
  touchBehavior: 'always-visible' | 'tap-to-reveal';
  onClick: () => void;
  isOpen: boolean;
  isParentHovered?: boolean;
}

/**
 * Detect system color-scheme preference synchronously where possible,
 * falling back to 'light'. This avoids the flash that occurred when
 * the old code always initialised state as 'light' and corrected it
 * inside useEffect.
 */
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
}: GotchaButtonProps) {
  const [isTouch, setIsTouch] = useState(false);
  const [tapRevealed, setTapRevealed] = useState(false);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getInitialSystemTheme);

  useEffect(() => {
    setIsTouch(isTouchDevice());

    // Keep systemTheme in sync when user changes OS preference
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

  const handleClick = () => {
    if (isTouch && touchBehavior === 'tap-to-reveal' && !tapRevealed) {
      setTapRevealed(true);
      return;
    }
    onClick();
  };

  const buttonSize = getResponsiveSize(size, isTouch);

  // ── Resolve theme ────────────────────────────────────────────────
  // "auto" must produce the *exact* same styles as the explicit theme
  // it resolves to. Previously the initial state defaulted to 'light'
  // regardless of the actual preference, causing a mismatch on the
  // first render when the system was dark.
  const resolvedTheme = theme === 'auto' ? systemTheme : theme;
  const isDark = resolvedTheme === 'dark';

  // ── Glass-bubble styles ──────────────────────────────────────────
  // Simulates a raised glass dome / marble sitting on the surface:
  //   - Bright borderTop highlight mimics light hitting the top edge
  //   - Subtle darker base border grounds the bottom
  //   - Vertical gradient: bright at top, more opaque at bottom
  //   - Inset top shadow for inner refraction glow
  //   - Inset bottom shadow for depth within the dome
  //   - Outer shadow to anchor the bubble to the surface
  const baseStyles: React.CSSProperties = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: '50%',
    border: isDark
      ? '1px solid rgba(255,255,255,0.15)'
      : 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isDark
      ? 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 60%, rgba(0,0,0,0.05) 100%)'
      : 'linear-gradient(160deg, rgba(255,255,255,0.7) 0%, rgba(200,210,230,0.4) 40%, rgba(180,192,220,0.5) 100%)',
    backdropFilter: 'blur(16px) saturate(170%)',
    WebkitBackdropFilter: 'blur(16px) saturate(170%)',
    color: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.75)',
    boxShadow: isDark
      ? [
          '0 4px 14px rgba(0,0,0,0.45)',
          '0 1px 3px rgba(0,0,0,0.35)',
          'inset 0 1px 2px rgba(255,255,255,0.1)',
          'inset 0 -1px 2px rgba(0,0,0,0.08)',
        ].join(', ')
      : [
          '0 3px 12px rgba(0,0,0,0.12)',
          '0 0 1px rgba(0,0,0,0.2)',
          'inset 0 4px 8px rgba(255,255,255,0.95)',
          'inset 0 -4px 8px rgba(0,0,0,0.08)',
        ].join(', '),
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: shouldShow ? 1 : 0,
    transform: shouldShow ? 'scale(1)' : 'scale(0.6)',
    pointerEvents: shouldShow ? 'auto' : 'none',
    ...customStyles?.button,
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={baseStyles}
      className={cn('gotcha-button', isOpen && 'gotcha-button--open')}
      aria-label="Give feedback on this feature"
      aria-expanded={isOpen}
      aria-haspopup="dialog"
    >
      <GotchaIcon size={buttonSize * 0.65} />
    </button>
  );
}

const FONT_ID = 'gotcha-carter-one';

function useCarterOneFont() {
  useEffect(() => {
    if (document.getElementById(FONT_ID)) return;
    const link = document.createElement('link');
    link.id = FONT_ID;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Carter+One&display=swap';
    document.head.appendChild(link);
  }, []);
}

function GotchaIcon({ size }: { size: number }) {
  useCarterOneFont();
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
      }}
    >
      G
    </span>
  );
}
