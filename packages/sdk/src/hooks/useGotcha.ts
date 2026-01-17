import { useGotchaContext } from '../components/GotchaProvider';

/**
 * Hook to access Gotcha context
 * Must be used within a GotchaProvider
 */
export function useGotcha() {
  const { client, disabled, defaultUser, debug } = useGotchaContext();

  return {
    /** The API client for manual submissions */
    client,
    /** Whether Gotcha is globally disabled */
    disabled,
    /** Default user metadata */
    defaultUser,
    /** Whether debug mode is enabled */
    debug,
    /** Submit feedback programmatically */
    submitFeedback: client.submitResponse.bind(client),
  };
}
