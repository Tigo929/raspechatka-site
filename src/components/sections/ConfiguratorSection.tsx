import Image from "next/image";
import { Check, Move, Upload } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

const steps = [
  { icon: Upload, text: "Загрузите отдельные принты для переда и спины" },
  { icon: Move, text: "Настройте положение в видимой зоне печати" },
  { icon: Check, text: "Получите превью и отправьте заказ с одним номером" },
];

export function ConfiguratorSection() {
  return (
    <Section id="configurator" className="bg-paper-dim/60 bg-grain">
      <SectionHeading
        eyebrow="Онлайн-конструктор"
        title="Перед и спина — в одном заказе"
        subtitle="Выберите белую или чёрную футболку, добавьте разные изображения на каждую сторону и сразу увидьте зону печати."
      />
      <div className="mx-auto mt-10 grid max-w-5xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal className="border-line shadow-soft relative aspect-square overflow-hidden rounded-3xl border bg-white">
          <Image
            src="/mockups/tshirt-white-front.webp"
            alt="Белая футболка в онлайн-конструкторе"
            fill
            sizes="(max-width: 1024px) 92vw, 520px"
            className="object-contain p-4"
          />
          <span className="border-accent/70 bg-accent/5 absolute left-1/2 top-[48%] h-[36%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-dashed" />
        </Reveal>
        <Reveal delay={0.08}>
          <ol className="space-y-4">
            {steps.map(({ icon: Icon, text }, index) => (
              <li key={text} className="flex items-center gap-4">
                <span className="bg-accent-soft text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                  <Icon width={19} height={19} />
                </span>
                <p className="text-ink-soft text-sm leading-relaxed"><strong className="text-ink mr-2">{index + 1}.</strong>{text}</p>
              </li>
            ))}
          </ol>
          <Button href="/configurator" size="lg" className="mt-7 w-full sm:w-auto">
            Открыть конструктор
          </Button>
          <p className="text-muted mt-3 text-xs">Макет сохраняется только после явной отправки заказа.</p>
        </Reveal>
      </div>
    </Section>
  );
}
