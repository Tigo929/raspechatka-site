"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConsentCheckbox } from "@/components/legal/ConsentCheckbox";
import { renderDesignPreview, type DesignPreviewInput } from "@/features/configurator/renderDesignPreview";
import {
  ContactMethodTabs,
  fieldLabelClass,
  FormError,
  inputClass,
  SubmissionMeta,
  SubmissionSuccess,
} from "@/features/order/FormUI";

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
  transforms?: Record<string, { x: number; y: number; scale: number }>;
  previewDesigns?: Record<string, DesignPreviewInput | null>;
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
  const [reference, setReference] = useState<string | null>(null);
  const [deliveryNote, setDeliveryNote] = useState<string | null>(null);

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
    setDeliveryNote(null);
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
            transforms: orderDetails?.transforms,
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
        for (const side of ["front", "back"] as const) {
          const design = orderDetails?.previewDesigns?.[side];
          if (!design) continue;
          try {
            const preview = await renderDesignPreview(design);
            fd.append(`${side}Preview`, preview, `${side}-preview.png`);
          } catch {
            // Оригинал и координаты всё равно сохраняются — заказ не блокируем.
          }
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

      const d = (await res.json()) as {
        ok?: boolean;
        stored?: boolean;
        delivered?: boolean;
        reference?: string;
        error?: string;
      };
      if (!res.ok || !d.ok || !d.stored) {
        setError(d.error ?? "Ошибка отправки. Попробуйте ещё раз.");
        setStatus("error");
        return;
      }
      if (d.delivered === false) {
        setDeliveryNote(
          "Заказ сохранён, но Telegram-уведомление пока не подтверждено. Мы всё равно видим его в системе.",
        );
      }

      setReference(d.reference ?? null);
      setStatus("done");
      onSuccess?.();
    } catch {
      setError("Нет соединения. Попробуйте позже.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <SubmissionSuccess
        title="Заказ принят!"
        description={
          deliveryNote ??
          "Уведомление уже отправлено менеджеру. Мы свяжемся с вами и подтвердим детали заказа."
        }
        referenceLabel="Номер заказа"
        reference={reference}
      />
    );
  }

  const options: { id: ContactMethod; label: string }[] = [
    { id: "telegram", label: "Telegram" },
    { id: "max", label: "MAX" },
    { id: "phone", label: "Позвонить" },
  ];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* Honeypot — display:none, чтобы автозаполнение Chrome не вписало
          сюда сайт пользователя (поле "website" он заполняет охотно). */}
      <div style={{ display: "none" }} aria-hidden>
        <input
          name="hp_field"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Имя */}
      <div className="flex flex-col gap-1.5">
        <label className={fieldLabelClass}>Имя</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к вам обращаться"
          autoComplete="given-name"
          maxLength={80}
          className={inputClass}
        />
      </div>

      <ContactMethodTabs
        label="Способ связи"
        options={options}
        value={method}
        onChange={setMethod}
        columnsClass="grid-cols-3"
      />

      {/* Telegram username */}
      {method === "telegram" && (
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabelClass}>Telegram-юзернейм</label>
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
              className={`${inputClass} w-full pl-8 pr-4`}
            />
          </div>
        </div>
      )}

      {/* Телефон */}
      {(method === "max" || method === "phone") && (
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabelClass}>
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
            className={inputClass}
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

      <FormError error={error} />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={status === "sending" || !pdConsent || (hasImages && !imageConsent)}
      >
        {status === "sending" ? "Отправляем…" : submitLabel}
      </Button>
      <SubmissionMeta
        text={
          hasImages
            ? "После отправки сохраняем заказ, оригиналы и превью обеих сторон, затем уведомляем менеджера в Telegram."
            : "После отправки сохраняем заказ и сразу уведомляем менеджера в Telegram."
        }
      />
    </form>
  );
}
