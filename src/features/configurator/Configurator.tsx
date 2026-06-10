"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
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
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/interaction/Magnetic";
import { siteConfig } from "@/data/site";
import { formatPrice } from "@/lib/utils";
import {
  defaultTransforms,
  shirtColors,
  sideHints,
  sideLabels,
  type PrintSide,
  type ShirtColorId,
  type Transform,
} from "./mockups";
import { TshirtPreview } from "./TshirtPreview";

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const sides: PrintSide[] = ["front", "back"];
const BASE_PRICE = 1190;
const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

interface PrintDesign {
  imageUrl: string | null;
  fileName: string | null;
}

type PrintDesigns = Record<PrintSide, PrintDesign>;

const createEmptyPrints = (): PrintDesigns => ({
  front: { imageUrl: null, fileName: null },
  back: { imageUrl: null, fileName: null },
});

const createDefaultTransforms = (): Record<PrintSide, Transform> => ({
  front: { ...defaultTransforms.front },
  back: { ...defaultTransforms.back },
});

export function Configurator({ compact = false }: { compact?: boolean }) {
  const [colorId, setColorId] = useState<ShirtColorId>("white");
  const [side, setSide] = useState<PrintSide>("front");
  const [size, setSize] = useState("M");
  const [prints, setPrints] = useState<PrintDesigns>(createEmptyPrints);
  const [transforms, setTransforms] = useState<Record<PrintSide, Transform>>(
    createDefaultTransforms,
  );
  const [orderOpen, setOrderOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const uploadId = useId();
  const color =
    shirtColors.find((item) => item.id === colorId) ?? shirtColors[0];
  const mockup = color.views[side];
  const transform = transforms[side];
  const sideLabel = sideLabels[side];
  const activePrint = prints[side];

  const setActiveTransform = (next: Transform) => {
    setTransforms((current) => ({ ...current, [side]: next }));
  };

  // Освобождаем object URL, чтобы не текла память.
  useEffect(() => {
    const objectUrls = objectUrlsRef.current;

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
    };
  }, []);

  useEffect(() => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [side]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!allowedImageTypes.has(file.type)) {
      alert(
        "Пожалуйста, выберите PNG, JPG или WebP. SVG для печати не принимаем.",
      );
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert("Файл слишком большой. Максимум 15 МБ.");
      return;
    }
    if (activePrint.imageUrl) {
      URL.revokeObjectURL(activePrint.imageUrl);
      objectUrlsRef.current.delete(activePrint.imageUrl);
    }

    const nextUrl = URL.createObjectURL(file);
    objectUrlsRef.current.add(nextUrl);
    setPrints((current) => ({
      ...current,
      [side]: { imageUrl: nextUrl, fileName: file.name },
    }));
    setTransforms((current) => ({
      ...current,
      [side]: { ...defaultTransforms[side] },
    }));
  };

  const removeImage = () => {
    if (activePrint.imageUrl) {
      URL.revokeObjectURL(activePrint.imageUrl);
      objectUrlsRef.current.delete(activePrint.imageUrl);
    }
    setPrints((current) => ({
      ...current,
      [side]: { imageUrl: null, fileName: null },
    }));
    setTransforms((current) => ({
      ...current,
      [side]: { ...defaultTransforms[side] },
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Имя файла приходит от пользователя — кодируем, чтобы не сломать/не подменить ссылку.
  const formatPrintForMessage = (print: PrintDesign) =>
    print.fileName ? `файл «${print.fileName}»` : "без принта";
  const orderText = encodeURIComponent(
    `Здравствуйте! Хочу заказать футболку:\n• Цвет: ${color.name}\n• Размер: ${size}\n• Перед: ${formatPrintForMessage(prints.front)}\n• Спина: ${formatPrintForMessage(prints.back)}`,
  );
  const whatsappHref = `${siteConfig.social.whatsapp}?text=${orderText}`;

  return (
    <div
      className={`grid gap-8 ${compact ? "lg:grid-cols-2" : "lg:grid-cols-[1.1fr_1fr]"}`}
    >
      {/* Превью */}
      <div className="border-line to-paper-dim/50 flex items-center justify-center rounded-3xl border bg-gradient-to-b from-white p-6 sm:p-10">
        <TshirtPreview
          colorId={color.id}
          side={side}
          mockup={mockup}
          imageUrl={activePrint.imageUrl}
          transform={transform}
          onTransformChange={setActiveTransform}
        />
      </div>

      {/* Контролы */}
      <div className="flex flex-col gap-6">
        {/* Цвет */}
        <div>
          <Label>Цвет футболки</Label>
          <div className="grid grid-cols-2 gap-2.5">
            {shirtColors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColorId(c.id)}
                aria-label={c.name}
                aria-pressed={color.id === c.id}
                title={c.name}
                className={`hover:border-accent flex items-center gap-3 rounded-2xl border bg-white p-3 text-left transition-colors ${
                  color.id === c.id
                    ? "border-accent ring-accent ring-offset-paper ring-2 ring-offset-2"
                    : "border-line"
                }`}
              >
                <span
                  className="border-line flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
                  style={{ backgroundColor: c.hex }}
                >
                  {color.id === c.id && (
                    <Check
                      width={16}
                      height={16}
                      className={
                        c.id === "black" ? "text-white" : "text-accent"
                      }
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="text-ink block text-sm font-semibold">
                    {c.name}
                  </span>
                  <span className="text-muted mt-0.5 block text-xs">
                    {c.hint}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Сторона */}
        <div>
          <Label>Сторона печати</Label>
          <div className="grid grid-cols-2 gap-2.5">
            {sides.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSide(item)}
                aria-pressed={side === item}
                title={
                  prints[item].fileName
                    ? `${sideLabels[item]}: ${prints[item].fileName}`
                    : sideHints[item]
                }
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  side === item
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink hover:border-ink/40 bg-white"
                }`}
              >
                <span className="font-display block text-lg font-bold">
                  {sideLabels[item]}
                </span>
                <span
                  className={`mt-1 block text-xs ${
                    side === item ? "text-paper/60" : "text-muted"
                  }`}
                >
                  {prints[item].fileName ? "Принт добавлен" : sideHints[item]}
                </span>
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
                    : "border-line text-ink hover:border-ink/40 bg-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Загрузка */}
        <div>
          <Label>Изображение для стороны «{sideLabel}»</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFile}
            className="hidden"
            id={uploadId}
          />
          {!activePrint.imageUrl ? (
            <label
              htmlFor={uploadId}
              className="border-line text-ink-soft hover:border-accent hover:text-accent flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed bg-white px-4 py-5 text-center text-sm font-medium transition-colors"
            >
              <span className="flex items-center justify-center gap-2">
                <Upload width={18} height={18} />
                Загрузить принт для стороны «{sideLabel}»
              </span>
              <span className="text-muted text-xs font-normal">
                PNG, JPG или WebP до 15 МБ
              </span>
            </label>
          ) : (
            <div className="border-line flex items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3">
              <span className="text-ink truncate text-sm">
                {activePrint.fileName}
              </span>
              <button
                type="button"
                onClick={removeImage}
                aria-label={`Удалить принт со стороны ${sideLabel}`}
                className="text-muted hover:text-accent flex shrink-0 items-center gap-1.5 text-sm font-medium transition-colors"
              >
                <Trash2 width={16} height={16} /> Удалить
              </button>
            </div>
          )}
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {sides.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSide(item)}
                className={`min-w-0 rounded-xl border px-3 py-2 text-left transition-colors ${
                  side === item
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-muted hover:border-ink/40 bg-white"
                }`}
              >
                <span className="block font-semibold">{sideLabels[item]}</span>
                <span className="block truncate">
                  {prints[item].fileName ?? "без принта"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Масштаб */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="mb-0">Масштаб принта</Label>
            <button
              type="button"
              onClick={() => setActiveTransform({ ...defaultTransforms[side] })}
              disabled={!activePrint.imageUrl}
              className="text-muted hover:text-accent flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-40"
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
            disabled={!activePrint.imageUrl}
            onChange={(e) =>
              setActiveTransform({
                ...transform,
                scale: Number(e.target.value),
              })
            }
            className="accent-accent mt-3 w-full disabled:opacity-40"
            aria-label="Масштаб принта"
          />
          <p className="text-muted mt-2 text-xs">
            {activePrint.imageUrl
              ? `Перетащите принт в рамке «${sideLabel}», чтобы изменить положение.`
              : "Загрузите изображение, чтобы настроить положение и масштаб."}
          </p>
        </div>

        {/* Цена + заказ */}
        <div className="border-line mt-auto rounded-2xl border bg-white p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-muted text-xs">Стоимость</p>
              <p className="font-display text-ink text-2xl font-bold">
                от {formatPrice(BASE_PRICE)}
              </p>
            </div>
            <span className="text-muted flex items-center gap-1.5 text-xs">
              <ShieldCheck width={14} height={14} className="text-accent" />
              макет в подарок
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
          <Link
            href="/#zayavka"
            data-cursor="link"
            className="bg-accent-soft text-accent hover:bg-accent mt-3 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors hover:text-white"
          >
            <HelpCircle width={18} height={18} />
            Затрудняетесь? Оставьте заявку — поможем
          </Link>
        </div>
      </div>

      {orderOpen && (
        <OrderDialog
          color={color.name}
          size={size}
          prints={{
            front: prints.front.fileName,
            back: prints.back.fileName,
          }}
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
    <p className={`text-ink mb-3 text-sm font-semibold ${className}`}>
      {children}
    </p>
  );
}

function OrderDialog({
  color,
  size,
  prints,
  whatsappHref,
  onClose,
}: {
  color: string;
  size: string;
  prints: Record<PrintSide, string | null>;
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
        className="bg-paper shadow-lift w-full max-w-md rounded-t-3xl p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <motion.span
              initial={reduce ? false : { scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 360,
                damping: 14,
                delay: 0.1,
              }}
              className="bg-accent flex h-10 w-10 items-center justify-center rounded-full text-white"
            >
              <Check width={22} height={22} strokeWidth={3} />
            </motion.span>
            <h3 className="font-display text-ink text-xl font-bold">
              Ваш заказ собран
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="text-muted hover:bg-paper-dim flex h-9 w-9 items-center justify-center rounded-full"
          >
            <X width={20} height={20} />
          </button>
        </div>

        <dl className="border-line mt-4 space-y-2 rounded-2xl border bg-white p-4 text-sm">
          <Row label="Цвет" value={color} />
          <Row label="Размер" value={size} />
          <Row label="Перед" value={prints.front ?? "без принта"} />
          <Row label="Спина" value={prints.back ?? "без принта"} />
        </dl>

        <p className="text-muted mt-4 text-sm">
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

        <p className="text-muted mt-4 text-center text-xs">
          Ваше изображение остаётся на вашем устройстве и не загружается на
          сервер.
        </p>
      </motion.div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink truncate font-medium">{value}</dd>
    </div>
  );
}
