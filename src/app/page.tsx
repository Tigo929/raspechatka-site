import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { TrustBar } from "@/components/sections/TrustBar";
import { Benefits } from "@/components/sections/Benefits";
import { Categories } from "@/components/sections/Categories";
import { PopularProducts } from "@/components/sections/PopularProducts";
import { ConfiguratorSection } from "@/components/sections/ConfiguratorSection";
import { UseCases } from "@/components/sections/UseCases";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Pricing } from "@/components/sections/Pricing";
import { Reviews } from "@/components/sections/Reviews";
import { Guarantees } from "@/components/sections/Guarantees";
import { LeadCta } from "@/components/sections/LeadCta";
import { Faq } from "@/components/sections/Faq";
import { SeoText } from "@/components/sections/SeoText";
import { Contacts } from "@/components/sections/Contacts";
import { FinalCta } from "@/components/sections/FinalCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqJsonLd, reviewsJsonLd } from "@/lib/jsonld";
import { getPublicFaq, getPublicReviews } from "@/lib/content-repository";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Печать на футболках на заказ — с принтом, фото и логотипом",
  description:
    "Студия премиальной печати на футболках: с принтом, фото, надписью или логотипом. Без минимального тиража, бесплатный макет, печать от 1 дня. Доставка по России.",
  path: "/",
  keywords: [
    "футболка с принтом",
    "печать на футболках",
    "футболка с фото",
    "футболка на заказ",
    "мерч на заказ",
    "корпоративные футболки",
  ],
});

export default async function HomePage() {
  const [publicFaq, publicReviews] = await Promise.all([getPublicFaq(), getPublicReviews()]);
  return (
    <>
      <JsonLd data={faqJsonLd(publicFaq)} />
      <JsonLd data={reviewsJsonLd(publicReviews)} />
      {/* 1. Хук — кто мы и что делаем */}
      <Hero />
      {/* 2. Быстрые доверительные сигналы */}
      <TrustBar />
      {/* 3. Что заказать — пользователь ориентируется */}
      <Categories />
      {/* 4. Конкретные товары — пощупать руками */}
      <PopularProducts />
      {/* 5. Сценарии — «это для меня» */}
      <UseCases />
      {/* 6. Процесс — снимаем неопределённость */}
      <HowItWorks />
      {/* 7. Преимущества — почему именно мы */}
      <Benefits />
      {/* 8. Социальное доказательство */}
      <Reviews />
      {/* 9. Гарантии — снимаем страх */}
      <Guarantees />
      {/* 10. Цены — теперь готов воспринять */}
      <Pricing />
      {/* 11. Конверсия — оставить заявку */}
      <LeadCta />
      {/* 12. FAQ — последние возражения */}
      <Faq />
      {/* 13. Конструктор — исследователям */}
      <ConfiguratorSection />
      {/* 14-16. SEO, контакты, финальный CTA */}
      <SeoText />
      <Contacts />
      <FinalCta />
    </>
  );
}
