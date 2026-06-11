import { Briefcase, Clock, FileText, Palette, Shield, Users } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Tilt } from "@/components/interaction/Tilt";

const benefits = [
  {
    icon: Palette,
    title: "Точные фирменные цвета",
    text: "Соблюдаем брендбук, подбираем по Pantone — логотип выглядит так же, как в гайдлайне.",
  },
  {
    icon: Shield,
    title: "Гарантия единого качества",
    text: "Весь тираж — одна партия, одна краска, одна линия. Ни одна футболка не выбьется из серии.",
  },
  {
    icon: Clock,
    title: "Чёткие сроки",
    text: "Согласовываем дедлайн на старте. Работаем под мероприятия, конференции и корпоративы.",
  },
  {
    icon: FileText,
    title: "Документы для бухгалтерии",
    text: "Договор, счёт, УПД или акт. Работаем с ИП и юрлицами, безналичная оплата.",
  },
  {
    icon: Users,
    title: "Персональный менеджер",
    text: "Один контакт от заявки до выдачи. Никаких переключений между отделами.",
  },
  {
    icon: Briefcase,
    title: "Любой объём",
    text: "Пробная партия из 5 штук или корпоративный тираж 500+. Цена зависит от объёма.",
  },
];

export function BusinessBenefits() {
  return (
    <Section className="bg-midnight text-paper">
      <SectionHeading
        eyebrow="Для бизнеса"
        title={<span className="text-white">Почему нас выбирают компании</span>}
        subtitle={
          <span className="text-paper/60">
            Работаем с брендами, агентствами и корпоративными командами. Знаем,
            что важно для бизнеса.
          </span>
        }
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((b, i) => (
          <Reveal key={b.title} delay={i * 0.05}>
            <Tilt>
              <div className="group h-full rounded-3xl border border-white/10 bg-white/5 p-7 transition-colors hover:bg-white/10">
                <span className="bg-accent/20 text-accent flex h-12 w-12 items-center justify-center rounded-2xl">
                  <b.icon className="h-6 w-6" />
                </span>
                <h3 className="font-display mt-5 text-lg font-bold text-white">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/60">
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
