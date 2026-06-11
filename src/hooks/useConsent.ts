"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type ConsentCategories,
  type ConsentData,
  acceptAll,
  acceptNecessaryOnly,
  readConsent,
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

export function useConsent(): UseConsentReturn {
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setConsent(readConsent());
    setLoading(false);
  }, []);

  const handleAcceptAll = useCallback(() => {
    setConsent(acceptAll());
  }, []);

  const handleAcceptNecessaryOnly = useCallback(() => {
    setConsent(acceptNecessaryOnly());
  }, []);

  const handleSaveCustom = useCallback(
    (categories: Omit<ConsentCategories, "necessary">) => {
      setConsent(writeConsent(categories));
    },
    [],
  );

  return {
    consent,
    loading,
    hasAnalytics: consent?.categories.analytics === true,
    hasMarketing: consent?.categories.marketing === true,
    acceptAll: handleAcceptAll,
    acceptNecessaryOnly: handleAcceptNecessaryOnly,
    saveCustom: handleSaveCustom,
  };
}
