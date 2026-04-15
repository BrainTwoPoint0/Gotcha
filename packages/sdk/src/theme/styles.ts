import { ResolvedTheme } from './tokens';

const STYLE_ID = 'gotcha-styles';

/**
 * Strip characters that could break out of a CSS value context. Defensive
 * when interpolating tokens that customers could have overridden with a
 * malicious string via `themeConfig`.
 */
function sanitizeCSS(value: string): string {
  return value.replace(/[{}<>;@\\]/g, '');
}

/**
 * Build the SDK's stylesheet. The editorial refresh drops Carter One
 * base64 embedding — the display stack now relies on system serifs
 * (Georgia, Iowan Old Style, Charter, Source Serif Pro) with Fraunces
 * as an aspirational first-stack entry for hosts that load it. A
 * subsetted Fraunces woff2 is planned for 1.2.1.
 *
 * Keyframes kept lean: a single page-turn entrance (opacity + 8px rise),
 * a stroke-draw for the success check, a textarea expand, a spinner, and
 * the reduced-motion blanket. All the bouncy "bubble-pop / arrive-glow /
 * letter-in" animation — the pre-editorial signature — is gone.
 */
export function generateStyleTag(theme: ResolvedTheme): string {
  const easing = sanitizeCSS(theme.animation.easing.default);
  const dNormal = sanitizeCSS(theme.animation.duration.normal);
  const dFast = sanitizeCSS(theme.animation.duration.fast);
  const fontFamily = sanitizeCSS(theme.typography.fontFamily);
  const textDisabled = sanitizeCSS(theme.colors.textDisabled);
  const borderFocus = sanitizeCSS(theme.colors.borderFocus);

  return `
/* ── Gotcha keyframes (editorial) ───────────────────────────── */

@keyframes gotcha-fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes gotcha-modal-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes gotcha-modal-in-above {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes gotcha-modal-in-center {
  from { opacity: 0; transform: translate(-50%, calc(-50% + 8px)); }
  to { opacity: 1; transform: translate(-50%, -50%); }
}

@keyframes gotcha-overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes gotcha-check-draw {
  from { stroke-dashoffset: 30; }
  to { stroke-dashoffset: 0; }
}

@keyframes gotcha-expand-in {
  from { opacity: 0; max-height: 0; margin-top: 0; }
  to { opacity: 1; max-height: 240px; margin-top: 14px; }
}

@keyframes gotcha-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@keyframes gotcha-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Base styles ────────────────────────────────────────────── */

[data-gotcha] {
  font-family: ${fontFamily};
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings: 'kern' 1, 'liga' 1;
}

[data-gotcha] *, [data-gotcha] *::before, [data-gotcha] *::after {
  box-sizing: border-box;
}

[data-gotcha] button {
  outline: none;
}

[data-gotcha] button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px ${borderFocus};
}

.gotcha-root textarea::placeholder {
  color: ${textDisabled};
  /* Upright, not italic — italic placeholders depress comprehension in
     form inputs (Baymard). Italic is reserved for verb states like
     "Sending…" where it communicates motion/time. */
}

/* ── Animation utilities ───────────────────────────────────── */

.gotcha-fade-up {
  animation: gotcha-fade-up ${dNormal} ${easing} both;
}

.gotcha-modal-enter {
  animation: gotcha-modal-in ${dNormal} ${easing} both;
}

.gotcha-modal-enter-above {
  animation: gotcha-modal-in-above ${dNormal} ${easing} both;
}

.gotcha-modal-enter-center {
  animation: gotcha-modal-in-center ${dNormal} ${easing} both;
}

.gotcha-overlay-enter {
  animation: gotcha-overlay-in ${dFast} ${easing} both;
}

/* ── Reduced motion ──────────────────────────────────────────
   Kill transforms and retime animations to near-instant. We carve out
   the Spinner explicitly — it's the one widget surface where animation
   communicates indeterminate status. Silencing it would leave reduced-
   motion users staring at a static arc with no feedback that work is
   in flight.
*/
@media (prefers-reduced-motion: reduce) {
  [data-gotcha] *:not([role="img"]), [data-gotcha] *::before, [data-gotcha] *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
    transform: none !important;
  }
  [data-gotcha] .gotcha-fade-up,
  [data-gotcha] .gotcha-modal-enter,
  [data-gotcha] .gotcha-modal-enter-above,
  [data-gotcha] .gotcha-modal-enter-center,
  [data-gotcha] .gotcha-overlay-enter {
    opacity: 1 !important;
  }
}
`.trim();
}

/**
 * Inject the style tag into the document head (idempotent).
 *
 * Privacy: makes zero third-party network calls. No Google Fonts link,
 * no CDN, no base64 font blob in 1.2.0 (Fraunces subset arrives in
 * 1.2.1). Display typography relies on system serifs.
 */
export function injectStyles(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return;

  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = generateStyleTag(theme);
}
