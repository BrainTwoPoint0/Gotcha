import { useState, useCallback } from 'react';
import { useGotchaContext } from '../components/GotchaProvider';
import { ResponseMode, GotchaUser, GotchaResponse, VoteType } from '../types';

interface UseSubmitOptions {
  elementId: string;
  mode: ResponseMode;
  experimentId?: string;
  variant?: string;
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
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (data: SubmitData) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.submitResponse({
          elementId: options.elementId,
          mode: options.mode,
          content: data.content,
          title: data.title,
          rating: data.rating,
          vote: data.vote,
          pollOptions: options.pollOptions,
          pollSelected: data.pollSelected,
          experimentId: options.experimentId,
          variant: options.variant,
          user: { ...defaultUser, ...options.user },
        });

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
    [client, defaultUser, options]
  );

  return {
    submit,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
