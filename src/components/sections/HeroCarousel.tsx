"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Spotlight } from "@/components/interaction/Spotlight";
import type { HeroSlide } from "@/data/images";

const AUTOPLAY_MS = 4200;

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
        className="bg-paper-dim shadow-lift relative aspect-[4/5] touch-pan-y overflow-hidden sm:aspect-square lg:aspect-[4/5]"
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

        <div className="from-midnight/45 via-midnight/5 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />

        <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-4">
          <div className="max-w-[72%]">
            <span className="text-ink inline-flex rounded-full bg-white/85 px-3 py-1 text-xs font-semibold backdrop-blur">
              {active.label}
            </span>
            <p className="mt-2 text-sm font-semibold text-pretty text-white drop-shadow">
              {active.title}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-2 backdrop-blur">
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Показать фото ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "bg-accent w-5" : "bg-ink/25 w-2"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="absolute top-4 right-4 flex gap-2">
          <CarouselButton label="Предыдущее фото" onClick={() => step(-1)}>
            <ChevronLeft width={18} height={18} />
          </CarouselButton>
          <CarouselButton label="Следующее фото" onClick={() => step(1)}>
            <ChevronRight width={18} height={18} />
          </CarouselButton>
        </div>
      </div>
    </Spotlight>
  );
}

function CarouselButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="text-ink shadow-soft flex h-10 w-10 items-center justify-center rounded-full bg-white/85 backdrop-blur transition-colors hover:bg-white"
    >
      {children}
    </button>
  );
}
