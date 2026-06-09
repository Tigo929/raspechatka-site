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
        eyebrow="Почему PRINTLAB"
        title="Качество, за которое не стыдно"
        subtitle="Мы отвечаем за каждую футболку — от ткани до последней стирки."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((b, i) => (
          <Reveal key={b.title} delay={i * 0.05}>
            <Tilt>
              <div className="group h-full rounded-3xl border border-line bg-white p-7 shadow-soft transition-shadow duration-300 hover:shadow-lift">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                  <Icon name={b.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-ink">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
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
