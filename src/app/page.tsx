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
      <LeadCta />
      <Faq />
      <SeoText />
      <Contacts />
      <FinalCta />
    </>
  );
}
