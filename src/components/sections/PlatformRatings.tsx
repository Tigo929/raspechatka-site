import { Star, ExternalLink } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
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
            className="group border-line shadow-soft hover:shadow-lift flex items-center gap-3 rounded-2xl border bg-white px-5 py-3.5 transition-shadow"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white"
              style={{ backgroundColor: p.color }}
              aria-hidden
            >
              {p.name[0]}
            </span>
            <span className="flex flex-col">
              <span className="text-muted text-xs">{p.name}</span>
              <span className="flex items-center gap-1.5">
                <span className="font-display text-ink text-xl font-extrabold leading-none">
                  {p.rating.toFixed(1)}
                </span>
                <Star
                  width={15}
                  height={15}
                  className="fill-accent text-accent"
                />
                <span className="text-muted text-xs">· {p.count}</span>
              </span>
            </span>
            <ExternalLink
              width={15}
              height={15}
              className="text-muted group-hover:text-accent ml-1 transition-colors"
            />
          </a>
        </Reveal>
      ))}
    </div>
  );
}
