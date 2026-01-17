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
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setIsTouch(isTouchDevice());
    // Detect system theme preference
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(darkQuery.matches ? 'dark' : 'light');

    // Listen for theme changes
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    darkQuery.addEventListener('change', handler);
    return () => darkQuery.removeEventListener('change', handler);
  }, []);

  // Determine visibility
  const shouldShow = (() => {
    // Always show if modal is open
    if (isOpen) return true;

    // Desktop with showOnHover: only show when parent is hovered
    if (!isTouch && showOnHover) {
      return isParentHovered;
    }

    // Touch device with tap-to-reveal: show only after first tap
    if (isTouch && touchBehavior === 'tap-to-reveal') {
      return tapRevealed;
    }

    // All other cases: always visible
    return true;
  })();

  const handleClick = () => {
    // For tap-to-reveal on touch: first tap reveals, second tap opens
    if (isTouch && touchBehavior === 'tap-to-reveal' && !tapRevealed) {
      setTapRevealed(true);
      return;
    }
    onClick();
  };

  const buttonSize = getResponsiveSize(size, isTouch);

  // Determine theme colors
  const resolvedTheme = theme === 'auto' ? systemTheme : theme;

  const baseStyles: React.CSSProperties = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: resolvedTheme === 'dark' ? '#374151' : '#c7d2dc',
    color: resolvedTheme === 'dark' ? '#e5e7eb' : '#4b5563',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    // CSS transition for animations
    transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
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
      <GotchaIcon size={buttonSize * 0.75} />
    </button>
  );
}

function GotchaIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="16"
        fontWeight="bold"
        fill="currentColor"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        G
      </text>
    </svg>
  );
}
