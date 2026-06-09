import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Check, Truck, ShieldCheck, Clock } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Reveal } from "@/components/ui/Reveal";
import { Stars } from "@/components/ui/Stars";
import { ProductActions } from "@/features/products/ProductActions";
import { ProductCard } from "@/features/products/ProductCard";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getProduct, products } from "@/data/products";
import { formatPrice } from "@/lib/utils";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return buildMetadata({
    title: `${product.title} — футболка с печатью`,
    description: product.excerpt,
    path: `/product/${product.slug}`,
    images: [product.image],
    keywords: [product.title, "футболка с печатью", "купить футболку"],
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const related = products.filter((p) => p.slug !== product.slug).slice(0, 4);

  const specs = [
    { icon: Clock, label: "Срок", value: "от 1 дня" },
    { icon: Truck, label: "Доставка", value: "по всей России" },
    { icon: ShieldCheck, label: "Гарантия", value: "на качество печати" },
  ];

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Главная", path: "/" },
          { name: "Каталог", path: "/catalog" },
          { name: product.title, path: `/product/${product.slug}` },
        ])}
      />

      <Section className="pt-10 sm:pt-14">
        <Breadcrumbs
          items={[
            { name: "Главная", href: "/" },
            { name: "Каталог", href: "/catalog" },
            { name: product.title, href: `/product/${product.slug}` },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Изображение */}
          <Reveal>
            <div className="bg-paper-dim shadow-soft relative aspect-[4/5] overflow-hidden rounded-3xl">
              <Image
                src={product.image}
                alt={product.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              {product.badge && (
                <span className="bg-ink/90 text-paper absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur">
                  {product.badge}
                </span>
              )}
            </div>
          </Reveal>

          {/* Информация */}
          <Reveal delay={0.08}>
            <div>
              <h1 className="font-display text-ink text-3xl font-extrabold sm:text-4xl">
                {product.title}
              </h1>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Stars value={product.rating} />
                <span className="text-ink font-medium">{product.rating}</span>
                <span className="text-line">·</span>
                <span className="text-muted">
                  {product.reviewsCount} отзывов
                </span>
              </div>

              <p className="text-ink-soft mt-5 text-base leading-relaxed">
                {product.description}
              </p>

              <ul className="mt-5 space-y-2 text-sm">
                <li className="text-ink-soft flex items-center gap-2">
                  <Check width={16} height={16} className="text-accent" />
                  Материал: {product.material}
                </li>
                <li className="text-ink-soft flex items-center gap-2">
                  <Check width={16} height={16} className="text-accent" />
                  Печать: {product.printMethod}
                </li>
              </ul>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-muted text-sm">Цена</span>
                <span className="font-display text-ink text-3xl font-extrabold">
                  от {formatPrice(product.priceFrom)}
                </span>
              </div>

              <div className="mt-6">
                <ProductActions product={product} />
              </div>

              <div className="border-line mt-8 grid grid-cols-3 gap-3 border-t pt-6">
                {specs.map((s) => (
                  <div key={s.label} className="flex flex-col gap-1.5">
                    <s.icon width={20} height={20} className="text-accent" />
                    <p className="text-muted text-xs">{s.label}</p>
                    <p className="text-ink text-sm font-semibold">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Похожие товары */}
      <Section className="py-12 sm:py-16">
        <Reveal>
          <h2 className="font-display text-ink text-2xl font-bold sm:text-3xl">
            Похожие модели
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 4) * 0.05}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </Section>

      <Faq />
      <FinalCta />
    </>
  );
}
