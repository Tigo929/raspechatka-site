"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Upload,
  Trash2,
  RotateCcw,
  Send,
  Phone,
  Check,
  X,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/interaction/Magnetic";
import { siteConfig } from "@/data/site";
import { formatPrice } from "@/lib/utils";
import { TshirtPreview } from "./TshirtPreview";

const colors = [
  { name: "Белый", hex: "#F4F4F1" },
  { name: "Чёрный", hex: "#16161A" },
  { name: "Серый меланж", hex: "#9CA0A6" },
  { name: "Бежевый", hex: "#D9CBB3" },
  { name: "Синий", hex: "#2C3E78" },
  { name: "Бордовый", hex: "#6E2331" },
  { name: "Зелёный", hex: "#2F5D44" },
  { name: "Горчичный", hex: "#C68A2E" },
];

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const BASE_PRICE = 1190;

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const initialTransform: Transform = { x: 0, y: 0, scale: 1 };

export function Configurator({ compact = false }: { compact?: boolean }) {
  const [color, setColor] = useState(colors[0]);
  const [size, setSize] = useState("M");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>(initialTransform);
  const [orderOpen, setOrderOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Освобождаем object URL, чтобы не текла память.
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Пожалуйста, выберите файл изображения (PNG, JPG).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert("Файл слишком большой. Максимум 15 МБ.");
      return;
    }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setTransform(initialTransform);
  };

  const removeImage = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setFileName(null);
    setTransform(initialTransform);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Имя файла приходит от пользователя — кодируем, чтобы не сломать/не подменить ссылку.
  const printPart = fileName ? `загружу файл «${fileName}»` : "обсудим";
  const orderText = encodeURIComponent(
    `Здравствуйте! Хочу заказать футболку:\n• Цвет: ${color.name}\n• Размер: ${size}\n• Принт: ${printPart}`,
  );
  const whatsappHref = `${siteConfig.social.whatsapp}?text=${orderText}`;

  return (
    <div
      className={`grid gap-8 ${compact ? "lg:grid-cols-2" : "lg:grid-cols-[1.1fr_1fr]"}`}
    >
      {/* Превью */}
      <div className="flex items-center justify-center rounded-3xl border border-line bg-gradient-to-b from-white to-paper-dim/50 p-6 sm:p-10">
        <TshirtPreview
          color={color.hex}
          imageUrl={imageUrl}
          transform={transform}
          onTransformChange={setTransform}
        />
      </div>

      {/* Контролы */}
      <div className="flex flex-col gap-6">
        {/* Цвет */}
        <div>
          <Label>Цвет футболки</Label>
          <div className="flex flex-wrap gap-2.5">
            {colors.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c.name}
                aria-pressed={color.hex === c.hex}
                title={c.name}
                className={`relative h-10 w-10 rounded-full border transition-transform hover:scale-110 ${
                  color.hex === c.hex
                    ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-paper"
                    : "border-line"
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {color.hex === c.hex && (
                  <Check
                    width={16}
                    height={16}
                    className="absolute inset-0 m-auto text-accent"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Размер */}
        <div>
          <Label>Размер</Label>
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
                    : "border-line bg-white text-ink hover:border-ink/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Загрузка */}
        <div>
          <Label>Ваше изображение</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFile}
            className="hidden"
            id="print-upload"
          />
          {!imageUrl ? (
            <label
              htmlFor="print-upload"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white px-4 py-5 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent"
            >
              <Upload width={18} height={18} />
              Загрузить принт (PNG, JPG до 15 МБ)
            </label>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
              <span className="truncate text-sm text-ink">{fileName}</span>
              <button
                type="button"
                onClick={removeImage}
                className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-accent"
              >
                <Trash2 width={16} height={16} /> Удалить
              </button>
            </div>
          )}
        </div>

        {/* Масштаб */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="mb-0">Масштаб принта</Label>
            <button
              type="button"
              onClick={() => setTransform(initialTransform)}
              disabled={!imageUrl}
              className="flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-accent disabled:opacity-40"
            >
              <RotateCcw width={14} height={14} /> Сбросить
            </button>
          </div>
          <input
            type="range"
            min={0.4}
            max={1.8}
            step={0.01}
            value={transform.scale}
            disabled={!imageUrl}
            onChange={(e) =>
              setTransform((t) => ({ ...t, scale: Number(e.target.value) }))
            }
            className="mt-3 w-full accent-accent disabled:opacity-40"
            aria-label="Масштаб принта"
          />
          <p className="mt-2 text-xs text-muted">
            {imageUrl
              ? "Перетащите принт в зоне печати, чтобы изменить положение."
              : "Загрузите изображение, чтобы настроить положение и масштаб."}
          </p>
        </div>

        {/* Цена + заказ */}
        <div className="mt-auto rounded-2xl border border-line bg-white p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted">Стоимость</p>
              <p className="font-display text-2xl font-bold text-ink">
                от {formatPrice(BASE_PRICE)}
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <ShieldCheck width={14} height={14} className="text-accent" />
              макет бесплатно
            </span>
          </div>
          {/* Заказ запускается ТОЛЬКО по этой кнопке */}
          <Magnetic className="mt-4 block w-full" strength={0.2}>
            <Button
              className="w-full"
              size="lg"
              data-cursor="cta"
              data-cursor-label="Заказать"
              onClick={() => setOrderOpen(true)}
            >
              Оформить заказ
            </Button>
          </Magnetic>
        </div>
      </div>

      {orderOpen && (
        <OrderDialog
          color={color.name}
          size={size}
          fileName={fileName}
          whatsappHref={whatsappHref}
          onClose={() => setOrderOpen(false)}
        />
      )}
    </div>
  );
}

function Label({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`mb-3 text-sm font-semibold text-ink ${className}`}
    >
      {children}
    </p>
  );
}

function OrderDialog({
  color,
  size,
  fileName,
  whatsappHref,
  onClose,
}: {
  color: string;
  size: string;
  fileName: string | null;
  whatsappHref: string;
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
      className="fixed inset-0 z-[60] flex items-end justify-center bg-midnight/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Оформление заказа"
      onClick={onClose}
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="w-full max-w-md rounded-t-3xl bg-paper p-6 shadow-lift sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <motion.span
              initial={reduce ? false : { scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 14, delay: 0.1 }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white"
            >
              <Check width={22} height={22} strokeWidth={3} />
            </motion.span>
            <h3 className="font-display text-xl font-bold text-ink">
              Ваш заказ собран
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-paper-dim"
          >
            <X width={20} height={20} />
          </button>
        </div>

        <dl className="mt-4 space-y-2 rounded-2xl border border-line bg-white p-4 text-sm">
          <Row label="Цвет" value={color} />
          <Row label="Размер" value={size} />
          <Row label="Принт" value={fileName ?? "обсудим с дизайнером"} />
        </dl>

        <p className="mt-4 text-sm text-muted">
          Отправьте заявку в мессенджер — менеджер подтвердит детали, поможет с
          макетом и назовёт точный срок. Это ни к чему не обязывает.
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <Button href={whatsappHref} external size="lg" className="w-full">
            <Phone width={18} height={18} /> Отправить в WhatsApp
          </Button>
          <Button
            href={siteConfig.social.telegram}
            external
            variant="secondary"
            size="lg"
            className="w-full"
          >
            <Send width={18} height={18} /> Написать в Telegram
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          Ваше изображение остаётся на вашем устройстве и не загружается на сервер.
        </p>
      </motion.div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate font-medium text-ink">{value}</dd>
    </div>
  );
}
