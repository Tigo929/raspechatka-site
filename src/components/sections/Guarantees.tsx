import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { Tilt } from "@/components/interaction/Tilt";
import { guarantees } from "@/data/benefits";

export function Guarantees() {
  return (
    <Section id="guarantees">
      <Reveal>
        <div className="border-line to-paper-dim/60 rounded-3xl border bg-gradient-to-br from-white p-8 sm:p-12">
          <h2 className="font-display text-ink max-w-2xl text-2xl font-bold text-balance sm:text-3xl">
            Заказывайте без риска — мы отвечаем за результат
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {guarantees.map((g, i) => (
              <Reveal key={g.title} delay={i * 0.06}>
                <Tilt max={6} glare={false}>
                  <div className="flex h-full flex-col rounded-2xl p-3 transition-colors hover:bg-white/60">
                    <span className="bg-ink text-paper flex h-11 w-11 items-center justify-center rounded-2xl">
                      <Icon name={g.icon} className="h-5 w-5" />
                    </span>
                    <h3 className="font-display text-ink mt-4 font-bold">
                      {g.title}
                    </h3>
                    <p className="text-muted mt-1.5 text-sm leading-relaxed">
                      {g.text}
                    </p>
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
