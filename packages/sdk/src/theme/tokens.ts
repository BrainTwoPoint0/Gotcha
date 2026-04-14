// ============================================
// THEME TOKEN SYSTEM
// ============================================

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
  // Glass button
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

// ── NPS score colors ─────────────────────────────────────────
const NPS_COLORS = [
  '#ef4444', '#f05540', '#f1663c', '#f27738', '#f38834',
  '#f59e0b', '#d4a30e', '#b3a812', '#79b841', '#45c870', '#10b981',
];

// ── Light preset ─────────────────────────────────────────────
export const LIGHT_TOKENS: ResolvedTheme = {
  colors: {
    primary: '#1e293b',
    primaryHover: '#334155',
    primaryText: '#ffffff',
    background: '#ffffff',
    backgroundGradient: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    surface: '#fafbfc',
    surfaceHover: '#ffffff',
    text: '#111827',
    textSecondary: '#374151',
    textDisabled: '#94a3b8',
    border: '#e2e8f0',
    borderFocus: '#1e293b',
    success: '#059669',
    successSurface: 'rgba(5,150,105,0.08)',
    error: '#dc2626',
    errorSurface: '#fef2f2',
    errorBorder: 'rgba(220,38,38,0.1)',
    warning: '#d97706',
    warningActive: '#b45309',
    warningSurface: 'rgba(251,191,36,0.08)',
    warningBorder: 'rgba(217,119,6,0.25)',
    starFilled: '#f59e0b',
    starEmpty: '#e2e8f0',
    voteUp: '#10b981',
    voteUpSurface: 'rgba(16,185,129,0.06)',
    voteUpBorder: 'rgba(16,185,129,0.25)',
    voteDown: '#ef4444',
    voteDownSurface: 'rgba(239,68,68,0.06)',
    voteDownBorder: 'rgba(239,68,68,0.25)',
    npsColors: NPS_COLORS,
    buttonBackground: '#1e293b',
    buttonBackgroundHover: '#334155',
    buttonBackgroundDisabled: '#e2e8f0',
    buttonColor: '#ffffff',
    buttonColorDisabled: '#94a3b8',
    buttonBorder: 'none',
    buttonShadow: 'none',
    backdropColor: 'rgba(0,0,0,0.4)',
    closeButton: '#9ca3af',
    closeButtonHover: '#6b7280',
    closeButtonBg: 'rgba(0,0,0,0.04)',
    glassBackground: 'linear-gradient(160deg, rgba(255,255,255,0.7) 0%, rgba(200,210,230,0.4) 40%, rgba(180,192,220,0.5) 100%)',
    glassBorder: 'none',
    glassColor: 'rgba(0,0,0,0.75)',
    glassShadow: '0 3px 12px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.2)',
    glassHoverShadow: '0 6px 20px rgba(0,0,0,0.18), 0 0 1px rgba(0,0,0,0.25)',
    inputBackground: '#fafbfc',
    inputBackgroundFocus: '#ffffff',
    inputBorder: '#e2e8f0',
    inputBorderFocus: '#1e293b',
    inputFocusRing: 'rgba(30,41,59,0.15)',
    pollBorder: '#e2e8f0',
    pollSelectedBorder: 'rgba(30,41,59,0.25)',
    pollBackground: '#fafbfc',
    pollSelectedBackground: 'rgba(30,41,59,0.05)',
    pollColor: '#374151',
    pollSelectedColor: '#1e293b',
    pollCheckBorder: '#cbd5e1',
    pollCheckSelectedBorder: '#1e293b',
    pollCheckSelectedBg: '#1e293b',
  },
  typography: {
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: { xs: 11, sm: 13, md: 14, lg: 16 },
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
  borders: {
    radius: { sm: 8, md: 10, lg: 14, full: '50%' },
    width: 1,
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 4px 12px rgba(0,0,0,0.06)',
    lg: '0 12px 32px rgba(0,0,0,0.06)',
    modal: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.04)',
    button: '0 2px 8px rgba(0,0,0,0.06)',
  },
  animation: {
    duration: { fast: '0.15s', normal: '0.25s', slow: '0.4s' },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },
};

