import { Plus } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { faq as defaultFaq } from "@/data/faq";
import { siteConfig } from "@/data/site";
import type { FaqItem } from "@/types";

/**
 * FAQ на нативных <details> — доступно, работает без JS и индексируется.
 * JSON-LD FAQPage подключается на уровне страницы.
 */
export function Faq({
  items = defaultFaq,
  title = "Частые вопросы",
  eyebrow = "FAQ",
}: {
  items?: FaqItem[];
  title?: string;
  eyebrow?: string;
}) {
  return (
    <Section id="faq">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <SectionHeading
            align="left"
            eyebrow={eyebrow}
            title={title}
            subtitle="Не нашли ответ? Напишите нам — поможем с любым вопросом по заказу."
          />
          <Reveal className="mt-6">
            <Button href={siteConfig.social.telegram} external variant="ghost">
              Задать вопрос
            </Button>
          </Reveal>
        </div>

        <Reveal className="divide-line border-line shadow-soft divide-y rounded-3xl border bg-white px-5 sm:px-7">
          {items.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="font-display text-ink flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold sm:text-lg">
                {item.question}
                <span className="bg-paper text-ink group-open:bg-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-open:rotate-45 group-open:text-white">
                  <Plus width={18} height={18} />
                </span>
              </summary>
              <p className="text-muted mt-3 max-w-2xl text-sm leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
