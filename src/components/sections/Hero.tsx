import { Sparkles, Star, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Magnetic } from "@/components/interaction/Magnetic";
import { CountUp } from "@/components/interaction/CountUp";
import { HeroCarousel } from "@/components/sections/HeroCarousel";
import { heroSlides } from "@/data/images";
import { siteConfig } from "@/data/site";

/**
 * Серверный hero: H1 и изображение рендерятся сразу с opacity:1 (бережём LCP).
 * Интерактив добавлен островками: Spotlight (свечение за курсором), Magnetic
 * (магнитные CTA), CountUp (счётчики). Появление — через CSS-анимацию rise
 * (без гидрационной задержки), LCP-элементы не анимируются.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pt-10 sm:pt-14 lg:pt-20">
      <div
        aria-hidden
        className="bg-accent/15 pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full blur-[120px]"
      />
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="flex flex-col items-start">
            <span className="animate-rise border-line text-ink-soft inline-flex items-center gap-2 rounded-full border bg-white/60 px-4 py-1.5 text-sm font-medium backdrop-blur">
              <Star
                width={15}
                height={15}
                className="fill-accent text-accent"
              />
              {siteConfig.aggregateRating.value} · больше{" "}
              {siteConfig.aggregateRating.count.toLocaleString("ru-RU")}{" "}
              довольных клиентов
            </span>

            <h1 className="font-display text-ink mt-6 text-4xl leading-[1.05] font-extrabold text-balance sm:text-5xl lg:text-6xl">
              Футболки с принтом,
              <br className="hidden sm:block" /> фото и логотипом{" "}
              <span className="text-accent">на заказ</span>
            </h1>

            <p
              className="animate-rise text-muted mt-5 max-w-xl text-lg text-pretty"
              style={{ animationDelay: "0.08s" }}
            >
              Премиальная печать на плотном хлопке. Без минимального тиража,
              бесплатный макет и стойкие цвета, которые держатся 50+ стирок.
              Соберите свою футболку за пару минут.
            </p>

            <div
              className="animate-rise mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "0.16s" }}
            >
              <Magnetic>
                <Link
                  href="/configurator"
                  data-cursor="cta"
                  className="bg-accent shadow-soft hover:bg-accent-hover hover:shadow-lift inline-flex h-14 items-center justify-center gap-2 rounded-full px-8 text-base font-semibold text-white transition-colors"
                >
                  <Sparkles width={18} height={18} /> Собрать футболку
                </Link>
              </Magnetic>
              <Magnetic strength={0.25}>
                <Link
                  href="/catalog"
                  data-cursor="link"
                  className="border-line text-ink hover:bg-ink/5 inline-flex h-14 items-center justify-center rounded-full border px-8 text-base font-semibold transition-colors"
                >
                  Смотреть каталог
                </Link>
              </Magnetic>
            </div>

            <dl
              className="animate-rise border-line mt-10 grid w-full max-w-md grid-cols-3 gap-4 border-t pt-6"
              style={{ animationDelay: "0.24s" }}
            >
              <Stat value={1} prefix="от " label="дня на заказ" />
              <Stat value={50} suffix="+" label="стирок без потерь" />
              <Stat value={0} label="минимальный тираж" />
            </dl>
          </div>

          {/* Визуал */}
          <div className="relative">
            <HeroCarousel slides={heroSlides} />

            <div
              className="animate-float shadow-lift absolute top-8 -left-3 flex items-center gap-2.5 rounded-2xl bg-white/90 px-4 py-3 backdrop-blur sm:-left-5"
              style={{ animationDelay: "0.2s" }}
            >
              <span className="bg-accent-soft text-accent flex h-9 w-9 items-center justify-center rounded-full">
                <Clock width={18} height={18} />
              </span>
              <div>
                <p className="text-ink text-sm font-semibold">
                  Печать от 1 дня
                </p>
                <p className="text-muted text-xs">успеем к вашей дате</p>
              </div>
            </div>

            <div
              className="animate-float shadow-lift absolute -right-3 bottom-8 flex items-center gap-2.5 rounded-2xl bg-white/90 px-4 py-3 backdrop-blur sm:-right-5"
              style={{ animationDelay: "1.2s" }}
            >
              <span className="bg-accent-soft text-accent flex h-9 w-9 items-center justify-center rounded-full">
                <ShieldCheck width={18} height={18} />
              </span>
              <div>
                <p className="text-ink text-sm font-semibold">
                  Гарантия качества
                </p>
                <p className="text-muted text-xs">переделаем при браке</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Stat({
  value,
  prefix,
  suffix,
  label,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}) {
  return (
    <div>
      <dt className="font-display text-ink text-2xl font-bold">
        <CountUp value={value} prefix={prefix} suffix={suffix} />
      </dt>
      <dd className="text-muted text-sm">{label}</dd>
    </div>
  );
}
