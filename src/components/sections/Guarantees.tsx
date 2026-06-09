import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { Tilt } from "@/components/interaction/Tilt";
import { guarantees } from "@/data/benefits";

export function Guarantees() {
  return (
    <Section id="guarantees">
      <Reveal>
        <div className="rounded-3xl border border-line bg-gradient-to-br from-white to-paper-dim/60 p-8 sm:p-12">
          <h2 className="max-w-2xl font-display text-2xl font-bold text-ink text-balance sm:text-3xl">
            Заказывайте без риска — мы отвечаем за результат
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {guarantees.map((g, i) => (
              <Reveal key={g.title} delay={i * 0.06}>
                <Tilt max={6} glare={false}>
                  <div className="flex h-full flex-col rounded-2xl p-3 transition-colors hover:bg-white/60">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-paper">
                      <Icon name={g.icon} className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-display font-bold text-ink">
                      {g.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
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
