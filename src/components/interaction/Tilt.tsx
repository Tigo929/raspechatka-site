"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";
import { useInteractive } from "@/hooks/useInteractive";

/**
 * 3D-наклон карточки за курсором + лёгкий подъём и блик (sheen).
 * Карточка «вдавливается» в сторону указателя и плавно возвращается (spring).
 *
 * Производительность: вращение — через motion values (без React-state на кадр),
 * координаты блика — прямой записью в CSS-переменные. Только desktop без
 * reduced-motion (useInteractive) — на тач/мобайле обычный блок без эффекта.
 */
export function Tilt({
  children,
  className,
  max = 9,
  scale = 1.02,
  glare = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** Максимальный угол наклона, градусы. */
  max?: number;
  scale?: number;
  glare?: boolean;
}) {
  const enabled = useInteractive();
  const wrapRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const sc = useMotionValue(1);
  const spring = { stiffness: 250, damping: 20, mass: 0.4 };
  const srx = useSpring(rx, spring);
  const sry = useSpring(ry, spring);
  const ssc = useSpring(sc, spring);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height; // 0..1
    ry.set((px - 0.5) * 2 * max);
    rx.set(-(py - 0.5) * 2 * max);
    sc.set(scale);
    if (glare && glareRef.current) {
      glareRef.current.style.setProperty("--gx", `${px * 100}%`);
      glareRef.current.style.setProperty("--gy", `${py * 100}%`);
      glareRef.current.style.opacity = "1";
    }
  };

  const reset = () => {
    rx.set(0);
    ry.set(0);
    sc.set(1);
    if (glareRef.current) glareRef.current.style.opacity = "0";
  };

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ perspective: 900 }}
      className={cn("h-full", className)}
    >
      <motion.div
        style={{
          rotateX: srx,
          rotateY: sry,
          scale: ssc,
          transformStyle: "preserve-3d",
        }}
        className="relative h-full"
      >
        {children}
        {glare && (
          <div
            ref={glareRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] opacity-0 transition-opacity duration-300"
            style={{
              background:
                "radial-gradient(240px circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,0.28), transparent 60%)",
              mixBlendMode: "soft-light",
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
