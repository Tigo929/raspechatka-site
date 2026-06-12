"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConsentCheckbox } from "@/components/legal/ConsentCheckbox";
import { renderDesignPreview, type DesignPreviewInput } from "@/features/configurator/renderDesignPreview";
import { fieldLabelClass, FormError, inputClass, SubmissionSuccess } from "@/features/order/FormUI";

export interface ConfiguratorOrderDetails {
  product?: string;
  color?: string;
  size?: string;
  /** Blob URL загруженных изображений (только браузер) */
  imageUrls?: { front?: string | null; back?: string | null };
  previewDesigns?: { front?: DesignPreviewInput | null; back?: DesignPreviewInput | null };
}

interface Props {
  orderDetails?: ConfiguratorOrderDetails;
  onSuccess?: () => void;
}

type Status = "idle" | "sending" | "done" | "error";

export function ConfiguratorOrderForm({ orderDetails, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [pdConsent, setPdConsent] = useState(false);
  const [imageConsent, setImageConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [deliveryNote, setDeliveryNote] = useState<string | null>(null);

  const hasImages = Boolean(orderDetails?.imageUrls?.front || orderDetails?.imageUrls?.back);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim().length < 2) { setError("Укажите ваше имя."); return; }
    if (!telegram.trim() && phone.trim().length < 6) {
      setError("Укажите корректный телефон или Telegram-юзернейм."); return;
    }
    if (!pdConsent) { setError("Необходимо согласие на обработку персональных данных."); return; }
    if (hasImages && !imageConsent) { setError("Подтвердите права на загружаемое изображение."); return; }

    setError(null);
    setDeliveryNote(null);
    setStatus("sending");

    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("phone", phone.trim());
      fd.append("telegram", telegram.trim().replace(/^@/, ""));
      fd.append("comment", comment.trim());
      fd.append("product", orderDetails?.product ?? "");
      fd.append("size", orderDetails?.size ?? "");
      fd.append("color", orderDetails?.color ?? "");
      fd.append("website", website);
      fd.append("personalDataConsent", String(pdConsent));
      fd.append("imageRightsConsent", String(imageConsent));
      fd.append("consentAcceptedAt", new Date().toISOString());

      // Оригинальные файлы изображений
      const frontUrl = orderDetails?.imageUrls?.front;
      const backUrl = orderDetails?.imageUrls?.back;

      if (frontUrl) {
        const blob = await fetch(frontUrl).then((r) => r.blob());
        fd.append("frontImage", blob, `front.${blob.type.split("/")[1] || "png"}`);
      }
      if (backUrl) {
        const blob = await fetch(backUrl).then((r) => r.blob());
        fd.append("backImage", blob, `back.${blob.type.split("/")[1] || "png"}`);
      }

      // Превью — рендерим с mockup + принт + позиция
      const previewDesigns = orderDetails?.previewDesigns;
      const previewSources = [
        previewDesigns?.front,
        previewDesigns?.back,
      ].filter((d): d is DesignPreviewInput => Boolean(d));

      if (previewSources.length > 0) {
        try {
          // Рендерим все превью параллельно, берём первое удачное
          const [firstPreview] = await Promise.all(
            previewSources.map((d) => renderDesignPreview(d)),
          );
          fd.append("previewImage", firstPreview, "preview.png");
        } catch {
          // Превью не критично — заказ всё равно отправляем
        }
      }

      const res = await fetch("/api/orders/constructor", { method: "POST", body: fd });
      const data = (await res.json()) as {
        ok?: boolean;
        stored?: boolean;
        delivered?: boolean;
        reference?: string;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.stored) {
        setError(data.error ?? "Ошибка отправки. Попробуйте ещё раз.");
        setStatus("error");
        return;
      }

      if (data.delivered === false) {
        setDeliveryNote(
          "Заказ сохранён, менеджер увидит его в системе. Telegram-уведомление подтвердится чуть позже.",
        );
      }
      setReference(data.reference ?? null);
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
        title="Заявка отправлена!"
        description={
          deliveryNote ??
          "Менеджер уже видит ваш заказ и фотографии. Мы свяжемся с вами и подтвердим детали."
        }
        referenceLabel="Номер заказа"
        reference={reference}
      />
    );
  }

  const sending = status === "sending";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* Honeypot — скрытое поле для отсева ботов */}
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
        <label className={fieldLabelClass}>Имя</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к вам обращаться"
          autoComplete="given-name"
          maxLength={80}
          disabled={sending}
          className={inputClass}
        />
      </div>

      {/* Телефон */}
      <div className="flex flex-col gap-1.5">
        <label className={fieldLabelClass}>
          Телефон <span className="text-muted font-normal">(обязателен, если нет Telegram)</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 (___) ___-__-__"
          autoComplete="tel"
          maxLength={40}
          disabled={sending}
          className={inputClass}
        />
      </div>

      {/* Telegram */}
      <div className="flex flex-col gap-1.5">
        <label className={fieldLabelClass}>
          Telegram <span className="text-muted font-normal">(необязательно)</span>
        </label>
        <div className="relative">
          <span className="text-muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm">
            @
          </span>
          <input
            type="text"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value.replace(/^@/, ""))}
            placeholder="username"
            autoComplete="off"
            maxLength={80}
            disabled={sending}
            className={`${inputClass} pl-8`}
          />
        </div>
      </div>

      {/* Комментарий */}
      <div className="flex flex-col gap-1.5">
        <label className={fieldLabelClass}>
          Комментарий <span className="text-muted font-normal">(необязательно)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Пожелания по принту, срочность, доп. вопросы…"
          maxLength={500}
          rows={3}
          disabled={sending}
          className={`${inputClass} resize-none`}
        />
      </div>

      <ConsentCheckbox
        id="cfg-pd-consent"
        checked={pdConsent}
        onChange={setPdConsent}
        type="personal-data"
      />

      {hasImages && (
        <ConsentCheckbox
          id="cfg-image-consent"
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
        disabled={sending || !pdConsent || (hasImages && !imageConsent)}
      >
        {sending ? "Отправляем…" : "Отправить заказ"}
      </Button>
    </form>
  );
}
