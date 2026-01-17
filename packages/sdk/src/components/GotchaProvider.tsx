import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { createApiClient, ApiClient } from '../api/client';
import { GotchaUser } from '../types';

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
}

export interface GotchaContextValue {
  client: ApiClient;
  disabled: boolean;
  defaultUser: GotchaUser;
  debug: boolean;
  // Modal management - only one open at a time
  activeModalId: string | null;
  openModal: (elementId: string) => void;
  closeModal: () => void;
}

const GotchaContext = createContext<GotchaContextValue | null>(null);

export function GotchaProvider({
  apiKey,
  children,
  baseUrl,
  debug = false,
  disabled = false,
  defaultUser = {},
}: GotchaProviderProps) {
  const [activeModalId, setActiveModalId] = useState<string | null>(null);

  const client = useMemo(
    () => createApiClient({ apiKey, baseUrl, debug }),
    [apiKey, baseUrl, debug]
  );

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
      defaultUser,
      debug,
      activeModalId,
      openModal,
      closeModal,
    }),
    [client, disabled, defaultUser, debug, activeModalId, openModal, closeModal]
  );

  return (
    <GotchaContext.Provider value={value}>{children}</GotchaContext.Provider>
  );
}

export function useGotchaContext(): GotchaContextValue {
  const context = useContext(GotchaContext);
  if (!context) {
    throw new Error('useGotchaContext must be used within a GotchaProvider');
  }
  return context;
}
