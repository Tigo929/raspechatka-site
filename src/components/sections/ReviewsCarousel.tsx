"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Stars } from "@/components/ui/Stars";
import type { Review, ReviewSource } from "@/types";

const sourceMeta: Record<ReviewSource, { label: string; color: string }> = {
  yandex: { label: "Яндекс.Карты", color: "#FC3F1D" },
  avito: { label: "Avito", color: "#04E061" },
  manual: { label: "Клиент", color: "#9CA0A6" },
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatMonth(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Карусель отзывов: scroll-snap + автопрокрутка (пауза на наведении/драге),
 * стрелки и перетаскивание мышью на desktop. Уважает reduced-motion.
 */
export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);

  const step = useCallback((dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const w = card ? card.offsetWidth + 16 : el.clientWidth * 0.85;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (dir > 0 && el.scrollLeft >= maxScroll - 4) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      el.scrollBy({ left: dir * w, behavior: "smooth" });
    }
  }, []);

  // Автопрокрутка.
  useEffect(() => {
    if (paused || reduce) return;
    const id = setInterval(() => step(1), 4500);
    return () => clearInterval(id);
  }, [paused, reduce, step]);

  // Перетаскивание мышью (desktop).
  const drag = useRef<{ x: number; left: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const onPointerDown = (e: React.PointerEvent) => {
    const el = trackRef.current;
    if (!el || e.pointerType !== "mouse") return;
    drag.current = { x: e.clientX, left: el.scrollLeft };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const el = trackRef.current;
    if (!el || !drag.current) return;
    el.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          dragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
      >
        {reviews.map((r, i) => {
          const meta = sourceMeta[r.source ?? "manual"];
          return (
            <figure
              key={r.name + i}
              data-card
              className="border-line shadow-soft flex w-[85%] shrink-0 snap-start flex-col rounded-3xl border bg-white p-6 sm:w-[46%] lg:w-[31.5%]"
            >
              <div className="flex items-center justify-between">
                <Quote className="text-accent/30 h-7 w-7" aria-hidden />
                <span className="border-line flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden
                  />
                  {meta.label}
                </span>
              </div>
              <blockquote className="text-ink-soft mt-3 flex-1 text-sm leading-relaxed">
                {r.text}
              </blockquote>
              <figcaption className="border-line mt-5 flex items-center gap-3 border-t pt-4">
                <span
                  className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent), #c9341a)",
                  }}
                  aria-hidden
                >
                  {initials(r.name)}
                </span>
                <div className="min-w-0">
                  <p className="text-ink truncate font-semibold">{r.name}</p>
                  <p className="text-muted truncate text-xs">
                    {formatMonth(r.date)}
                  </p>
                </div>
                <Stars value={r.rating} size={13} className="ml-auto" />
              </figcaption>
            </figure>
          );
        })}
      </div>

      {/* Стрелки */}
      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Предыдущий отзыв"
          className="border-line text-ink hover:border-accent hover:text-accent flex h-11 w-11 items-center justify-center rounded-full border bg-white transition-colors"
        >
          <ChevronLeft width={20} height={20} />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Следующий отзыв"
          className="border-line text-ink hover:border-accent hover:text-accent flex h-11 w-11 items-center justify-center rounded-full border bg-white transition-colors"
        >
          <ChevronRight width={20} height={20} />
        </button>
      </div>
    </div>
  );
}
