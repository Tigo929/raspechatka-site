import { Check } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { LeadForm } from "@/features/order/LeadForm";

interface LeadCtaProps {
  title?: string;
  description?: string;
  perks?: string[];
  id?: string;
}

const defaultPerks = [
  "Поможем с макетом и идеей",
  "Подскажем модель и подберём цвет",
  "Ответим быстро в рабочее время",
  "Без предоплаты до согласования",
];

export function LeadCta({
  title = "Не хотите собирать сами? Оставьте заявку",
  description = "Опишите идею в двух словах — менеджер свяжется, поможет с макетом и оформит заказ за вас. Это бесплатно и ни к чему не обязывает.",
  perks = defaultPerks,
  id = "zayavka",
}: LeadCtaProps) {
  return (
    <Section id={id} className="bg-paper-dim/60">
      <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
        <Reveal>
          <h2 className="font-display text-ink text-3xl font-bold text-balance sm:text-4xl">
            {title}
          </h2>
          <p className="text-muted mt-4 text-lg text-pretty">{description}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {perks.map((p) => (
              <li key={p} className="text-ink-soft flex items-center gap-2.5 text-sm">
                <span className="bg-accent-soft text-accent flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <Check width={14} height={14} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <LeadForm />
        </Reveal>
      </div>
    </Section>
  );
}
