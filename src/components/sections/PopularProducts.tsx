import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/features/products/ProductCard";
import { getPopularProducts } from "@/lib/product-repository";

export async function PopularProducts() {
  const popular = await getPopularProducts(4);

  return (
    <Section id="popular">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          align="left"
          eyebrow="Хиты продаж"
          title="Популярные модели"
          subtitle="Выбор тысяч клиентов — проверенные ткани и кройка."
          className="max-w-2xl"
        />
        <Reveal className="hidden sm:block">
          <Button href="/catalog" variant="ghost">
            Весь каталог
          </Button>
        </Reveal>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {popular.map((p, i) => (
          <Reveal key={p.slug} delay={i * 0.05}>
            <ProductCard product={p} priority={i === 0} />
          </Reveal>
        ))}
      </div>

      <div className="mt-10 flex justify-center sm:hidden">
        <Button href="/catalog" variant="ghost" className="w-full">
          Весь каталог
        </Button>
      </div>
    </Section>
  );
}
