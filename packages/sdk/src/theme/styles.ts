import { ResolvedTheme } from './tokens';

const STYLE_ID = 'gotcha-styles';
const FONT_ID = 'gotcha-dm-sans';
const FONT_FACE_ID = 'gotcha-carter-one';

/**
 * The Carter One @font-face CSS with base64-embedded woff2.
 * Uses font-display: block to prevent any fallback font from showing.
 * Since the font is base64-encoded (instant decode), the block period is negligible.
 */
const CARTER_ONE_FONT_FACE = `
@font-face {
  font-family: 'Carter One';
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url(data:font/woff2;base64,d09GMgABAAAAAAK4AA4AAAAABOwAAAJlAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGhQbXhwaBmAANBEICoFUgW8BNgIkAwgLBgAEIAWCUgcgGwoEUVQMHgC+OLCNaQVfBAoIrXGAIhjLIIM0CxavPfqMrzmLh6/9fufu20XEQyQzNNPOUEmimUZJpKLdIu3RKOU3O1hXc5D3YTdAbu+mRHU5AAIwC231R25qGGbpnwecyr34QQKM3gHMKMzOM4ogDSwQSreJE9bjISamQdCMwAAgeI0+S7qoy5j8TCDK8Ff4Fwm5+ecJhCwh9EgmsJiTo6S+/WkCPCU8DpCqr+hWKM/FBMRyfLPqV2LSlzBEIhqLxeGhIADg+rwoHxx58Oipm4301FUpgID4K8fAChoJFSYwAhNYKyDLAjudDimd9wA18hGDDvNkBE6AByBJiLpXVM2jgyht94hWK9yPQD+5lb948fAQKnfCK1PjBQWRayfW+hltCzAs9B8eX54Xd5g7vrzpiTswCeXB/VG5PNObmFr711KPrLKC6/mxys5avigCA+uFj8HGq+ErmaRDt/31k1XtfRtcI0pNluOCFEOOmVEOTg5eYn77Hq9Y0SJxu+bSBW5skqWS0VLXOvNJxgyRhVECycL7u2cb2pmOGdolPK+ORsLma1IHQCAY6I5NjWKsNzQVPeDnvzc7Pth+aTYMKHpqoEcCwSM4A6sVYPt/AIoeTckToLx4hELyieAj16Z4TKDbKYzIJOAW2JNhIptMhjyRlbXedjaymDv75i5jb1xkyVYiV4okyfIhmnG0EGNDIyMkVgmkUIJcmbJkQmLEi5Ehjz7iJF06pJeel1ETYiCBP/+OePouYuTKlyAX4iVTAl8JkhRIFyN3UpqAdTHa1nfVAy3Kk3LL2Ejf0Gch0McAqJNIAwAA) format('woff2');
}`.trim();

/**
 * Inject Carter One @font-face at module load time (top-level side effect).
 * This ensures the font is registered with the browser BEFORE any React
 * component renders, eliminating FOUT completely.
 */
function injectFontFace(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(FONT_FACE_ID)) return;

  const style = document.createElement('style');
  style.id = FONT_FACE_ID;
  style.textContent = CARTER_ONE_FONT_FACE;
  document.head.appendChild(style);
}

// Execute immediately when this module is imported
injectFontFace();

/** Strip characters that could break out of a CSS value context */
function sanitizeCSS(value: string): string {
  return value.replace(/[{}<>;@\\]/g, '');
}

/**
 * Generate the full CSS string for all Gotcha animations, fonts, and base styles.
 */
