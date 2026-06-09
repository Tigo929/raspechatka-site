import { Quote } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Stars } from "@/components/ui/Stars";
import { Tilt } from "@/components/interaction/Tilt";
import { reviews } from "@/data/reviews";
import { siteConfig } from "@/data/site";

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

export function Reviews() {
  return (
    <Section id="reviews" className="bg-paper-dim/60">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          align="left"
          eyebrow="Отзывы"
          title="Нам доверяют тысячи клиентов"
          className="max-w-xl"
        />
        <Reveal className="border-line shadow-soft flex items-center gap-3 rounded-2xl border bg-white px-5 py-4">
          <span className="font-display text-ink text-4xl font-extrabold">
            {siteConfig.aggregateRating.value}
          </span>
          <div>
            <Stars value={siteConfig.aggregateRating.value} />
            <p className="text-muted mt-1 text-sm">
              {siteConfig.aggregateRating.count.toLocaleString("ru-RU")} оценок
            </p>
          </div>
        </Reveal>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r, i) => (
          <Reveal key={r.name + i} delay={(i % 3) * 0.06}>
            <Tilt max={6}>
              <figure className="border-line shadow-soft hover:shadow-lift flex h-full flex-col rounded-3xl border bg-white p-6 transition-shadow duration-300">
                <Quote className="text-accent/30 h-7 w-7" aria-hidden />
                <blockquote className="text-ink-soft mt-3 flex-1 text-sm leading-relaxed">
                  {r.text}
                </blockquote>
                <figcaption className="border-line mt-5 flex items-center gap-3 border-t pt-4">
                  <span
                    className="font-display flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
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
                      {r.context} · {formatMonth(r.date)}
                    </p>
                  </div>
                  <Stars value={r.rating} size={13} className="ml-auto" />
                </figcaption>
              </figure>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
