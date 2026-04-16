// ============================================
// THEME TOKEN SYSTEM
// ============================================
//
// Editorial palette aligned to the Gotcha dashboard / landing site (see
// apps/web/app/globals.css). Warm paper-and-ink base, hairline rules,
// burnt sienna as the sole memorable accent, sage + clay as semantic
// affirm/warn. Zero glassmorphism — the widget is a composed editorial
// card, not a blurred glass surface.
//
// The token *shape* (`ResolvedTheme` + sub-interfaces) is identical to
// prior releases so customers' `themeConfig` / `customStyles` overrides
// keep working. Only the values change. Keys like `glassBackground`
// are retained for type-compat and reassigned to editorial equivalents
// (paper / sienna ring). See the light preset for the full mapping.

export interface GotchaThemeColors {
  primary: string;
  primaryHover: string;
  primaryText: string;
  background: string;
  backgroundGradient: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  textDisabled: string;
  border: string;
  borderFocus: string;
  success: string;
  successSurface: string;
  error: string;
  errorSurface: string;
  errorBorder: string;
  warning: string;
  warningActive: string;
  warningSurface: string;
  warningBorder: string;
  starFilled: string;
  starEmpty: string;
  voteUp: string;
  voteUpSurface: string;
  voteUpBorder: string;
  voteDown: string;
  voteDownSurface: string;
  voteDownBorder: string;
  npsColors: string[];
  buttonBackground: string;
  buttonBackgroundHover: string;
  buttonBackgroundDisabled: string;
  buttonColor: string;
  buttonColorDisabled: string;
  buttonBorder: string;
  buttonShadow: string;
  backdropColor: string;
  closeButton: string;
  closeButtonHover: string;
  closeButtonBg: string;
  // Floating button surface (name retained for API compat with 1.1.x —
  // was glass in prior art; is a paper-card in editorial).
  glassBackground: string;
  glassBorder: string;
  glassColor: string;
  glassShadow: string;
  glassHoverShadow: string;
  // Input
  inputBackground: string;
  inputBackgroundFocus: string;
  inputBorder: string;
  inputBorderFocus: string;
  inputFocusRing: string;
  // Poll
  pollBorder: string;
  pollSelectedBorder: string;
  pollBackground: string;
  pollSelectedBackground: string;
  pollColor: string;
  pollSelectedColor: string;
  pollCheckBorder: string;
  pollCheckSelectedBorder: string;
  pollCheckSelectedBg: string;
}

export interface GotchaThemeTypography {
  fontFamily: string;
  // A dedicated display stack for the G glyph and modal headlines.
  // Editorial character that falls back cleanly to system serifs when
  // Fraunces isn't subset-embedded (1.2.0 ships with the stack only;
  // 1.2.1 will add the Fraunces woff2 inline).
  fontFamilyDisplay: string;
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

export interface GotchaThemeBorders {
  radius: {
    sm: number;
    md: number;
    lg: number;
    full: string;
  };
  width: number;
}

export interface GotchaThemeShadows {
  sm: string;
  md: string;
  lg: string;
  modal: string;
  button: string;
}

export interface GotchaThemeAnimation {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    default: string;
    spring: string;
  };
}

export interface GotchaThemeConfig {
  colors?: Partial<GotchaThemeColors>;
  typography?: Partial<GotchaThemeTypography>;
  borders?: Partial<GotchaThemeBorders>;
  shadows?: Partial<GotchaThemeShadows>;
  animation?: Partial<GotchaThemeAnimation>;
}

export interface ResolvedTheme {
  colors: GotchaThemeColors;
  typography: GotchaThemeTypography;
  borders: GotchaThemeBorders;
  shadows: GotchaThemeShadows;
  animation: GotchaThemeAnimation;
}

// ── NPS scale colours ────────────────────────────────────────
// Editorial discipline: uniform ink across the scale. Selected state is
// handled at the component layer (ink fill + paper text). No rainbow —
// the emotional valence is communicated by the user's choice of number,
// not by the colour. Customers who want the rainbow back override via
// themeConfig.colors.npsColors.
const NPS_INK_LIGHT = Array(11).fill('#1A1714');
const NPS_INK_DARK = Array(11).fill('#F2EEE6');

