import { after, NextResponse } from "next/server";
import { allowRequest, getRequestIp } from "@/lib/rate-limit";
import { normalizeContact } from "@/lib/contact";
import { readImageField } from "@/lib/image-validation";
import {
  createOrGetSubmission,
  type SubmissionFileInput,
} from "@/lib/submission-repository";
import { enqueueDeliveryJob } from "@/lib/delivery-outbox-repository";
import { processDeliveryOutbox } from "@/lib/submission-delivery";
import { parseOrderQuantity, OrderValidationError } from "@/lib/order-validation";
import { isValidUuid } from "@/lib/sanitize";
import type { SubmissionContact } from "@/types";

export const runtime = "nodejs";

const MAX_SIZE_FORM = 45 * 1024 * 1024;

const fail = (error: string, status: number) =>
  NextResponse.json({ ok: false, error }, { status });

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return fail("Ожидается multipart/form-data", 400);
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_SIZE_FORM) {
    return fail("Слишком большой запрос", 413);
  }
  if (!allowRequest(`order:${getRequestIp(request)}`, { limit: 20, windowMs: 10 * 60 * 1000 })) {
    return fail("Слишком много запросов. Попробуйте позже.", 429);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Не удалось прочитать форму", 400);
  }

  const field = (key: string) => ((form.get(key) as string | null) ?? "").trim();

  if (field("hp_field")) {
    console.warn("[constructor] honeypot сработал — запрос отброшен как спам");
    return NextResponse.json({ ok: true, stored: true, delivered: false });
  }

  const name = field("name");
  const phone = field("phone");
  const telegram = field("telegram").replace(/^@/, "");
  const comment = field("comment");
  const product = field("product");
  const size = field("size");
  const color = field("color");
  let quantity: number;
  try {
    quantity = parseOrderQuantity(field("quantity"));
  } catch (e) {
    return fail(
      e instanceof OrderValidationError ? e.message : "Некорректное количество",
      400,
    );
  }
  const personalDataConsent = field("personalDataConsent") === "true";
  const imageRightsConsent = field("imageRightsConsent") === "true";
  const consentAcceptedAt = new Date().toISOString();

  if (name.length < 2) return fail("Укажите ваше имя", 422);
  if (name.length > 80) return fail("Имя слишком длинное", 422);
  if (comment.length > 500) return fail("Комментарий слишком длинный", 422);
  if (product.length > 200) return fail("Название продукта слишком длинное", 422);
  if (color.length > 100) return fail("Цвет слишком длинный", 422);
  if (size.length > 10) return fail("Размер слишком длинный", 422);
  if (!phone && !telegram) {
    return fail("Укажите телефон или Telegram-юзернейм", 422);
  }

  const contact: SubmissionContact = telegram
    ? { method: "telegram", value: telegram }
    : { method: "phone", value: phone };
  const contactError = normalizeContact(contact);
  if (contactError) return fail(contactError, 422);

  if (!personalDataConsent) {
    return fail("Необходимо согласие на обработку персональных данных", 422);
  }

  // Idempotency key (optional field in form)
  const rawKey = field("idempotencyKey");
  const idempotencyKey = rawKey && isValidUuid(rawKey) ? rawKey : undefined;

  let files: SubmissionFileInput[];
  try {
    const keys: SubmissionFileInput["key"][] = ["frontImage", "backImage", "frontPreview", "backPreview"];
    const entries = await Promise.all(
      keys.map(async (key): Promise<SubmissionFileInput | null> => {
        const image = await readImageField(form, key);
        return image ? { key, ...image } : null;
      }),
    );
    files = entries.filter((entry): entry is SubmissionFileInput => entry !== null);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Ошибка файла", 400);
  }

  const hasOriginal = files.some((file) => file.key === "frontImage" || file.key === "backImage");
  if (hasOriginal && !imageRightsConsent) {
    return fail("Подтвердите права на загружаемое изображение", 422);
  }

  try {
    const { submission, created } = await createOrGetSubmission(
      {
        kind: "order",
        name,
        contact,
        comment: comment || undefined,
        orderDetails: {
          productName: product || "Футболка с принтом",
          color,
          size,
          quantity: String(quantity),
        },
        personalDataConsent: true,
        imageRightsConsent,
        consentAcceptedAt,
        idempotencyKey,
      },
      files,
    );
    const archiveRequired = submission.files.length > 0;
    await enqueueDeliveryJob(submission.id, archiveRequired);
    after(() => { void processDeliveryOutbox({ limit: 1 }); });
    if (!created) {
      return NextResponse.json(
        {
          ok: true,
          stored: true,
          delivered: submission.status === "delivered",
          reference: submission.reference,
        },
        { status: 200 },
      );
    }
    return NextResponse.json(
      {
        ok: true,
        stored: true,
        delivered: false,
        reference: submission.reference,
      },
      { status: 202 },
    );
  } catch {
    return fail("Не удалось сохранить заявку. Попробуйте ещё раз или напишите нам в Telegram.", 500);
  }
}
