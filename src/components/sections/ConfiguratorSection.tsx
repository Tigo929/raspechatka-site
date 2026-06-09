import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Configurator } from "@/features/configurator/Configurator";

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
