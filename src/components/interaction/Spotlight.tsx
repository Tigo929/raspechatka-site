"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useInteractive } from "@/hooks/useInteractive";

/**
 * Контейнер с радиальным свечением, следующим за курсором (подпись Linear/Vercel).
 * Координаты пишутся в CSS-переменные через rAF-троттлинг — без React-state на
 * кадр. На тач/reduced-motion свечение просто не появляется.
 */
export function Spotlight({
  children,
  className,
  color = "rgba(255,74,28,0.18)",
  size = 320,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  size?: number;
}) {
  const enabled = useInteractive();
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", `${px}px`);
      el.style.setProperty("--my", `${py}px`);
      el.style.setProperty("--spot", "1");
      raf.current = 0;
    });
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--spot", "0");
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn("relative", className)}
      style={
        {
          "--mx": "50%",
          "--my": "50%",
          "--spot": "0",
        } as React.CSSProperties
      }
    >
      {enabled && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: "var(--spot)",
            background: `radial-gradient(${size}px circle at var(--mx) var(--my), ${color}, transparent 70%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}
