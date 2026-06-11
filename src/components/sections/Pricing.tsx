import { Check } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Tilt } from "@/components/interaction/Tilt";
import { formatPrice } from "@/lib/utils";
import { getPricing } from "@/lib/content-repository";

export async function Pricing() {
  const tiers = await getPricing();
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
                    : "border-line text-ink shadow-soft hover:shadow-lift bg-white"
                }`}
              >
                {t.badge && (
                  <span className="bg-accent mb-4 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase">
                    {t.badge}
                  </span>
                )}
                <h3 className="font-display text-lg font-bold">{t.name}</h3>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-sm opacity-70">от</span>
                  <span className="font-display text-4xl font-extrabold">
                    {formatPrice(t.price)}
                  </span>
                  {t.oldPrice && (
                    <span
                      className={`text-base line-through ${t.featured ? "text-paper/50" : "text-muted"}`}
                    >
                      {formatPrice(t.oldPrice)}
                    </span>
                  )}
                </div>
                <p
                  className={`mt-1 text-sm ${t.featured ? "text-paper/60" : "text-muted"}`}
                >
                  {t.note}
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check
                        width={18}
                        height={18}
                        className="text-accent"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  href={t.ctaHref}
                  variant={t.featured ? "primary" : "ghost"}
                  className="mt-7 w-full"
                >
                  {t.ctaLabel}
                </Button>
              </div>
            </Tilt>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-6 text-center">
        <p className="text-muted text-sm">
          Итоговая цена зависит от модели, размера печати и срочности. Точный
          расчёт — бесплатно, после согласования макета.
        </p>
      </Reveal>
    </Section>
  );
}
