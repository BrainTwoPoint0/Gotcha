const MAX_ERRORS = 10;
const MAX_MESSAGE_LENGTH = 200;

interface CapturedError {
  message: string;
  source?: string;
  timestamp: number;
}

let buffer: CapturedError[] = [];
let listening = false;

function pushError(message: string, source?: string) {
  const entry: CapturedError = {
    message: message.slice(0, MAX_MESSAGE_LENGTH),
    source: source?.slice(0, MAX_MESSAGE_LENGTH),
    timestamp: Date.now(),
  };
  buffer.push(entry);
  if (buffer.length > MAX_ERRORS) {
    buffer.shift();
  }
}

function handleError(event: ErrorEvent) {
  pushError(event.message, event.filename);
}

function handleRejection(event: PromiseRejectionEvent) {
  const message = event.reason instanceof Error
    ? event.reason.message
    : String(event.reason);
  pushError(message);
}

export function startErrorCapture(): void {
  if (typeof window === 'undefined' || listening) return;
  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleRejection);
  listening = true;
}

export function stopErrorCapture(): void {
  if (typeof window === 'undefined' || !listening) return;
  window.removeEventListener('error', handleError);
  window.removeEventListener('unhandledrejection', handleRejection);
  listening = false;
}

export function getRecentErrors(): CapturedError[] {
  return [...buffer].reverse();
}
