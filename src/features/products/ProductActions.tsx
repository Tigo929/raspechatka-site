"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OrderForm } from "@/features/order/OrderForm";
import type { Product } from "@/types";

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

export function ProductActions({ product }: { product: Product }) {
  const [size, setSize] = useState("M");
  const [colorIdx, setColorIdx] = useState(0);
  const [orderOpen, setOrderOpen] = useState(false);
  const color = product.colors[colorIdx];

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
        <Button
          size="lg"
          className="flex-1"
          onClick={() => setOrderOpen(true)}
          data-cursor="cta"
        >
          Оформить заказ
        </Button>
        <Button href="/configurator" variant="secondary" size="lg" className="flex-1">
          <Sparkles width={18} height={18} /> Свой принт
        </Button>
      </div>

      <p className="text-muted text-sm">
        Нажмите «Оформить заказ» — менеджер подтвердит детали и поможет с макетом. Ни к чему не обязывает до согласования.
      </p>

      {orderOpen && (
        <ProductOrderDialog
          product={product}
          color={color.name}
          size={size}
          onClose={() => setOrderOpen(false)}
        />
      )}
    </div>
  );
}

function ProductOrderDialog({
  product,
  color,
  size,
  onClose,
}: {
  product: Product;
  color: string;
  size: string;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="bg-midnight/50 fixed inset-0 z-[60] flex items-end justify-center p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Оформление заказа"
      onClick={onClose}
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="bg-paper shadow-lift w-full max-w-md overflow-y-auto rounded-t-3xl p-6 sm:max-h-[90vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-ink text-xl font-bold">Оформление заказа</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="text-muted hover:bg-paper-dim flex h-9 w-9 items-center justify-center rounded-full"
          >
            <X width={20} height={20} />
          </button>
        </div>

        <dl className="border-line mb-5 space-y-2 rounded-2xl border bg-white p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Товар</dt>
            <dd className="text-ink truncate font-medium">{product.title}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Цвет</dt>
            <dd className="text-ink font-medium">{color}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Размер</dt>
            <dd className="text-ink font-medium">{size}</dd>
          </div>
        </dl>

        <OrderForm
          orderDetails={{ productName: product.title, color, size }}
          onSuccess={() => setTimeout(onClose, 2000)}
        />
      </motion.div>
    </div>
  );
}
