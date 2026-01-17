// ============================================
// RESPONSE MODES
// ============================================

export type ResponseMode = 'feedback' | 'vote' | 'poll' | 'feature-request' | 'ab';

export type VoteType = 'up' | 'down';

// ============================================
// USER TYPES
// ============================================

export interface GotchaUser {
  id?: string; // Optional - SDK generates anonymous ID if not provided
  [key: string]: string | number | boolean | null | undefined;
}

// ============================================
// COMPONENT PROPS
// ============================================

export type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';

export type Size = 'sm' | 'md' | 'lg';

export type Theme = 'light' | 'dark' | 'auto' | 'custom';

export type TouchBehavior = 'always-visible' | 'tap-to-reveal';

export interface GotchaStyles {
  button?: React.CSSProperties;
  modal?: React.CSSProperties;
  input?: React.CSSProperties;
  submitButton?: React.CSSProperties;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface SubmitResponsePayload {
  elementId: string;
  mode: ResponseMode;
  content?: string;
  title?: string;
  rating?: number;
  vote?: VoteType;
  pollOptions?: string[];
  pollSelected?: string[];
  experimentId?: string;
  variant?: string;
  user?: GotchaUser;
  context?: {
    url?: string;
    userAgent?: string;
  };
}

export interface GotchaResponse {
  id: string;
  status: 'created' | 'duplicate';
  createdAt: string;
  results?: PollResults;
}

export interface PollResults {
  [option: string]: number;
}

export interface GotchaError {
  code: ErrorCode;
  message: string;
  status: number;
}

export type ErrorCode =
  | 'INVALID_API_KEY'
  | 'ORIGIN_NOT_ALLOWED'
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'INVALID_REQUEST'
  | 'USER_NOT_FOUND'
  | 'INTERNAL_ERROR';
