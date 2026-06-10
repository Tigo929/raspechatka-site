"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useInteractive } from "@/hooks/useInteractive";

/**
 * Кастомный курсор: точка (мгновенно за мышью) + догоняющее кольцо (lerp).
 * Реагирует на элементы с атрибутом data-cursor ("cta" | "drag" | "view" | "link").
 *
 * Производительность: позиция пишется напрямую в style.transform внутри rAF —
 * НИКАКОГО React-state на кадр, поэтому INP не страдает. Слушатели — passive.
 * Монтируется только на desktop без reduced-motion (см. useInteractive).
 */
export function CustomCursor() {
  const pathname = usePathname();
  // В админке кастомный курсор не нужен — там обычная системная мышь.
  const onAdmin = pathname?.startsWith("/admin") ?? false;
  const enabled = useInteractive() && !onAdmin;
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const render = () => {
      // Кольцо плавно догоняет курсор.
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    // Делегирование: меняем вид кольца при наведении на data-cursor.
    const labels: Record<string, string> = {
      cta: "Собрать",
      drag: "Тащи",
      view: "Смотреть",
      link: "",
    };
    const interactiveSelector =
      'a, button, [role="button"], label, summary, input, select, textarea';

    const getCursorTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return null;

      // Явная зона (cta/view/drag) важнее; иначе любой кликабельный → "link".
      const dataEl = target.closest("[data-cursor]");
      if (dataEl) return dataEl;

      return target.closest(interactiveSelector);
    };

    const applyCursorState = (el: Element | null) => {
      let kind = el?.getAttribute("data-cursor") ?? "";
      if (!kind && el) kind = "link";
      // Состояние пишем и на кольцо, и на точку — оба меняют вид.
      ring.dataset.state = kind;
      dot.dataset.state = kind;
      const text = el?.getAttribute("data-cursor-label") ?? labels[kind] ?? "";
      label.textContent = text;
    };

    const onOver = (e: MouseEvent) => {
      applyCursorState(getCursorTarget(e.target));
    };

    const onOut = (e: MouseEvent) => {
      const from = getCursorTarget(e.target);
      if (!from) return;

      const to = getCursorTarget(e.relatedTarget);

      if (from === to) return;
      applyCursorState(to);
    };

    const onLeaveWindow = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };
    const onEnterWindow = () => {
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    // Один mouseover: срабатывает при входе в любой элемент (включая пустоту → сброс).
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeaveWindow);
    document.documentElement.addEventListener("mouseenter", onEnterWindow);
    document.documentElement.classList.add("has-custom-cursor");

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.documentElement.removeEventListener("mouseleave", onLeaveWindow);
      document.documentElement.removeEventListener("mouseenter", onEnterWindow);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      data-site-chrome
      className="pointer-events-none fixed inset-0 z-[9999]"
    >
      <div
        ref={dotRef}
        data-state=""
        className="cursor-dot bg-accent fixed top-0 left-0 h-2 w-2 rounded-full transition-[background-color,box-shadow,width,height,opacity] duration-200"
      />
      <div
        ref={ringRef}
        data-state=""
        className="cursor-ring border-ink/30 fixed top-0 left-0 flex h-9 w-9 items-center justify-center rounded-full border transition-[width,height,background-color,border-color,opacity] duration-200"
      >
        <span
          ref={labelRef}
          className="text-[10px] font-semibold tracking-wide text-white uppercase opacity-0 transition-opacity"
        />
      </div>
    </div>
  );
}
