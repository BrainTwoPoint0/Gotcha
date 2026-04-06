import { SubmissionContext } from '../types';
import { getRecentErrors } from './errorBuffer';

export function collectContext(): SubmissionContext {
  if (typeof window === 'undefined') return {};

  return {
    url: window.location.origin + window.location.pathname,
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: { width: screen.width, height: screen.height },
    recentErrors: getRecentErrors(),
  };
}
