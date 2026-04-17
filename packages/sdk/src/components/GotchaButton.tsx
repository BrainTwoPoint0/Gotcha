import React, { useState, useEffect, useMemo } from "react";
import { Size, Theme, GotchaStyles } from "../types";
import { cn } from "../utils/cn";
import { isTouchDevice, getResponsiveSize } from "../utils/device";
import { resolveTheme } from "../theme/resolveTheme";
import { useGotchaContext } from "./GotchaProvider";

export interface GotchaButtonProps {
  size: Size;
  theme: Theme;
  customStyles?: GotchaStyles;
  showOnHover: boolean;
  touchBehavior: "always-visible" | "tap-to-reveal";
  onClick: () => void;
  isOpen: boolean;
  isParentHovered?: boolean;
  /** Enable entrance animation (default: true) */
  animated?: boolean;
  /** Number of queued offline submissions */
  queuedCount?: number;
}

function getInitialSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
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
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    getInitialSystemTheme,
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  const { themeConfig } = useGotchaContext();

  useEffect(() => {
    setIsTouch(isTouchDevice());

    if (typeof window === "undefined") return;
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? "dark" : "light");
    darkQuery.addEventListener("change", handler);
    return () => darkQuery.removeEventListener("change", handler);
  }, []);

  // Determine visibility
  const shouldShow = (() => {
    if (isOpen) return true;
    if (!isTouch && showOnHover) return isParentHovered;
    if (isTouch && touchBehavior === "tap-to-reveal") return tapRevealed;
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
    if (isTouch && touchBehavior === "tap-to-reveal" && !tapRevealed) {
      setTapRevealed(true);
      return;
    }
    onClick();
  };

  const buttonSize = getResponsiveSize(size, isTouch);
  const t = useMemo(
    () => resolveTheme(theme, systemTheme, themeConfig),
    [theme, systemTheme, themeConfig],
  );

  // The open-state brand moment — border + glyph colour switch to the
  // editorial accent. Computed once per render so the transition can
  // interpolate borderColor smoothly.
  const borderColor = isOpen ? t.colors.warning /* sienna */ : t.colors.border;
  const glyphColor = isOpen ? t.colors.warning : t.colors.glassColor;

  // Transform ladder — editorial button stays put on hover. Lift-on-hover
  // reads as tech-button bounce; a quiet editorial card earns attention
  // with shadow weight, not movement. Only press registers a scale-down
  // (tactile "click received"), and entrance fades in from slight scale.
  //   hidden:  scale(0.96), opacity 0
  //   press:   scale(0.97)
  //   rest/hover: scale(1)  — shadow + border-color carry the hover cue
  const getTransform = () => {
    if (!shouldShow) return "scale(0.96)";
    if (isPressed) return "scale(0.97)";
    return "scale(1)";
  };

  // Asymmetric press timing: fast on the way in (80ms = "you registered my
  // click immediately"), slower on the way out (160ms = "settling back"),
  // smoothest on rest hover (180ms). Open-state colour swap gets its own
  // 240ms curve — deliberate brand moment, not a reactive flicker.
  const transitionDur = isPressed ? "80ms" : "160ms";
  const easing = t.animation.easing.default;

  // Hover cue: background warms one step (paper → surface-hover) + shadow
  // deepens. Glyph stays untouched — no scale, no opacity shift. Button
  // geometry stays put (no lift).
  const backgroundColor =
    isHovered && !isOpen ? t.colors.surfaceHover : t.colors.glassBackground;

  const baseStyles: React.CSSProperties = {
    position: "relative",
    width: buttonSize,
    height: buttonSize,
    borderRadius: t.borders.radius.full,
    border: `1px solid ${borderColor}`,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: backgroundColor,
    color: glyphColor,
    boxShadow: isHovered ? t.colors.glassHoverShadow : t.colors.glassShadow,
    transition: hasEntered
      ? `transform ${transitionDur} ${easing}, background-color 180ms ${easing}, box-shadow 180ms ${easing}, border-color 240ms ${easing}, color 240ms ${easing}`
      : `opacity 320ms ${easing}, transform 320ms ${easing}`,
    opacity: shouldShow ? 1 : 0,
    transform: getTransform(),
    pointerEvents: shouldShow ? "auto" : "none",
    ...customStyles?.button,
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={baseStyles}
      className={cn("gotcha-button", isOpen && "gotcha-button--open")}
      aria-label="Give feedback on this feature"
      aria-expanded={isOpen}
      aria-haspopup="dialog"
    >
      <GotchaIcon
        size={buttonSize * 0.62}
        color={glyphColor}
        fontFamilyDisplay={t.typography.fontFamilyDisplay}
        animated={animated && !hasEntered}
      />
      {queuedCount > 0 && (
        <span
          aria-label={`${queuedCount} queued`}
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: "50%",
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
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <span
      aria-hidden="true"
      style={{
        // The serif G is the brand mark. Fraunces-first with system-serif
        // fallback. Weight 400 (Regular) matches the embedded Fraunces 9pt
        // subset and the marketing navbar's effective weight. Avoids the
        // browser synthesizing bold against a regular-only @font-face.
        fontFamily: fontFamilyDisplay,
        fontWeight: 400,
        fontSize: size,
        fontStyle: "normal",
        lineHeight: 1,
        color,
        // Optical centering — a capital G's visible bowl sits slightly
        // ABOVE the ink-rect center. Prior iteration used translateY(0.5px)
        // which is sub-pixel; during the button's bg-color hover
        // transition the text AA re-snapped per repaint and the glyph
        // appeared to "twitch" each frame. Fix: snap to integer pixel
        // with translateY(1px) (0.5px imperceptibly different from 1px
        // at this size) and promote to its own compositor layer via
        // translateZ(0) + will-change: transform so the glyph is
        // composited once and not repainted with the button.
        transform: "translateY(1px) translateZ(0)",
        willChange: "transform",
        letterSpacing: "normal",
        userSelect: "none",
        display: "inline-block",
        opacity: animated ? (mounted ? 1 : 0) : 1,
        transition: animated
          ? "opacity 240ms cubic-bezier(0.22, 0.61, 0.36, 1) 120ms"
          : "none",
      }}
    >
      G
    </span>
  );
}