export function generateStyleTag(theme: ResolvedTheme): string {
  const easing = {
    default: sanitizeCSS(theme.animation.easing.default),
    spring: sanitizeCSS(theme.animation.easing.spring),
  };
  const duration = {
    normal: sanitizeCSS(theme.animation.duration.normal),
  };
  const fontFamily = sanitizeCSS(theme.typography.fontFamily);
  const textDisabled = sanitizeCSS(theme.colors.textDisabled);

  return `
/* ── Gotcha Keyframe Animations ────────────────────────────── */

@keyframes gotcha-modal-in {
  from { opacity: 0; transform: translateX(-50%) scale(0.92) translateY(-6px); }
  to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
}

@keyframes gotcha-modal-in-above {
  from { opacity: 0; transform: translateX(-50%) scale(0.92) translateY(6px); }
  to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
}

@keyframes gotcha-modal-in-center {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.92); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

@keyframes gotcha-success-pop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes gotcha-success-text {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes gotcha-check-draw {
  from { stroke-dashoffset: 24; }
  to { stroke-dashoffset: 0; }
}

@keyframes gotcha-glow-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.3); }
  50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
}

@keyframes gotcha-star-pulse {
  0% { transform: scale(1); }
  40% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

@keyframes gotcha-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes gotcha-fade-up {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes gotcha-overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes gotcha-expand-in {
  from { opacity: 0; max-height: 0; margin-top: 0; }
  to { opacity: 1; max-height: 200px; margin-top: 12px; }
}

@keyframes gotcha-bubble-pop {
  0% { transform: scale(0); opacity: 0; filter: blur(4px); }
  40% { opacity: 1; filter: blur(0px); }
  65% { transform: scale(1.08); }
  82% { transform: scale(0.97); }
  100% { transform: scale(1); opacity: 1; filter: blur(0px); }
}

@keyframes gotcha-letter-in {
  0% { opacity: 0; transform: scale(0.6) translateY(2px); filter: blur(3px); }
  100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
}

@keyframes gotcha-arrive-glow {
  0%, 100% { box-shadow: 0 3px 12px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.2); }
  50% { box-shadow: 0 4px 16px rgba(0,0,0,0.18), 0 0 1px rgba(0,0,0,0.25); }
}

@keyframes gotcha-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes gotcha-dash {
  0% { stroke-dasharray: 1, 62; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 40, 62; stroke-dashoffset: -12; }
  100% { stroke-dasharray: 1, 62; stroke-dashoffset: -62; }
}

/* ── Base Styles ───────────────────────────────────────────── */

[data-gotcha] {
  font-family: ${fontFamily};
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

[data-gotcha] *, [data-gotcha] *::before, [data-gotcha] *::after {
  box-sizing: border-box;
}

.gotcha-root textarea::placeholder {
  color: ${textDisabled};
}

/* ── Animation Utilities ───────────────────────────────────── */

.gotcha-fade-up {
  animation: gotcha-fade-up ${duration.normal} ${easing.default} both;
}

.gotcha-modal-enter {
  animation: gotcha-modal-in 0.3s ${easing.spring} both;
}

.gotcha-modal-enter-above {
  animation: gotcha-modal-in-above 0.3s ${easing.spring} both;
}

.gotcha-modal-enter-center {
  animation: gotcha-modal-in-center 0.3s ${easing.spring} both;
}

.gotcha-overlay-enter {
  animation: gotcha-overlay-in 0.2s ${easing.default} both;
}

/* ── Reduced Motion ────────────────────────────────────────── */

@media (prefers-reduced-motion: reduce) {
  [data-gotcha] *, [data-gotcha] *::before, [data-gotcha] *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`.trim();
}

/**
 * Inject the style tag into the document head (idempotent).
 */
export function injectStyles(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return;

  // Carter One is now loaded from Google Fonts alongside DM Sans

  // Inject DM Sans from Google Fonts with preconnect
  if (!document.getElementById(FONT_ID)) {
    // Preconnect to Google Fonts
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect);

    const preconnectStatic = document.createElement('link');
    preconnectStatic.rel = 'preconnect';
    preconnectStatic.href = 'https://fonts.gstatic.com';
    preconnectStatic.crossOrigin = 'anonymous';
    document.head.appendChild(preconnectStatic);

    // Load DM Sans and Carter One from Google Fonts
    const link = document.createElement('link');
    link.id = FONT_ID;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Carter+One&family=DM+Sans:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }

  // Inject or update style tag
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = generateStyleTag(theme);
}
