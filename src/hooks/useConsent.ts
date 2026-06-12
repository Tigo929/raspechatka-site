"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  type ConsentCategories,
  type ConsentData,
  acceptAll,
  acceptNecessaryOnly,
  readConsent,
  subscribeToConsent,
  writeConsent,
} from "@/lib/consent";

export interface UseConsentReturn {
  consent: ConsentData | null;
  /** true пока consent ещё не считан из localStorage */
  loading: boolean;
  hasAnalytics: boolean;
  hasMarketing: boolean;
  acceptAll: () => void;
  acceptNecessaryOnly: () => void;
  saveCustom: (categories: Omit<ConsentCategories, "necessary">) => void;
}

const subscribeHydration = () => () => undefined;

export function useConsent(): UseConsentReturn {
  const consent = useSyncExternalStore(subscribeToConsent, readConsent, () => null);
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);

  const handleAcceptAll = useCallback(() => {
    acceptAll();
  }, []);

  const handleAcceptNecessaryOnly = useCallback(() => {
    acceptNecessaryOnly();
  }, []);

  const handleSaveCustom = useCallback(
    (categories: Omit<ConsentCategories, "necessary">) => {
      writeConsent(categories);
    },
    [],
  );

  return {
    consent,
    loading: !hydrated,
    hasAnalytics: consent?.categories.analytics === true,
    hasMarketing: consent?.categories.marketing === true,
    acceptAll: handleAcceptAll,
    acceptNecessaryOnly: handleAcceptNecessaryOnly,
    saveCustom: handleSaveCustom,
  };
}
