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
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-soft transition-shadow duration-300 hover:shadow-lift"
      >
      <div className="relative aspect-[4/5] overflow-hidden bg-paper-dim">
        <Image
          src={product.image}
          alt={product.imageAlt}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw"
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/90 px-3 py-1 text-xs font-semibold text-paper backdrop-blur">
            {product.badge}
          </span>
        )}
        <span className="absolute right-3 top-3 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 shadow-soft transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
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
        <h3 className="mt-2 font-display text-lg font-bold text-ink">
          {product.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted">
          {product.excerpt}
        </p>
        <div className="mt-4 flex items-end justify-between pt-2">
          <div>
            <span className="text-xs text-muted">от</span>
            <p className="font-display text-xl font-bold text-ink">
              {formatPrice(product.priceFrom)}
            </p>
          </div>
          <span className="rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink transition-colors group-hover:bg-accent group-hover:text-white">
            Подробнее
          </span>
        </div>
      </div>
      </Link>
    </Tilt>
  );
}
