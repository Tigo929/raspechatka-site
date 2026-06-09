"use client";

import { useEffect, useState } from "react";

/**
 * true только на устройствах с «точным» указателем (мышь/трекпад) и без
 * системного запроса «уменьшить движение». На тач-устройствах и при
 * reduced-motion возвращает false → тяжёлые desktop-эффекты не монтируются.
 *
 * Стартует с false (совпадает с SSR), включается после монтирования —
 * без гидрационных рассинхронов и без вреда мобайлу (приоритетный трафик).
 */
export function useInteractive(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => setEnabled(fine.matches && !reduced.matches);
    update();

    fine.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  return enabled;
}
