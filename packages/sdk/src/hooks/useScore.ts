import { useState, useEffect } from 'react';
import { useGotchaContext } from '../components/GotchaProvider';
import { ScoreData } from '../types';

interface UseScoreOptions {
  elementId: string;
  refreshInterval?: number;
}

interface UseScoreResult {
  score: ScoreData | null;
  isLoading: boolean;
  error: string | null;
}

export function useScore({ elementId, refreshInterval }: UseScoreOptions): UseScoreResult {
  const { client } = useGotchaContext();
  const [score, setScore] = useState<ScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchScore = async () => {
      try {
        const data = await client.getScore(elementId);
        if (!cancelled) {
          setScore(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load score');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchScore();

    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (refreshInterval && refreshInterval > 0) {
      intervalId = setInterval(fetchScore, refreshInterval);
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [client, elementId, refreshInterval]);

  return { score, isLoading, error };
}
