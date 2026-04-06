import { useState, useCallback, useEffect } from 'react';
import { useGotchaContext } from '../components/GotchaProvider';
import { ResponseMode, GotchaUser, GotchaResponse, VoteType, ExistingResponse } from '../types';

interface UseSubmitOptions {
  elementId: string;
  mode: ResponseMode;
  pollOptions?: string[];
  user?: GotchaUser;
  onePerUser?: boolean;
  /** When onePerUser is true, allow a new submission after this many days */
  cooldownDays?: number;
  onSuccess?: (response: GotchaResponse) => void;
  onError?: (error: Error) => void;
}

interface SubmitData {
  content?: string;
  title?: string;
  rating?: number;
  vote?: VoteType;
  pollSelected?: string[];
  isBug?: boolean;
  screenshot?: string;
}

function isResponseExpired(createdAt: string, cooldownDays: number): boolean {
  const createdTime = new Date(createdAt).getTime();
  if (isNaN(createdTime)) return true;
  const ageMs = Date.now() - createdTime;
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
  return ageMs >= cooldownMs;
}

export function useSubmit(options: UseSubmitOptions) {
  const { client, defaultUser } = useGotchaContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingResponse, setExistingResponse] = useState<ExistingResponse | null>(null);

  // Check for existing response when user ID is provided and onePerUser is enabled
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && options.cooldownDays && !options.onePerUser) {
      console.warn('[Gotcha] cooldownDays has no effect without onePerUser=true');
    }

    const userId = options.user?.id || defaultUser?.id;
    if (!userId || !options.onePerUser) {
      setExistingResponse(null);
      return;
    }

    let cancelled = false;

    const checkExisting = async () => {
      setIsCheckingExisting(true);
      try {
        const existing = await client.checkExistingResponse(options.elementId, userId);
        if (!cancelled) {
          if (existing && options.cooldownDays && options.cooldownDays > 0 &&
              isResponseExpired(existing.createdAt, options.cooldownDays)) {
            setExistingResponse(null);
          } else {
            setExistingResponse(existing);
          }
        }
      } catch {
        // Ignore errors - just means no existing response found
        if (!cancelled) {
          setExistingResponse(null);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingExisting(false);
        }
      }
    };

    checkExisting();

    return () => {
      cancelled = true;
    };
  }, [client, options.elementId, options.user?.id, defaultUser?.id, options.onePerUser, options.cooldownDays]);

  const submit = useCallback(
    async (data: SubmitData) => {
      setIsLoading(true);
      setError(null);

      try {
        const userId = options.user?.id || defaultUser?.id;
        let response: GotchaResponse;

        // If onePerUser is enabled and we have an existing response, update instead of create
        if (options.onePerUser && existingResponse && userId) {
          response = await client.updateResponse(
            existingResponse.id,
            {
              content: data.content,
              title: data.title,
              rating: data.rating,
              vote: data.vote,
              pollSelected: data.pollSelected,
            },
            userId
          );
        } else {
          response = await client.submitResponse({
            elementId: options.elementId,
            mode: options.mode,
            content: data.content,
            title: data.title,
            rating: data.rating,
            vote: data.vote,
            pollOptions: options.pollOptions,
            pollSelected: data.pollSelected,
            isBug: data.isBug,
            screenshot: data.screenshot,
            user: { ...defaultUser, ...options.user },
          });
        }

        // Update existingResponse so isEditing flips to true after first submit (only for onePerUser)
        if (options.onePerUser) {
          setExistingResponse({
            id: response.id,
            mode: options.mode,
            content: data.content ?? null,
            title: data.title ?? null,
            rating: data.rating ?? null,
            vote: data.vote ?? null,
            pollSelected: data.pollSelected ?? null,
            createdAt: response.createdAt,
          });
        }

        options.onSuccess?.(response);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
        setError(errorMessage);
        options.onError?.(err instanceof Error ? err : new Error(errorMessage));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client, defaultUser, options, existingResponse]
  );

  return {
    submit,
    isLoading,
    isCheckingExisting,
    error,
    existingResponse,
    isEditing: !!existingResponse,
    clearError: () => setError(null),
  };
}
