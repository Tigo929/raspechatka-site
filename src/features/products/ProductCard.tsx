import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Stars } from "@/components/ui/Stars";
import { Tilt } from "@/components/interaction/Tilt";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Карточка товара. Вся карточка — ссылка на страницу товара (открывается
 * сверху). Оформление заказа НЕ запускается отсюда — только явной кнопкой на
 * странице товара. Никаких вложенных интерактивных элементов.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  return (
    <Tilt max={7}>
      <Link
        href={`/product/${product.slug}`}
        data-cursor="view"
        className="group border-line shadow-soft hover:shadow-lift flex h-full flex-col overflow-hidden rounded-3xl border bg-white transition-shadow duration-300"
      >
        <div className="bg-paper-dim relative aspect-[4/5] overflow-hidden">
          <Image
            src={product.image}
            alt={product.imageAlt}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw"
            priority={priority}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {product.badge && (
            <span className="bg-ink/90 text-paper absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur">
              {product.badge}
            </span>
          )}
          <span className="text-ink shadow-soft absolute top-3 right-3 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white/90 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight width={18} height={18} />
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center gap-2 text-sm">
            <Stars value={product.rating} size={14} />
            <span className="text-muted">{product.rating}</span>
            <span className="text-line">·</span>
            <span className="text-muted">{product.reviewsCount} отзывов</span>
          </div>
          <h3 className="font-display text-ink mt-2 text-lg font-bold">
            {product.title}
          </h3>
          <p className="text-muted mt-1.5 line-clamp-2 text-sm">
            {product.excerpt}
          </p>
          <div className="mt-4 flex items-end justify-between pt-2">
            <div>
              <span className="text-muted text-xs">от</span>
              <p className="font-display text-ink text-xl font-bold">
                {formatPrice(product.priceFrom)}
              </p>
            </div>
            <span className="bg-paper text-ink group-hover:bg-accent rounded-full px-4 py-2 text-sm font-semibold transition-colors group-hover:text-white">
              Подробнее
            </span>
          </div>
        </div>
      </Link>
    </Tilt>
  );
}
