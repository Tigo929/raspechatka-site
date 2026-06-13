import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PlatformRatings } from "@/components/sections/PlatformRatings";
import { ReviewsCarousel } from "@/components/sections/ReviewsCarousel";
import { getPublicReviews } from "@/lib/content-repository";

export async function Reviews() {
  const positive = await getPublicReviews();

  return (
    <Section id="reviews" className="bg-paper-dim/60">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          align="left"
          eyebrow="Отзывы"
          title="Что говорят наши клиенты"
          subtitle="Показываем внешние рейтинги, живой контекст заказов и обратную связь после печати."
          className="max-w-xl"
        />
        <Reveal>
          <PlatformRatings />
        </Reveal>
      </div>

      <Reveal delay={0.08}>
        <div className="border-line mt-7 grid gap-4 rounded-3xl border bg-white/70 p-5 text-sm sm:grid-cols-3">
          <ProofItem
            title="Внешние площадки"
            text="Яндекс.Карты и профильные каналы"
          />
          <ProofItem
            title="Макет до печати"
            text="согласование перед запуском"
          />
          <ProofItem
            title="Ответственность"
            text="гарантия и переделка при браке"
          />
        </div>
      </Reveal>

      <div className="mt-12">
        {positive.length > 0 ? (
          <ReviewsCarousel reviews={positive} />
        ) : (
          <p className="text-muted text-center text-sm py-6">
            Живые отзывы клиентов появятся здесь после первых заказов.
          </p>
        )}
      </div>
    </Section>
  );
}

function ProofItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-line sm:border-l sm:pl-4 first:sm:border-l-0 first:sm:pl-0">
      <p className="text-ink font-semibold">{title}</p>
      <p className="text-muted mt-1 text-xs">{text}</p>
    </div>
  );
}
