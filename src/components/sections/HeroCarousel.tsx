"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Spotlight } from "@/components/interaction/Spotlight";
import type { HeroSlide } from "@/data/images";

const AUTOPLAY_MS = 4200;

/**
 * Галерея примеров работ (hero).
 * Контролы по принципам frontend-design / taste-skill:
 * - стрелки по центру боковых краёв, появляются при наведении (не в углу);
 * - точки снизу по центру (не конфликтуют с плавающими карточками);
 * - тёмная подложка + предзагрузка всех фото → нет серой вспышки между кадрами.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const drag = useRef<{ x: number; y: number } | null>(null);

  const goTo = useCallback(
    (next: number, dir = next > index ? 1 : -1) => {
      setDirection(dir);
      setIndex((next + slides.length) % slides.length);
    },
    [index, slides.length],
  );

  const step = useCallback(
    (dir: number) => {
      goTo(index + dir, dir);
    },
    [goTo, index],
  );

  useEffect(() => {
    if (paused || reduce) return;
    const id = setInterval(() => step(1), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, reduce, step]);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    setPaused(true);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const start = drag.current;
    drag.current = null;
    setPaused(false);
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy)) return;
    step(dx < 0 ? 1 : -1);
  };

  const active = slides[index];

  return (
    <Spotlight className="overflow-hidden rounded-3xl" size={360}>
      <div
        className="group bg-midnight shadow-lift relative aspect-[4/5] touch-pan-y overflow-hidden sm:aspect-square lg:aspect-[4/5]"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null;
          setPaused(false);
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={active.src}
            custom={direction}
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, x: direction > 0 ? 42 : -42, scale: 1.025 }
            }
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, x: direction > 0 ? -42 : 42, scale: 0.985 }
            }
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={active.src}
              alt={active.alt}
              fill
              priority={index === 0}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        <div className="from-midnight/65 via-midnight/10 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />

        {/* Подпись — снизу слева */}
        <div className="pointer-events-none absolute bottom-5 left-5 max-w-[60%]">
          <span className="text-ink inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold backdrop-blur">
            {active.label}
          </span>
          <p className="mt-2 text-sm font-semibold text-pretty text-white drop-shadow-lg">
            {active.title}
          </p>
        </div>

        {/* Точки — снизу по центру */}
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                goTo(i);
              }}
              aria-label={`Показать фото ${i + 1}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index
                  ? "bg-accent w-6"
                  : "w-2 bg-white/60 hover:bg-white/90"
              }`}
            />
          ))}
        </div>

        {/* Стрелки — по центру боковых краёв, появляются при наведении */}
        <EdgeArrow side="left" label="Предыдущее фото" onClick={() => step(-1)}>
          <ChevronLeft width={20} height={20} />
        </EdgeArrow>
        <EdgeArrow side="right" label="Следующее фото" onClick={() => step(1)}>
          <ChevronRight width={20} height={20} />
        </EdgeArrow>
      </div>
    </Spotlight>
  );
}

function EdgeArrow({
  side,
  label,
  onClick,
  children,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`text-ink shadow-soft absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-0 backdrop-blur transition-all duration-200 group-hover:opacity-100 hover:bg-white focus-visible:opacity-100 ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      {children}
    </button>
  );
}
