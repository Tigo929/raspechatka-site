import { Sparkles, Send } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/data/site";

export function FinalCta() {
  return (
    <Section>
      <Reveal>
        <div className="bg-ink relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="bg-accent/30 pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full blur-[100px]"
          />
          <div
            aria-hidden
            className="bg-accent/20 pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full blur-[100px]"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold text-balance text-white sm:text-4xl lg:text-5xl">
              Готовы напечатать свою футболку?
            </h2>
            <p className="text-paper/70 mx-auto mt-4 max-w-xl text-pretty">
              Соберите дизайн в конструкторе за пару минут или напишите нам —
              поможем с идеей, макетом и подберём оптимальное решение под
              бюджет.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button href="/configurator" size="lg">
                <Sparkles width={18} height={18} /> Собрать футболку
              </Button>
              <Button
                href={siteConfig.social.telegram}
                external
                variant="dark"
                size="lg"
              >
                <Send width={18} height={18} /> Написать в Telegram
              </Button>
            </div>
            <p className="text-paper/50 mt-6 text-sm">
              Без минимального тиража · бесплатный макет · печать от 1 дня
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
