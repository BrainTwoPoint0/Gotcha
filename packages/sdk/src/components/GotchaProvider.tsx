import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import { createApiClient, ApiClient } from "../api/client";
import { GotchaUser } from "../types";
import { GotchaThemeConfig } from "../theme/tokens";
import { resolveTheme } from "../theme/resolveTheme";
import { injectStyles } from "../theme/styles";
import { startErrorCapture, stopErrorCapture } from "../utils/errorBuffer";

export interface GotchaProviderProps {
  /** Your Gotcha API key */
  apiKey: string;
  /** React children */
  children: React.ReactNode;
  /** Override the API base URL (for testing/staging) */
  baseUrl?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Disable all Gotcha buttons globally */
  disabled?: boolean;
  /** Default user metadata applied to all submissions */
  defaultUser?: GotchaUser;
  /**
   * Default submitter email applied to all <Gotcha /> instances under this
   * provider. Per-instance `userEmail` prop wins when both are set. Used
   * by the dashboard to send "we shipped what you asked for" notify-back.
   */
  defaultUserEmail?: string;
  /** Theme configuration overrides applied to all instances */
  themeConfig?: GotchaThemeConfig;
}

export interface GotchaContextValue {
  client: ApiClient;
  disabled: boolean;
  defaultUser: GotchaUser;
  defaultUserEmail?: string;
  debug: boolean;
  // Modal management - only one open at a time
  activeModalId: string | null;
  openModal: (elementId: string) => void;
  closeModal: () => void;
  // Theme
  themeConfig?: GotchaThemeConfig;
}

const GotchaContext = createContext<GotchaContextValue | null>(null);

const EMPTY_USER: GotchaUser = {};

export function GotchaProvider({
  apiKey,
  children,
  baseUrl,
  debug = false,
  disabled = false,
  defaultUser,
  defaultUserEmail,
  themeConfig,
}: GotchaProviderProps) {
  const [activeModalId, setActiveModalId] = useState<string | null>(null);

  if (
    baseUrl &&
    !baseUrl.startsWith("https://") &&
    !baseUrl.startsWith("/") &&
    !baseUrl.includes("localhost")
  ) {
    console.warn("[Gotcha] baseUrl should use HTTPS in production:", baseUrl);
  }

  const client = useMemo(
    () => createApiClient({ apiKey, baseUrl, debug }),
    [apiKey, baseUrl, debug],
  );

  // Stabilize defaultUser reference
  const stableDefaultUser = useMemo(
    () => defaultUser ?? EMPTY_USER,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(defaultUser)],
  );

  // Inject styles on mount. The embedded Fraunces @font-face is part of the
  // stylesheet produced by generateStyleTag(), so the branded serif is
  // available for both the "G" button glyph and the "Gotcha!" success
  // headline without a network round-trip.
  useEffect(() => {
    const resolved = resolveTheme("light", "light", themeConfig);
    injectStyles(resolved);
  }, [themeConfig]);

  // Capture JS errors for context enrichment
  useEffect(() => {
    startErrorCapture();
    return () => stopErrorCapture();
  }, []);

  // Flush offline queue on reconnect and on mount
  useEffect(() => {
    client.flushQueue();
    const handleOnline = () => client.flushQueue();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [client]);

  const openModal = useCallback((elementId: string) => {
    setActiveModalId(elementId);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModalId(null);
  }, []);

  const value: GotchaContextValue = useMemo(
    () => ({
      client,
      disabled,
      defaultUser: stableDefaultUser,
      defaultUserEmail,
      debug,
      activeModalId,
      openModal,
      closeModal,
      themeConfig,
    }),
    [
      client,
      disabled,
      stableDefaultUser,
      defaultUserEmail,
      debug,
      activeModalId,
      openModal,
      closeModal,
      themeConfig,
    ],
  );

  return (
    <GotchaContext.Provider value={value}>{children}</GotchaContext.Provider>
  );
}

export function useGotchaContext(): GotchaContextValue {
  const context = useContext(GotchaContext);
  if (!context) {
    throw new Error("useGotchaContext must be used within a GotchaProvider");
  }
  return context;
}