// ── Shared editorial values ──────────────────────────────────
const DISPLAY_STACK =
  "'Fraunces 144', 'Fraunces', Georgia, 'Iowan Old Style', Charter, 'Source Serif Pro', serif";
const BODY_STACK =
  "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// ── Light preset ─────────────────────────────────────────────
// Palette mirrors apps/web/app/globals.css exactly:
//   paper  #FAF8F4   ink     #1A1714
//   rule   #E8E3DA   muted   #6B6660
//   sienna #D4532A   sage    #6B8E6B   clay #B85A3F
export const LIGHT_TOKENS: ResolvedTheme = {
  colors: {
    // Primary action surface — editorial ink on paper.
    primary: '#1A1714',
    primaryHover: '#2A2622',
    primaryText: '#FAF8F4',

    // Canvas — flat paper, no gradient. Editorial cards live on a single
    // neutral; dimension comes from borders and shadows, not colour shifts.
    background: '#FAF8F4',
    backgroundGradient: '#FAF8F4',
    surface: '#FAF8F4',
    surfaceHover: '#F2EEE6',

    // Text ramp — ink for primary, muted for secondary. No pure black.
    text: '#1A1714',
    textSecondary: '#6B6660',
    textDisabled: '#A8A098',

    // Rule lines — the hairline that makes the editorial grid. One colour
    // for every divider, border, and row separator.
    border: '#E8E3DA',
    borderFocus: '#1A1714',

    // Affirm — sage. Used only for success state + bug-flag confirmation.
    success: '#6B8E6B',
    successSurface: 'rgba(107,142,107,0.08)',

    // Alert — clay. Used only for error left-edge + destructive remove.
    error: '#B85A3F',
    errorSurface: 'rgba(184,90,63,0.06)',
    errorBorder: 'rgba(184,90,63,0.18)',

    // "Warning" — mapped to sienna (the accent) so customers referencing
    // the warning token get the editorial-accent treatment for bug-flag
    // toggles, not a tech-yellow.
    warning: '#D4532A',
    warningActive: '#B8451F',
    warningSurface: 'rgba(212,83,42,0.06)',
    warningBorder: 'rgba(212,83,42,0.22)',

    // Stars — ink stroke and fill, no amber. Empty = muted hairline.
    starFilled: '#1A1714',
    starEmpty: '#C9C2B6',

    // Vote pills — ink only. The up/down semantics come from the icon
    // shape + the prompt copy, not from green/red colour cues.
    voteUp: '#1A1714',
    voteUpSurface: '#FAF8F4',
    voteUpBorder: '#E8E3DA',
    voteDown: '#1A1714',
    voteDownSurface: '#FAF8F4',
    voteDownBorder: '#E8E3DA',

    // NPS — uniform ink. Selected state filled at component layer.
    npsColors: NPS_INK_LIGHT,

    // Submit / primary button — ink.
    buttonBackground: '#1A1714',
    buttonBackgroundHover: '#2A2622',
    buttonBackgroundDisabled: '#E8E3DA',
    buttonColor: '#FAF8F4',
    buttonColorDisabled: '#A8A098',
    buttonBorder: 'none',
    buttonShadow: 'none',

    // Modal scrim — subtle ink wash, not a black overlay.
    backdropColor: 'rgba(26,23,20,0.32)',

    // Close control — muted stroke that darkens to ink on hover. No
    // filled background on rest; the hover gets a faint ink tint.
    closeButton: '#6B6660',
    closeButtonHover: '#1A1714',
    closeButtonBg: 'rgba(26,23,20,0.04)',

    // Floating G button — the paper card. No glass, no blur. The name is
    // preserved from the 1.1.x API for theme-override back-compat.
    // Open-state sienna ring + glyph is applied at the component layer
    // (see GotchaButton), not in tokens — it's a state, not a static
    // style.
    glassBackground: '#FAF8F4',
    glassBorder: '1px solid #E8E3DA',
    glassColor: '#1A1714',
    glassShadow:
      '0 1px 2px rgba(26,23,20,0.04), 0 12px 32px -8px rgba(26,23,20,0.12)',
    glassHoverShadow:
      '0 2px 4px rgba(26,23,20,0.06), 0 16px 40px -8px rgba(26,23,20,0.16)',

    // Text input — transparent surface, hairline border, ink focus ring
    // as a border darken (not a glow).
    inputBackground: 'transparent',
    inputBackgroundFocus: 'transparent',
    inputBorder: '#E8E3DA',
    inputBorderFocus: '#1A1714',
    inputFocusRing: 'transparent',

    // Poll — newspaper-column rows. Background paper; selected row gets
    // a 2px sienna left-edge applied at component layer.
    pollBorder: '#E8E3DA',
    pollSelectedBorder: '#D4532A',
    pollBackground: '#FAF8F4',
    pollSelectedBackground: '#FAF8F4',
    pollColor: '#1A1714',
    pollSelectedColor: '#1A1714',
    pollCheckBorder: '#C9C2B6',
    pollCheckSelectedBorder: '#1A1714',
    pollCheckSelectedBg: '#1A1714',
  },
  typography: {
    fontFamily: BODY_STACK,
    fontFamilyDisplay: DISPLAY_STACK,
    fontSize: { xs: 11, sm: 13, md: 15, lg: 17 },
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
  borders: {
    // Editorial radius scale — sharper than the slate aesthetic, closer
    // to a print card. sm for small chips, md for inputs, lg for modal.
    radius: { sm: 6, md: 10, lg: 14, full: '999px' },
    width: 1,
  },
  shadows: {
    // Softer, more directional shadow scale. Light comes from the top.
    sm: '0 1px 2px rgba(26,23,20,0.04)',
    md: '0 2px 4px rgba(26,23,20,0.06), 0 8px 20px -6px rgba(26,23,20,0.08)',
    lg: '0 2px 4px rgba(26,23,20,0.06), 0 16px 40px -8px rgba(26,23,20,0.12)',
    modal:
      '0 2px 4px rgba(26,23,20,0.06), 0 24px 64px -12px rgba(26,23,20,0.18)',
    button:
      '0 1px 2px rgba(26,23,20,0.04), 0 12px 32px -8px rgba(26,23,20,0.12)',
  },
  animation: {
    // 240ms page-turn language from the dashboard. `default` is the
    // workhorse; `spring` is aliased to the same value so legacy code
    // paths still read as editorial rather than bouncy.
    duration: { fast: '0.18s', normal: '0.24s', slow: '0.32s' },
    easing: {
      default: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      spring: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    },
  },
};

// ── Dark preset ──────────────────────────────────────────────
// Not pure black — a warm near-black ink with ivory paper. Canvas (the
// page / G button's host surface) sits at #141210; the modal lifts to
// #1A1714 so the shadow has something to separate against. Without the
// 6% step the card reads pasted-on.
//
// Contrast notes:
//   - textSecondary #9A928A on #1A1714 = 4.76:1 (AA body, AA 10px ucase).
//   - sienna #DC6340 tuned to preserve hue relationship with light
//     #D4532A (not a hot-orange drift).
//   - starEmpty raised to #4A433A so unrated stars remain perceptible.
export const DARK_TOKENS: ResolvedTheme = {
  colors: {
    primary: '#F2EEE6',
    primaryHover: '#FAF8F4',
    primaryText: '#141210',

    // Modal surface — one step lighter than the body so the card lifts.
    background: '#1A1714',
    backgroundGradient: '#1A1714',
    surface: '#1A1714',
    surfaceHover: '#221E1A',

    text: '#F2EEE6',
    textSecondary: '#9A928A',
    textDisabled: '#5A5449',

    border: '#2A2622',
    borderFocus: '#F2EEE6',

    success: '#8FAE8F',
    successSurface: 'rgba(143,174,143,0.1)',

    error: '#D17560',
    errorSurface: 'rgba(209,117,96,0.06)',
    errorBorder: 'rgba(209,117,96,0.22)',

    // Sienna in dark — same hue family as light #D4532A, pushed just
    // enough brighter to hold on dark ink without drifting toward orange.
    warning: '#DC6340',
    warningActive: '#E8704A',
    warningSurface: 'rgba(220,99,64,0.08)',
    warningBorder: 'rgba(220,99,64,0.28)',

    starFilled: '#F2EEE6',
    starEmpty: '#4A433A',

    voteUp: '#F2EEE6',
    voteUpSurface: '#1A1714',
    voteUpBorder: '#2A2622',
    voteDown: '#F2EEE6',
    voteDownSurface: '#1A1714',
    voteDownBorder: '#2A2622',

    npsColors: NPS_INK_DARK,

    buttonBackground: '#F2EEE6',
    buttonBackgroundHover: '#FAF8F4',
    buttonBackgroundDisabled: '#2A2622',
    buttonColor: '#141210',
    buttonColorDisabled: '#5A5449',
    buttonBorder: 'none',
    buttonShadow: 'none',

    backdropColor: 'rgba(0,0,0,0.52)',

    closeButton: '#9A928A',
    closeButtonHover: '#F2EEE6',
    closeButtonBg: 'rgba(242,238,230,0.06)',

    // Floating G button — lifted one step above the canvas tone (#141210
    // → #1A1714) so the card reads as a floating object on any dark host.
    // Prior iteration sat at canvas which made the button disappear into
    // typical dark-mode customer sites (which also use #141210-ish
    // backgrounds). 6% lift is enough to separate without becoming a
    // loud chrome element. Open-state sienna ring + glyph applied at
    // component layer.
    glassBackground: '#1A1714',
    glassBorder: '1px solid #2A2622',
    glassColor: '#F2EEE6',
    glassShadow:
      '0 2px 4px rgba(0,0,0,0.4), 0 16px 40px -8px rgba(0,0,0,0.5)',
    glassHoverShadow:
      '0 4px 8px rgba(0,0,0,0.45), 0 20px 48px -8px rgba(0,0,0,0.55)',

    inputBackground: 'transparent',
    inputBackgroundFocus: 'transparent',
    inputBorder: '#2A2622',
    inputBorderFocus: '#F2EEE6',
    inputFocusRing: 'transparent',

    pollBorder: '#2A2622',
    pollSelectedBorder: '#DC6340',
    pollBackground: '#1A1714',
    pollSelectedBackground: '#1A1714',
    pollColor: '#F2EEE6',
    pollSelectedColor: '#F2EEE6',
    pollCheckBorder: '#3A342E',
    pollCheckSelectedBorder: '#F2EEE6',
    pollCheckSelectedBg: '#F2EEE6',
  },
  typography: {
    fontFamily: BODY_STACK,
    fontFamilyDisplay: DISPLAY_STACK,
    fontSize: { xs: 11, sm: 13, md: 15, lg: 17 },
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
  borders: {
    radius: { sm: 6, md: 10, lg: 14, full: '999px' },
    width: 1,
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.3)',
    md: '0 2px 4px rgba(0,0,0,0.35), 0 8px 20px -6px rgba(0,0,0,0.4)',
    lg: '0 2px 4px rgba(0,0,0,0.4), 0 16px 40px -8px rgba(0,0,0,0.5)',
    modal: '0 2px 4px rgba(0,0,0,0.4), 0 24px 64px -12px rgba(0,0,0,0.6)',
    button: '0 1px 2px rgba(0,0,0,0.3), 0 12px 32px -8px rgba(0,0,0,0.45)',
  },
  animation: {
    duration: { fast: '0.18s', normal: '0.24s', slow: '0.32s' },
    easing: {
      default: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      spring: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    },
  },
};

// ── Helper ───────────────────────────────────────────────────

import { deepMerge } from '../utils/deepMerge';

/** Create a custom theme by merging partial overrides onto a preset */
export function createTheme(
  base: 'light' | 'dark',
  overrides: GotchaThemeConfig
): GotchaThemeConfig {
  const preset = base === 'dark' ? DARK_TOKENS : LIGHT_TOKENS;
  return deepMerge(preset, overrides) as GotchaThemeConfig;
}
