import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { Tilt } from "@/components/interaction/Tilt";
import { benefits } from "@/data/benefits";

export function Benefits() {
  return (
    <Section id="benefits">
      <SectionHeading
        eyebrow="Почему Распечатка"
        title="Качество, за которое не стыдно"
        subtitle="Мы отвечаем за каждую футболку — от ткани до последней стирки."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((b, i) => (
          <Reveal key={b.title} delay={i * 0.05}>
            <Tilt>
              <div className="group border-line shadow-soft hover:shadow-lift h-full rounded-3xl border bg-white p-7 transition-shadow duration-300">
                <span className="bg-accent-soft text-accent group-hover:bg-accent flex h-12 w-12 items-center justify-center rounded-2xl transition-colors group-hover:text-white">
                  <Icon name={b.icon} className="h-6 w-6" />
                </span>
                <h3 className="font-display text-ink mt-5 text-lg font-bold">
                  {b.title}
                </h3>
                <p className="text-muted mt-2 text-sm leading-relaxed">
                  {b.text}
                </p>
              </div>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
