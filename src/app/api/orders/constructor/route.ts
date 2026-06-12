import { NextResponse } from "next/server";
import { allowRequest, getRequestIp } from "@/lib/rate-limit";
import { normalizeContact } from "@/lib/contact";
import { readImageField } from "@/lib/image-validation";
import { createSubmission, type SubmissionFileInput } from "@/lib/submission-repository";
import { deliverSubmission } from "@/lib/submission-delivery";
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

  // Honeypot: скрытое поле должно остаться пустым.
  if (field("website")) {
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
  const personalDataConsent = field("personalDataConsent") === "true";
  const imageRightsConsent = field("imageRightsConsent") === "true";
  const consentAcceptedAt = field("consentAcceptedAt") || new Date().toISOString();

  if (name.length < 2) return fail("Укажите ваше имя", 422);
  if (!phone && !telegram) {
    return fail("Укажите телефон или Telegram-юзернейм", 422);
  }

  // Telegram приоритетнее: это самый быстрый канал связи для менеджера.
  const contact: SubmissionContact = telegram
    ? { method: "telegram", value: telegram }
    : { method: "phone", value: phone };
  const contactError = normalizeContact(contact);
  if (contactError) return fail(contactError, 422);

  // Серверное подтверждение согласий — нельзя обойти, минуя клиентскую форму (152-ФЗ).
  if (!personalDataConsent) {
    return fail("Необходимо согласие на обработку персональных данных", 422);
  }

  let files: SubmissionFileInput[];
  try {
    const keys: SubmissionFileInput["key"][] = ["frontImage", "backImage", "previewImage"];
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
    const submission = await createSubmission(
      {
        kind: "order",
        name,
        contact,
        comment: comment || undefined,
        orderDetails: {
          productName: product || "Футболка с принтом",
          color,
          size,
        },
        personalDataConsent: true,
        imageRightsConsent,
        consentAcceptedAt,
      },
      files,
    );
    const delivered = await deliverSubmission(submission.id);
    return NextResponse.json(
      {
        ok: true,
        stored: true,
        delivered: delivered.status === "delivered",
        reference: submission.reference,
      },
      { status: 202 },
    );
  } catch {
    return fail("Не удалось сохранить заявку. Попробуйте ещё раз или напишите нам в Telegram.", 500);
  }
}
