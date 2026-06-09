import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { seoLandings } from "@/data/seoLandings";

/** Информационно-SEO блок: уникальный текст + перелинковка на посадочные. */
export function SeoText() {
  return (
    <Section className="bg-paper-dim/60">
      <Reveal className="mx-auto max-w-3xl">
        <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
          Печать на футболках на заказ в студии PRINTLAB
        </h2>
        <div className="mt-5 space-y-4 text-[0.95rem] leading-relaxed text-ink-soft">
          <p>
            PRINTLAB — это студия премиальной печати на футболках. Мы наносим на
            ткань{" "}
            <Link href="/catalog/futbolka-s-printom" className="text-accent underline-offset-2 hover:underline">
              готовые принты
            </Link>
            ,{" "}
            <Link href="/catalog/futbolka-s-foto" className="text-accent underline-offset-2 hover:underline">
              ваши фотографии
            </Link>
            ,{" "}
            <Link href="/catalog/futbolka-s-nadpisyu" className="text-accent underline-offset-2 hover:underline">
              надписи
            </Link>{" "}
            и{" "}
            <Link href="/catalog/futbolka-s-logotipom" className="text-accent underline-offset-2 hover:underline">
              логотипы
            </Link>
            . Печатаем без минимального тиража: одна футболка в подарок или сотни
            для мероприятия — качество и срок одинаково высокие.
          </p>
          <p>
            Для печати используем плотный хлопок 180–240 г/м² и пигментные
            чернила. Цифровая DTG-печать передаёт фотографии и сложные градиенты
            без потери деталей, а принт выдерживает более 50 стирок без
            растрескивания и выцветания. Перед запуском вы бесплатно получаете
            макет на согласование — никаких сюрпризов в результате.
          </p>
          <p>
            Поможем с любой задачей: индивидуальный{" "}
            <Link href="/catalog/podarok-s-printom" className="text-accent underline-offset-2 hover:underline">
              подарок с принтом
            </Link>
            ,{" "}
            <Link href="/catalog/parnye-futbolki" className="text-accent underline-offset-2 hover:underline">
              парные футболки
            </Link>
            ,{" "}
            <Link href="/catalog/merch-na-zakaz" className="text-accent underline-offset-2 hover:underline">
              мерч на заказ
            </Link>{" "}
            и{" "}
            <Link href="/catalog/korporativnye-futbolki" className="text-accent underline-offset-2 hover:underline">
              корпоративные футболки
            </Link>{" "}
            с доставкой по всей России. Соберите дизайн в конструкторе или
            пришлите идею — остальное сделаем мы.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {seoLandings.map((l) => (
            <Link
              key={l.slug}
              href={`/catalog/${l.slug}`}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent"
            >
              {l.keyword}
            </Link>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
