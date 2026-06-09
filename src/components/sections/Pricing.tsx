import { Check } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Tilt } from "@/components/interaction/Tilt";
import { formatPrice } from "@/lib/utils";

const tiers = [
  {
    name: "Один заказ",
    price: 1190,
    note: "за футболку",
    features: [
      "Без минимального тиража",
      "Бесплатный макет",
      "Печать от 1 дня",
      "Премиальный хлопок",
    ],
    cta: { label: "Собрать футболку", href: "/configurator" },
    featured: false,
  },
  {
    name: "Малый тираж",
    price: 990,
    note: "за футболку от 10 шт.",
    features: [
      "Скидка за объём",
      "Единое качество тиража",
      "Сортировка по размерам",
      "Приоритетная печать",
    ],
    cta: { label: "Рассчитать тираж", href: "/catalog/merch-na-zakaz" },
    featured: true,
  },
  {
    name: "Корпоративный",
    price: 790,
    note: "за футболку от 50 шт.",
    features: [
      "Лучшая цена за штуку",
      "Работа по договору",
      "Документы для юрлиц",
      "Персональный менеджер",
    ],
    cta: { label: "Для бизнеса", href: "/catalog/korporativnye-futbolki" },
    featured: false,
  },
];

export function Pricing() {
  return (
    <Section id="pricing">
      <SectionHeading
        eyebrow="Цены"
        title="Прозрачная стоимость"
        subtitle="Чем больше тираж — тем выгоднее цена за футболку. Никаких скрытых условий."
      />
      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {tiers.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.07}>
            <Tilt max={6}>
            <div
              className={`flex h-full flex-col rounded-3xl border p-7 transition-shadow duration-300 ${
                t.featured
                  ? "border-accent bg-ink text-paper shadow-lift"
                  : "border-line bg-white text-ink shadow-soft hover:shadow-lift"
              }`}
            >
              {t.featured && (
                <span className="mb-4 inline-flex w-fit rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  Популярный выбор
                </span>
              )}
              <h3 className="font-display text-lg font-bold">{t.name}</h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-sm opacity-70">от</span>
                <span className="font-display text-4xl font-extrabold">
                  {formatPrice(t.price)}
                </span>
              </div>
              <p className={`mt-1 text-sm ${t.featured ? "text-paper/60" : "text-muted"}`}>
                {t.note}
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check
                      width={18}
                      height={18}
                      className={t.featured ? "text-accent" : "text-accent"}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                href={t.cta.href}
                variant={t.featured ? "primary" : "ghost"}
                className="mt-7 w-full"
              >
                {t.cta.label}
              </Button>
            </div>
            </Tilt>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-6 text-center">
        <p className="text-sm text-muted">
          Итоговая цена зависит от модели, размера печати и срочности. Точный
          расчёт — бесплатно, после согласования макета.
        </p>
      </Reveal>
    </Section>
  );
}
