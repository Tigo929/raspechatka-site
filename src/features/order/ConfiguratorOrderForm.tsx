"use client";

import { useEffect, useRef, useState } from "react";
import { ymReachGoal } from "@/lib/analytics";
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
  const startedRef = useRef(false);
  const [idempotencyKey] = useState<string>(() => crypto.randomUUID());

  useEffect(() => { ymReachGoal("order_form_open"); }, []);
  const [quantity, setQuantity] = useState(1);
  const [website, setWebsite] = useState("");
  const [pdConsent, setPdConsent] = useState(false);
  const [imageConsent, setImageConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

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
      fd.append("hp_field", website);
      fd.append("quantity", String(quantity));
      fd.append("personalDataConsent", String(pdConsent));
      fd.append("imageRightsConsent", String(imageConsent));
      fd.append("consentAcceptedAt", new Date().toISOString());
      fd.append("idempotencyKey", idempotencyKey);

      // Параллельно: оригиналы + рендер превью обеих сторон
      const frontUrl = orderDetails?.imageUrls?.front ?? null;
      const backUrl = orderDetails?.imageUrls?.back ?? null;
      const previewDesigns = orderDetails?.previewDesigns;

      const [frontBlob, backBlob, frontPreview, backPreview] = await Promise.all([
        frontUrl ? fetch(frontUrl).then((r) => r.blob()) : null,
        backUrl ? fetch(backUrl).then((r) => r.blob()) : null,
        previewDesigns?.front
          ? renderDesignPreview(previewDesigns.front).catch(() => null)
          : null,
        previewDesigns?.back
          ? renderDesignPreview(previewDesigns.back).catch(() => null)
          : null,
      ]);

      if (frontBlob) fd.append("frontImage", frontBlob, `front.${frontBlob.type.split("/")[1] || "png"}`);
      if (backBlob) fd.append("backImage", backBlob, `back.${backBlob.type.split("/")[1] || "png"}`);
      if (frontPreview) fd.append("frontPreview", frontPreview, "front-preview.png");
      if (backPreview) fd.append("backPreview", backPreview, "back-preview.png");

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
        ymReachGoal("order_submit_error");
        return;
      }

      // delivery is always async now — no separate note needed
      if (data.reference) {
        try { localStorage.setItem("raspechatka_last_reference", data.reference); } catch {}
      }
      setReference(data.reference ?? null);
      setStatus("done");
      ymReachGoal("configurator_submit_success");
    } catch {
      setError("Нет соединения. Попробуйте позже.");
      setStatus("error");
      ymReachGoal("order_submit_error");
    }
  };

  if (status === "done") {
    return (
      <SubmissionSuccess
        title="Заявка отправлена!"
        description="Менеджер уже видит ваш заказ и фотографии. Мы свяжемся с вами и подтвердим детали."
        referenceLabel="Номер заказа"
        reference={reference}
        onDone={onSuccess}
      />
    );
  }

  const sending = status === "sending";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* Honeypot — скрытое поле для отсева ботов. display:none (не sr-only):
          Chrome автозаполняет sr-only поля с именем "website" реальным сайтом
          пользователя, и сервер молча отбрасывает живую заявку как спам. */}
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
          onChange={(e) => {
            if (!startedRef.current && e.target.value) {
              startedRef.current = true;
              ymReachGoal("order_form_start");
            }
            setName(e.target.value);
          }}
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

      {/* Количество */}
      <div className="flex flex-col gap-1.5">
        <label className={fieldLabelClass}>Количество футболок</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1)))}
          min={1}
          max={999}
          disabled={sending}
          className={inputClass}
        />
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
