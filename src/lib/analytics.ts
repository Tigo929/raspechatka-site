// Client-side Yandex Metrika helper. No-ops on server and when ID is not set.
// Never pass PII (names, contacts, filenames) to these functions.

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void;
  }
}

const YM_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID
  ? Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID)
  : null;

export function ymReachGoal(goal: string): void {
  if (!YM_ID || typeof window === "undefined") return;
  window.ym?.(YM_ID, "reachGoal", goal);
}
