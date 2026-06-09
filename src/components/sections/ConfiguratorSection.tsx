"use client";

import dynamic from "next/dynamic";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

// Конфигуратор — тяжёлый интерактивный остров. Грузим лениво (code splitting),
// чтобы не утяжелять первичную загрузку главной.
const Configurator = dynamic(
  () => import("@/features/configurator/Configurator").then((m) => m.Configurator),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[420px] animate-pulse gap-8 rounded-3xl lg:grid-cols-2">
        <div className="rounded-3xl bg-paper-dim" />
        <div className="rounded-3xl bg-paper-dim" />
      </div>
    ),
  },
);

export function ConfiguratorSection() {
  return (
    <Section id="configurator" className="bg-paper-dim/60 bg-grain">
      <SectionHeading
        eyebrow="Конструктор"
        title="Соберите футболку прямо сейчас"
        subtitle="Выберите цвет, загрузите изображение, настройте размер и положение — и сразу увидите результат."
      />
      <div className="mx-auto mt-12 max-w-5xl">
        <Configurator compact />
      </div>
    </Section>
  );
}
