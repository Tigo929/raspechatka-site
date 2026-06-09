import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Reveal } from "@/components/ui/Reveal";
import { Configurator } from "@/features/configurator/Configurator";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Faq } from "@/components/sections/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Конструктор футболки — соберите свой дизайн онлайн",
  description:
    "Онлайн-конструктор футболки: выберите цвет, загрузите изображение, настройте размер и положение принта и оформите заказ. Бесплатный макет, печать от 1 дня.",
  path: "/configurator",
  keywords: ["конструктор футболки", "создать футболку онлайн", "дизайн футболки"],
});

const perks = [
  "Превью в реальном времени",
  "Любой цвет и размер",
  "Бесплатный макет от дизайнера",
  "Изображение не покидает устройство",
];

export default function ConfiguratorPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Главная", path: "/" },
          { name: "Конструктор", path: "/configurator" },
        ])}
      />

      <Section className="pt-10 sm:pt-14">
        <Breadcrumbs
          items={[
            { name: "Главная", href: "/" },
            { name: "Конструктор", href: "/configurator" },
          ]}
        />
        <Reveal className="mt-6 max-w-3xl">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink text-balance sm:text-5xl">
            Соберите свою футболку
          </h1>
          <p className="mt-4 text-lg text-muted text-pretty">
            Выберите цвет, загрузите принт, настройте размер и положение — и сразу
            увидите результат. Когда всё готово, оформите заказ в один клик.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-ink-soft">
                <Check width={16} height={16} className="text-accent" />
                {p}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-10">
          <Configurator />
        </div>
      </Section>

      <HowItWorks />
      <Faq />
    </>
  );
}
