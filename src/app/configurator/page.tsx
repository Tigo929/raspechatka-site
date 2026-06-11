import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Reveal } from "@/components/ui/Reveal";
import { Configurator } from "@/features/configurator/Configurator";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Reviews } from "@/components/sections/Reviews";
import { Faq } from "@/components/sections/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Конструктор футболки — соберите свой дизайн онлайн",
  description:
    "Онлайн-конструктор футболки: выберите цвет, загрузите изображение, настройте размер и положение принта и оформите заказ. Бесплатный макет, печать от 1 дня.",
  path: "/configurator",
  keywords: [
    "конструктор футболки",
    "создать футболку онлайн",
    "дизайн футболки",
  ],
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

      <Section className="pt-6 sm:pt-8 pb-10 sm:pb-14">
        <Breadcrumbs
          items={[
            { name: "Главная", href: "/" },
            { name: "Конструктор", href: "/configurator" },
          ]}
        />
        <Reveal className="mt-4">
          <h1 className="font-display text-ink text-3xl font-extrabold text-balance sm:text-4xl">
            Соберите свою футболку
          </h1>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
            {perks.map((p) => (
              <li
                key={p}
                className="text-ink-soft flex items-center gap-2 text-sm"
              >
                <Check width={14} height={14} className="text-accent" />
                {p}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-6">
          <Configurator />
        </div>
      </Section>

      <HowItWorks />
      <Reviews />
      <Faq />
    </>
  );
}
