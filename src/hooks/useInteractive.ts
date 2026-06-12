"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const fine = window.matchMedia("(pointer: fine)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  fine.addEventListener("change", callback);
  reduced.addEventListener("change", callback);
  return () => {
    fine.removeEventListener("change", callback);
    reduced.removeEventListener("change", callback);
  };
}

function getSnapshot() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function getServerSnapshot() {
  return false;
}

/**
 * true только на устройствах с «точным» указателем (мышь/трекпад) и без
 * системного запроса «уменьшить движение». На тач-устройствах и при
 * reduced-motion возвращает false → тяжёлые desktop-эффекты не монтируются.
 */
export function useInteractive(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
