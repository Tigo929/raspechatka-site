"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConsentCheckbox } from "@/components/legal/ConsentCheckbox";

type ContactMethod = "telegram" | "max" | "phone";
type Status = "idle" | "sending" | "done" | "error";

export interface OrderDetails {
  productName?: string;
  color?: string;
  size?: string;
  /** Имена файлов (для отображения в сводке) */
  prints?: Record<string, string | null>;
  /** Blob URL изображений из конфигуратора (только браузер) */
  imageUrls?: Record<string, string | null>;
}

interface OrderFormProps {
  orderDetails?: OrderDetails;
  onSuccess?: () => void;
  submitLabel?: string;
}

function getExtFromBlob(blob: Blob): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[blob.type] ?? "png";
}

export function OrderForm({
  orderDetails,
  onSuccess,
  submitLabel = "Оформить заказ",
}: OrderFormProps) {
  const [name, setName] = useState("");
  const [method, setMethod] = useState<ContactMethod>("telegram");
  const [telegramUser, setTelegramUser] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [pdConsent, setPdConsent] = useState(false);
  const [imageConsent, setImageConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const hasImages = Boolean(
    orderDetails?.imageUrls?.front || orderDetails?.imageUrls?.back,
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) { setError("Укажите ваше имя."); return; }
    if (method === "telegram") {
      if (!telegramUser.trim()) { setError("Укажите ваш Telegram-юзернейм."); return; }
    } else {
      if (phone.trim().length < 6) { setError("Укажите корректный номер телефона."); return; }
    }
    if (!pdConsent) {
      setError("Необходимо согласие на обработку персональных данных.");
      return;
    }
    if (hasImages && !imageConsent) {
      setError("Необходимо подтвердить права на загружаемое изображение.");
      return;
    }

    setError(null);
    setStatus("sending");

    const contact =
      method === "telegram"
        ? { method: "telegram", value: telegramUser.trim().replace(/^@/, "") }
        : { method, value: phone.trim() };

    const frontUrl = orderDetails?.imageUrls?.front ?? null;
    const backUrl = orderDetails?.imageUrls?.back ?? null;

    try {
      let res: Response;

      if (hasImages) {
        // ── FormData: прикладываем изображения как файлы ──────────────────
        const fd = new FormData();

        const consentMeta = {
          personalDataConsent: pdConsent,
          imageRightsConsent: imageConsent,
          consentAcceptedAt: new Date().toISOString(),
        };
        const orderPayload = {
          name: name.trim(),
          contact,
          orderDetails: {
            color: orderDetails?.color,
            size: orderDetails?.size,
            prints: orderDetails?.prints,
          },
          website,
          ...consentMeta,
        };
        fd.append("data", JSON.stringify(orderPayload));

        if (frontUrl) {
          const blob = await fetch(frontUrl).then((r) => r.blob());
          const ext = getExtFromBlob(blob);
          fd.append("frontImage", blob, `front.${ext}`);
        }
        if (backUrl) {
          const blob = await fetch(backUrl).then((r) => r.blob());
          const ext = getExtFromBlob(blob);
          fd.append("backImage", blob, `back.${ext}`);
        }

        res = await fetch("/api/order", { method: "POST", body: fd });
      } else {
        // ── JSON: карточки товаров и прочие случаи без изображений ────────
        res = await fetch("/api/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            contact,
            orderDetails,
            website,
            personalDataConsent: pdConsent,
            imageRightsConsent: imageConsent,
            consentAcceptedAt: new Date().toISOString(),
          }),
        });
      }

      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setError(d.error ?? "Ошибка отправки. Попробуйте ещё раз.");
        setStatus("error");
        return;
      }

      setStatus("done");
      onSuccess?.();
    } catch {
      setError("Нет соединения. Попробуйте позже.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="py-4 text-center">
        <span className="bg-accent mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white">
          <Check width={28} height={28} strokeWidth={3} />
        </span>
        <h3 className="font-display text-ink mt-4 text-xl font-bold">Заявка принята!</h3>
        <p className="text-muted mx-auto mt-2 max-w-sm text-sm">
          Свяжемся с вами в ближайшее рабочее время.
        </p>
      </div>
    );
  }

  const options: { id: ContactMethod; label: string }[] = [
    { id: "telegram", label: "Telegram" },
    { id: "max", label: "MAX" },
    { id: "phone", label: "Позвонить" },
  ];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* Honeypot */}
      <div className="sr-only" aria-hidden>
        <input
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Имя */}
      <div className="flex flex-col gap-1.5">
        <label className="text-ink text-sm font-semibold">Имя</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к вам обращаться"
          autoComplete="given-name"
          maxLength={80}
          className="border-line focus:border-accent bg-paper text-ink h-12 rounded-2xl border px-4 outline-none transition-colors"
        />
      </div>

      {/* Способ связи */}
      <div className="flex flex-col gap-1.5">
        <span className="text-ink text-sm font-semibold">Способ связи</span>
        <div className="border-line grid grid-cols-3 gap-1 rounded-2xl border bg-white p-1">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMethod(opt.id)}
              className={`rounded-xl py-2 text-sm font-semibold transition-colors ${
                method === opt.id ? "bg-ink text-paper" : "text-muted hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Telegram username */}
      {method === "telegram" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-ink text-sm font-semibold">Ваш юзернейм</label>
          <div className="relative">
            <span className="text-muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm">
              @
            </span>
            <input
              type="text"
              value={telegramUser}
              onChange={(e) => setTelegramUser(e.target.value.replace(/^@/, ""))}
              placeholder="username"
              autoComplete="off"
              maxLength={80}
              className="border-line focus:border-accent bg-paper text-ink h-12 w-full rounded-2xl border pl-8 pr-4 outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* Телефон */}
      {(method === "max" || method === "phone") && (
        <div className="flex flex-col gap-1.5">
          <label className="text-ink text-sm font-semibold">
            Номер телефона
            {method === "max" && (
              <span className="text-muted font-normal"> (MAX)</span>
            )}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (___) ___-__-__"
            autoComplete="tel"
            maxLength={40}
            className="border-line focus:border-accent bg-paper text-ink h-12 rounded-2xl border px-4 outline-none transition-colors"
          />
        </div>
      )}

      {/* Чекбокс: согласие на обработку персональных данных */}
      <ConsentCheckbox
        id="order-pd-consent"
        checked={pdConsent}
        onChange={setPdConsent}
        type="personal-data"
      />

      {/* Чекбокс: права на изображение — показываем только если есть изображения */}
      {hasImages && (
        <ConsentCheckbox
          id="order-image-consent"
          checked={imageConsent}
          onChange={setImageConsent}
          type="image-rights"
        />
      )}

      {error && (
        <p className="text-accent text-sm" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={status === "sending" || !pdConsent || (hasImages && !imageConsent)}
      >
        {status === "sending" ? "Отправляем…" : submitLabel}
      </Button>

    </form>
  );
}
