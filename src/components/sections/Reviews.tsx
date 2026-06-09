import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PlatformRatings } from "@/components/sections/PlatformRatings";
import { ReviewsCarousel } from "@/components/sections/ReviewsCarousel";
import { getPositiveReviews } from "@/data/reviews";

export function Reviews() {
  const positive = getPositiveReviews();

  return (
    <Section id="reviews" className="bg-paper-dim/60">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          align="left"
          eyebrow="Отзывы"
          title="Что говорят наши клиенты"
          subtitle="Реальные отзывы с площадок, где нас уже выбрали."
          className="max-w-xl"
        />
        <Reveal>
          <PlatformRatings />
        </Reveal>
      </div>

      <div className="mt-12">
        <ReviewsCarousel reviews={positive} />
      </div>
    </Section>
  );
}
