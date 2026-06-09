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
import { Faq } from "@/components/sections/Faq";
import { SeoText } from "@/components/sections/SeoText";
import { FinalCta } from "@/components/sections/FinalCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqJsonLd, reviewsJsonLd } from "@/lib/jsonld";
import { faq } from "@/data/faq";
import { reviews } from "@/data/reviews";
import { buildMetadata } from "@/lib/seo";

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

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faq)} />
      <JsonLd data={reviewsJsonLd(reviews)} />
      <Hero />
      <TrustBar />
      <Benefits />
      <Categories />
      <PopularProducts />
      <ConfiguratorSection />
      <UseCases />
      <HowItWorks />
      <Pricing />
      <Reviews />
      <Guarantees />
      <Faq />
      <SeoText />
      <FinalCta />
    </>
  );
}
