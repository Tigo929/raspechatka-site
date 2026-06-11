import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { getSteps } from "@/lib/content-repository";

export async function HowItWorks() {
  const steps = await getSteps();
  return (
    <Section id="how" className="bg-midnight text-paper">
      <SectionHeading
        eyebrow="Как мы работаем"
        title={
          <span className="text-white">Четыре шага до вашей футболки</span>
        }
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
              <div className="bg-accent absolute top-2 left-0 h-px w-12" />
              <h3 className="font-display mt-4 text-lg font-bold text-white">
                {step.title}
              </h3>
              <p className="text-paper/60 mt-2 text-sm leading-relaxed">
                {step.text}
              </p>
            </div>
          </Reveal>
        ))}
      </ol>

      <Reveal className="mt-14 flex flex-col items-center gap-4 text-center">
        <p className="text-paper/60 text-sm">
          Весь процесс — от заявки до готовой футболки — занимает от одного рабочего дня
        </p>
        <Link
          href="/configurator"
          className="bg-accent hover:bg-accent-hover inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-colors"
        >
          <Sparkles width={16} height={16} /> Начать прямо сейчас
        </Link>
      </Reveal>
    </Section>
  );
}
