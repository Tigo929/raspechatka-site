import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { steps } from "@/data/benefits";

export function HowItWorks() {
  return (
    <Section id="how" className="bg-midnight text-paper">
      <SectionHeading
        eyebrow="Как мы работаем"
        title={<span className="text-white">Четыре шага до вашей футболки</span>}
        subtitle={
          <span className="text-paper/60">
            Прозрачный процесс без сюрпризов — вы контролируете результат на
            каждом этапе.
          </span>
        }
      />
      <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.08} as="li">
            <div className="relative">
              <span className="font-display text-5xl font-extrabold text-white/15">
                0{i + 1}
              </span>
              <div className="absolute left-0 top-2 h-px w-12 bg-accent" />
              <h3 className="mt-4 font-display text-lg font-bold text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/60">
                {step.text}
              </p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
