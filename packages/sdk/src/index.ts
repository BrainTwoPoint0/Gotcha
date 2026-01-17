// Components
export { GotchaProvider } from './components/GotchaProvider';
export { Gotcha } from './components/Gotcha';

// Hooks
export { useGotcha } from './hooks/useGotcha';

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
} from './types';

// Props type
export type { GotchaProps } from './components/Gotcha';
export type { GotchaProviderProps } from './components/GotchaProvider';
