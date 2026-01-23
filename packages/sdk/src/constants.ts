// API URL
export const API_BASE_URL = 'https://gotcha.cx/api/v1';

// Error codes
export const ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  ORIGIN_NOT_ALLOWED: 'ORIGIN_NOT_ALLOWED',
  RATE_LIMITED: 'RATE_LIMITED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  ANONYMOUS_ID: 'gotcha_anonymous_id',
  OFFLINE_QUEUE: 'gotcha_offline_queue',
} as const;

// Default values
export const DEFAULTS = {
  POSITION: 'top-right' as const,
  SIZE: 'md' as const,
  THEME: 'light' as const,
  SHOW_ON_HOVER: true,
  TOUCH_BEHAVIOR: 'always-visible' as const,
  SUBMIT_TEXT: 'Submit',
  THANK_YOU_MESSAGE: 'Thanks for your feedback!',
} as const;

// Size mappings (desktop/mobile in pixels)
export const SIZE_MAP = {
  sm: { desktop: 24, mobile: 44 },
  md: { desktop: 32, mobile: 44 },
  lg: { desktop: 40, mobile: 48 },
} as const;

// Retry config
export const RETRY_CONFIG = {
  MAX_RETRIES: 2,
  BASE_DELAY_MS: 500,
  MAX_DELAY_MS: 5000,
} as const;
