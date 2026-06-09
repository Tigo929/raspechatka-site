import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Tilt } from "@/components/interaction/Tilt";
import { useCases } from "@/data/useCases";

export function UseCases() {
  return (
    <Section id="usecases">
      <SectionHeading
        eyebrow="Сценарии"
        title="Под любой повод"
        subtitle="Подарок, корпоративный мерч или единый стиль для команды — поможем с идеей."
      />
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {useCases.map((u, i) => (
          <Reveal key={u.title} delay={i * 0.08}>
            <Tilt max={7}>
            <article className="group h-full overflow-hidden rounded-3xl border border-line bg-white shadow-soft transition-shadow duration-300 hover:shadow-lift">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={u.image}
                  alt={u.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 90vw, 30vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-ink">
                  {u.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {u.text}
                </p>
              </div>
            </article>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
