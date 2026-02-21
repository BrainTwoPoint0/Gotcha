import { useState, useCallback, useEffect } from 'react';
import { useGotchaContext } from '../components/GotchaProvider';
import { ResponseMode, GotchaUser, GotchaResponse, VoteType, ExistingResponse } from '../types';

interface UseSubmitOptions {
  elementId: string;
  mode: ResponseMode;
  pollOptions?: string[];
  user?: GotchaUser;
  onSuccess?: (response: GotchaResponse) => void;
  onError?: (error: Error) => void;
}

interface SubmitData {
  content?: string;
  title?: string;
  rating?: number;
  vote?: VoteType;
  pollSelected?: string[];
}

export function useSubmit(options: UseSubmitOptions) {
  const { client, defaultUser } = useGotchaContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingResponse, setExistingResponse] = useState<ExistingResponse | null>(null);

  // Check for existing response when user ID is provided
  useEffect(() => {
    const userId = options.user?.id || defaultUser?.id;
    if (!userId) {
      setExistingResponse(null);
      return;
    }

    let cancelled = false;

    const checkExisting = async () => {
      setIsCheckingExisting(true);
      try {
        const existing = await client.checkExistingResponse(options.elementId, userId);
        if (!cancelled) {
          setExistingResponse(existing);
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
  }, [client, options.elementId, options.user?.id, defaultUser?.id]);

  const submit = useCallback(
    async (data: SubmitData) => {
      setIsLoading(true);
      setError(null);

      try {
        const userId = options.user?.id || defaultUser?.id;
        let response: GotchaResponse;

        // If we have an existing response and a user ID, update instead of create
        if (existingResponse && userId) {
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
            user: { ...defaultUser, ...options.user },
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
