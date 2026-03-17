// Components
export { GotchaProvider } from './components/GotchaProvider';
export { Gotcha } from './components/Gotcha';
export { GotchaScore } from './components/GotchaScore';

// Hooks
export { useGotcha } from './hooks/useGotcha';

// Theme
export { createTheme } from './theme/tokens';

// Types (re-export from local)
export type {
  ResponseMode,
  VoteType,
  GotchaUser,
  Position,
  Size,
  Theme,
  TouchBehavior,
  GotchaStyles,
  GotchaResponse,
  GotchaError,
  ScoreData,
} from './types';

export type { GotchaThemeConfig } from './theme/tokens';

// Props type
export type { GotchaProps } from './components/Gotcha';
export type { GotchaProviderProps } from './components/GotchaProvider';
export type { GotchaScoreProps } from './components/GotchaScore';
