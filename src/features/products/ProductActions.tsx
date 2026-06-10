"use client";

import { useState } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/data/site";
import type { Product } from "@/types";

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

/**
 * Действия на странице товара. Заказ запускается ТОЛЬКО по явной кнопке
 * «Заказать» — переход на товар сам по себе ничего не оформляет.
 */
export function ProductActions({ product }: { product: Product }) {
  const [size, setSize] = useState("M");
  const [colorIdx, setColorIdx] = useState(0);
  const color = product.colors[colorIdx];

  const orderText = encodeURIComponent(
    `Здравствуйте! Хочу заказать «${product.title}»:\n• Цвет: ${color.name}\n• Размер: ${size}`,
  );
  const whatsappHref = `${siteConfig.social.whatsapp}?text=${orderText}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Цвета */}
      <div>
        <p className="text-ink mb-3 text-sm font-semibold">
          Цвет: <span className="text-muted">{color.name}</span>
        </p>
        <div className="flex flex-wrap gap-2.5">
          {product.colors.map((c, i) => (
            <button
              key={`${c.name}-${c.hex}`}
              type="button"
              onClick={() => setColorIdx(i)}
              aria-label={c.name}
              aria-pressed={colorIdx === i}
              title={c.name}
              className={`h-9 w-9 rounded-full border transition-transform hover:scale-110 ${
                colorIdx === i
                  ? "border-accent ring-accent ring-offset-paper ring-2 ring-offset-2"
                  : "border-line"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      {/* Размеры */}
      <div>
        <p className="text-ink mb-3 text-sm font-semibold">Размер</p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              aria-pressed={size === s}
              className={`h-10 min-w-12 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                size === s
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink hover:border-ink/40 bg-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button href={whatsappHref} external size="lg" className="flex-1">
          <MessageCircle width={18} height={18} /> Заказать
        </Button>
        <Button
          href="/configurator"
          variant="secondary"
          size="lg"
          className="flex-1"
        >
          <Sparkles width={18} height={18} /> Свой принт
        </Button>
      </div>
      <p className="text-muted text-sm">
        Нажмите «Заказать» — менеджер подтвердит детали и поможет с макетом.
        Заказ ни к чему не обязывает до согласования.
      </p>
    </div>
  );
}