// ── Dark preset ──────────────────────────────────────────────
export const DARK_TOKENS: ResolvedTheme = {
  colors: {
    primary: '#e2e8f0',
    primaryHover: '#cbd5e1',
    primaryText: '#1e293b',
    background: '#1a1f2e',
    backgroundGradient: 'linear-gradient(180deg, #1a1f2e 0%, #151925 100%)',
    surface: 'rgba(55,65,81,0.5)',
    surfaceHover: 'rgba(55,65,81,0.7)',
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    textDisabled: '#6b7280',
    border: 'rgba(255,255,255,0.08)',
    borderFocus: 'rgba(255,255,255,0.2)',
    success: '#10b981',
    successSurface: 'rgba(16,185,129,0.1)',
    error: '#fecaca',
    errorSurface: 'rgba(127,29,29,0.3)',
    errorBorder: 'rgba(254,202,202,0.1)',
    warning: '#fbbf24',
    warningActive: '#fbbf24',
    warningSurface: 'rgba(245,158,11,0.08)',
    warningBorder: 'rgba(245,158,11,0.3)',
    starFilled: '#f59e0b',
    starEmpty: 'rgba(255,255,255,0.12)',
    voteUp: '#10b981',
    voteUpSurface: 'rgba(16,185,129,0.08)',
    voteUpBorder: 'rgba(16,185,129,0.3)',
    voteDown: '#ef4444',
    voteDownSurface: 'rgba(239,68,68,0.08)',
    voteDownBorder: 'rgba(239,68,68,0.3)',
    npsColors: NPS_COLORS,
    buttonBackground: '#e2e8f0',
    buttonBackgroundHover: '#cbd5e1',
    buttonBackgroundDisabled: '#374151',
    buttonColor: '#1e293b',
    buttonColorDisabled: '#6b7280',
    buttonBorder: 'none',
    buttonShadow: 'none',
    backdropColor: 'rgba(0,0,0,0.5)',
    closeButton: '#6b7280',
    closeButtonHover: '#9ca3af',
    closeButtonBg: 'rgba(255,255,255,0.06)',
    glassBackground: 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 60%, rgba(0,0,0,0.05) 100%)',
    glassBorder: '1px solid rgba(255,255,255,0.15)',
    glassColor: 'rgba(255,255,255,0.88)',
    glassShadow: '0 4px 14px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.35)',
    glassHoverShadow: '0 8px 24px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.4)',
    inputBackground: 'rgba(55,65,81,0.5)',
    inputBackgroundFocus: 'rgba(55,65,81,0.7)',
    inputBorder: 'rgba(255,255,255,0.08)',
    inputBorderFocus: 'rgba(255,255,255,0.2)',
    inputFocusRing: 'rgba(255,255,255,0.06)',
    pollBorder: 'rgba(255,255,255,0.08)',
    pollSelectedBorder: 'rgba(226,232,240,0.25)',
    pollBackground: 'rgba(55,65,81,0.5)',
    pollSelectedBackground: 'rgba(226,232,240,0.08)',
    pollColor: '#d1d5db',
    pollSelectedColor: '#e2e8f0',
    pollCheckBorder: 'rgba(255,255,255,0.2)',
    pollCheckSelectedBorder: '#e2e8f0',
    pollCheckSelectedBg: '#e2e8f0',
  },
  typography: {
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: { xs: 11, sm: 13, md: 14, lg: 16 },
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
  borders: {
    radius: { sm: 8, md: 10, lg: 14, full: '50%' },
    width: 1,
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.2)',
    md: '0 4px 12px rgba(0,0,0,0.3)',
    lg: '0 12px 32px rgba(0,0,0,0.2)',
    modal: '0 1px 2px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.3), 0 12px 32px rgba(0,0,0,0.2), 0 24px 48px rgba(0,0,0,0.15)',
    button: '0 2px 8px rgba(0,0,0,0.15)',
  },
  animation: {
    duration: { fast: '0.15s', normal: '0.25s', slow: '0.4s' },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },
};

// ── Helper ───────────────────────────────────────────────────

import { deepMerge } from '../utils/deepMerge';

/** Create a custom theme by merging partial overrides onto a preset */
export function createTheme(
  base: 'light' | 'dark',
  overrides: GotchaThemeConfig,
): GotchaThemeConfig {
  const preset = base === 'dark' ? DARK_TOKENS : LIGHT_TOKENS;
  return deepMerge(preset, overrides) as GotchaThemeConfig;
}
