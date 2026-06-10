import { Quote } from "lucide-react";
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
 * Отзывы плавно едут непрерывной лентой (marquee) — без стрелок, точек и
 * остановки на наведении. Плавные края (mask). Чистый CSS, без клиентского JS.
 * Уважает prefers-reduced-motion (глобальное правило останавливает анимацию).
 */
export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  // Дублируем ленту для бесшовного цикла (-50% == одна копия).
  const track = [...reviews, ...reviews];

  return (
    <div className="mask-fade-x overflow-hidden">
      <ul className="flex w-max gap-4 animate-[marquee_60s_linear_infinite] py-1">
        {track.map((r, i) => {
          const meta = sourceMeta[r.source ?? "manual"];
          return (
            <li
              key={i}
              className="border-line shadow-soft flex w-[300px] shrink-0 flex-col rounded-3xl border bg-white p-6 sm:w-[360px]"
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
