// ============================================
// RESPONSE MODES
// ============================================

export type ResponseMode = 'feedback' | 'vote' | 'poll' | 'nps';

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
  title?: React.CSSProperties;
  closeButton?: React.CSSProperties;
  starRating?: React.CSSProperties;
  star?: React.CSSProperties;
  voteButton?: React.CSSProperties;
  voteButtonSelected?: React.CSSProperties;
  pollOption?: React.CSSProperties;
  pollOptionSelected?: React.CSSProperties;
  npsButton?: React.CSSProperties;
  npsButtonSelected?: React.CSSProperties;
  npsLabels?: React.CSSProperties;
  successMessage?: React.CSSProperties;
  successIcon?: React.CSSProperties;
  errorMessage?: React.CSSProperties;
  bugFlag?: React.CSSProperties;
  backdrop?: React.CSSProperties;
  spinner?: React.CSSProperties;
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
  isBug?: boolean;
  user?: GotchaUser;
  context?: {
    url?: string;
    userAgent?: string;
  };
}

export interface GotchaResponse {
  id: string;
  status: 'created' | 'duplicate' | 'updated';
  createdAt: string;
  results?: PollResults;
}

export interface ExistingResponse {
  id: string;
  mode: ResponseMode;
  content?: string | null;
  title?: string | null;
  rating?: number | null;
  vote?: VoteType | null;
  pollOptions?: string[] | null;
  pollSelected?: string[] | null;
  createdAt: string;
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
  | 'INTERNAL_ERROR'
  | 'PARSE_ERROR';

// ============================================
// SCORE DATA
// ============================================

export interface ScoreData {
  elementId: string;
  averageRating: number | null;
  totalResponses: number;
  ratingCount: number;
  voteCount: { up: number; down: number };
  positiveRate: number | null;
  npsScore: number | null;
}
