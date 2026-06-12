"use client";

export const CONSENT_STORAGE_KEY = "printlab_cookie_consent";
export const CONSENT_VERSION = "1.0";
export const PRIVACY_POLICY_VERSION = "1.0";

export interface ConsentCategories {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentData {
  version: string;
  acceptedAt: string;
  categories: ConsentCategories;
}

export const CONSENT_EVENT = "printlab:consent";
let cachedRaw: string | null | undefined;
let cachedConsent: ConsentData | null = null;

export function readConsent(): ConsentData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw === cachedRaw) return cachedConsent;
    cachedRaw = raw;
    if (!raw) {
      cachedConsent = null;
      return null;
    }
    const parsed = JSON.parse(raw) as ConsentData;
    cachedConsent = parsed.version === CONSENT_VERSION ? parsed : null;
    return cachedConsent;
  } catch {
    cachedConsent = null;
    return null;
  }
}

export function writeConsent(categories: Omit<ConsentCategories, "necessary">): ConsentData {
  const data: ConsentData = {
    version: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    categories: { necessary: true, ...categories },
  };
  if (typeof window !== "undefined") {
    const raw = JSON.stringify(data);
    localStorage.setItem(CONSENT_STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedConsent = data;
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }
  return data;
}

export function subscribeToConsent(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== CONSENT_STORAGE_KEY) return;
    cachedRaw = undefined;
    onChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CONSENT_EVENT, onChange);
  };
}

export function hasConsent(category: keyof ConsentCategories): boolean {
  const data = readConsent();
  if (!data) return category === "necessary";
  return data.categories[category] === true;
}

export function acceptAll(): ConsentData {
  return writeConsent({ analytics: true, marketing: true });
}

export function acceptNecessaryOnly(): ConsentData {
  return writeConsent({ analytics: false, marketing: false });
}
