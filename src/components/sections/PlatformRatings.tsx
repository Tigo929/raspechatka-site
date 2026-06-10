import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Stars } from "@/components/ui/Stars";
import { siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";

type Platform = {
  key: string;
  name: string;
  url: string;
  rating: number;
  count: number;
  /** Цвет акцента площадки. */
  color: string;
};

/** Бейджи рейтингов на внешних площадках (Яндекс.Карты, Avito). */
export function PlatformRatings({ className }: { className?: string }) {
  const { yandex, avito } = siteConfig.platforms;
  const platforms: Platform[] = [
    { key: "yandex", ...yandex, color: "#FC3F1D" },
    { key: "avito", ...avito, color: "#04E061" },
  ];
  // Показываем только площадки с реальными данными.
  const visible = platforms.filter((p) => p.rating > 0 && p.url);

  if (visible.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {visible.map((p, i) => (
        <Reveal key={p.key} delay={i * 0.08}>
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="view"
            className="group border-line shadow-soft hover:shadow-lift flex items-center gap-3.5 rounded-2xl border bg-white py-3.5 pr-4 pl-3.5 transition-all hover:-translate-y-0.5"
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-extrabold text-white"
              style={{ backgroundColor: p.color }}
              aria-hidden
            >
              {p.name[0]}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="flex items-baseline gap-2">
                <span className="font-display text-ink text-2xl leading-none font-extrabold">
                  {p.rating.toFixed(1)}
                </span>
                <Stars value={p.rating} size={14} />
              </span>
              <span className="text-muted text-xs">
                {p.name} · {p.count} оценок
              </span>
            </span>
            <span className="bg-paper text-ink group-hover:bg-accent ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors group-hover:text-white">
              <ArrowUpRight width={16} height={16} />
            </span>
          </a>
        </Reveal>
      ))}
    </div>
  );
}
