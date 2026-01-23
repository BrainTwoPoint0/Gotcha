import { API_BASE_URL, RETRY_CONFIG } from '../constants';
import { SubmitResponsePayload, GotchaResponse, GotchaError, ExistingResponse, VoteType } from '../types';
import { getAnonymousId } from '../utils/anonymous';

interface ApiClientConfig {
  apiKey: string;
  baseUrl?: string;
  debug?: boolean;
}

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: RETRY_CONFIG.MAX_RETRIES,
  baseDelayMs: RETRY_CONFIG.BASE_DELAY_MS,
  maxDelayMs: RETRY_CONFIG.MAX_DELAY_MS,
};

/**
 * Fetch with automatic retry and exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  debug: boolean = false
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      if (debug && attempt > 0) {
        console.log(`[Gotcha] Retry attempt ${attempt}/${config.maxRetries}`);
      }

      const response = await fetch(url, options);

      // Don't retry client errors (4xx) except 429 (rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      // Success - return immediately
      if (response.ok) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      // Network error - retry
      lastError = error as Error;
      if (debug) {
        console.log(`[Gotcha] Network error: ${lastError.message}`);
      }
    }

    // Don't delay after last attempt
    if (attempt < config.maxRetries) {
      const delay = Math.min(
        config.baseDelayMs * Math.pow(2, attempt),
        config.maxDelayMs
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function createApiClient(config: ApiClientConfig) {
  const { apiKey, baseUrl = API_BASE_URL, debug = false } = config;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  async function request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${baseUrl}${endpoint}`;
    const idempotencyKey = crypto.randomUUID();

    if (debug) {
      console.log(`[Gotcha] ${method} ${endpoint}`, body);
    }

    const response = await fetchWithRetry(
      url,
      {
        method,
        headers: {
          ...headers,
          'Idempotency-Key': idempotencyKey,
        },
        body: body ? JSON.stringify(body) : undefined,
      },
      DEFAULT_RETRY_CONFIG,
      debug
    );

    const data = await response.json();

    if (!response.ok) {
      const error = data.error as GotchaError;
      if (debug) {
        console.error(`[Gotcha] Error: ${error.code} - ${error.message}`);
      }
      throw error;
    }

    if (debug) {
      console.log(`[Gotcha] Response:`, data);
    }

    return data as T;
  }

  return {
    /**
     * Submit a response (feedback, vote, etc.)
     */
    async submitResponse(
      payload: Omit<SubmitResponsePayload, 'context'>
    ): Promise<GotchaResponse> {
      // Ensure user has an ID (anonymous if not provided)
      const user = payload.user || {};
      if (!user.id) {
        user.id = getAnonymousId();
      }

      const fullPayload: SubmitResponsePayload = {
        ...payload,
        user,
        context: {
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        },
      };

      return request<GotchaResponse>('POST', '/responses', fullPayload);
    },

    /**
     * Check if a user has an existing response for an element
     */
    async checkExistingResponse(
      elementId: string,
      userId: string
    ): Promise<ExistingResponse | null> {
      const url = `${baseUrl}/responses/check?elementId=${encodeURIComponent(elementId)}&userId=${encodeURIComponent(userId)}`;

      if (debug) {
        console.log(`[Gotcha] GET /responses/check`);
      }

      const response = await fetchWithRetry(
        url,
        {
          method: 'GET',
          headers,
        },
        DEFAULT_RETRY_CONFIG,
        debug
      );

      const data = await response.json();

      if (!response.ok) {
        const error = data.error as GotchaError;
        if (debug) {
          console.error(`[Gotcha] Error: ${error.code} - ${error.message}`);
        }
        throw error;
      }

      if (data.exists) {
        if (debug) {
          console.log(`[Gotcha] Found existing response:`, data.response);
        }
        return data.response as ExistingResponse;
      }

      return null;
    },

    /**
     * Update an existing response
     */
    async updateResponse(
      id: string,
      payload: {
        content?: string;
        title?: string;
        rating?: number;
        vote?: VoteType;
        pollSelected?: string[];
      },
      userId?: string
    ): Promise<GotchaResponse> {
      const url = `${baseUrl}/responses/${id}${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`;

      if (debug) {
        console.log(`[Gotcha] PATCH /responses/${id}`, payload);
      }

      const response = await fetchWithRetry(
        url,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
        },
        DEFAULT_RETRY_CONFIG,
        debug
      );

      const data = await response.json();

      if (!response.ok) {
        const error = data.error as GotchaError;
        if (debug) {
          console.error(`[Gotcha] Error: ${error.code} - ${error.message}`);
        }
        throw error;
      }

      if (debug) {
        console.log(`[Gotcha] Response updated:`, data);
      }

      return data as GotchaResponse;
    },

    /**
     * Get the base URL (for debugging)
     */
    getBaseUrl(): string {
      return baseUrl;
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
