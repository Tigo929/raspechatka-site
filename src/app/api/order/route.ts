import "reflect-metadata";
import { NextResponse } from "next/server";
import { allowRequest, getRequestIp } from "@/lib/rate-limit";
import { validateDto } from "@/lib/validate";
import { OrderDto } from "@/lib/dto/order.dto";
import { normalizeContact } from "@/lib/contact";
import { readImageField } from "@/lib/image-validation";
import { createSubmission, type SubmissionFileInput } from "@/lib/submission-repository";
import { deliverSubmission } from "@/lib/submission-delivery";

export const runtime = "nodejs";

const MAX_SIZE_JSON = 16_384;
const MAX_SIZE_FORM = 45 * 1024 * 1024;

async function readImage(form: FormData, key: SubmissionFileInput["key"]) {
  const image = await readImageField(form, key);
  return image ? ({ key, ...image } satisfies SubmissionFileInput) : null;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > (isMultipart ? MAX_SIZE_FORM : MAX_SIZE_JSON)) {
    return NextResponse.json({ ok: false, error: "Слишком большой запрос" }, { status: 413 });
  }
  if (!allowRequest(`order:${getRequestIp(request)}`, { limit: 20, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ ok: false, error: "Слишком много запросов. Попробуйте позже." }, { status: 429 });
  }

  let plain: unknown;
  const files: SubmissionFileInput[] = [];
  try {
    if (isMultipart) {
      const form = await request.formData();
      const payload = form.get("data");
      if (typeof payload !== "string") throw new Error("Поле data обязательно");
      plain = JSON.parse(payload);
      for (const key of ["frontImage", "backImage", "frontPreview", "backPreview"] as const) {
        const image = await readImage(form, key);
        if (image) files.push(image);
      }
    } else {
      plain = await request.json();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Некорректный формат данных";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const validated = await validateDto(OrderDto, plain);
  if (validated.errors) return NextResponse.json({ ok: false, error: validated.errors[0] }, { status: 422 });
  const data = validated.data;
  if (data.website) return NextResponse.json({ ok: true, stored: true, delivered: false });
  const contactError = normalizeContact(data.contact);
  if (contactError) return NextResponse.json({ ok: false, error: contactError }, { status: 422 });
  if (files.some((file) => file.key === "frontImage" || file.key === "backImage") && data.imageRightsConsent !== true) {
    return NextResponse.json({ ok: false, error: "Подтвердите права на загружаемое изображение" }, { status: 422 });
  }

  try {
    const submission = await createSubmission({
      kind: "order",
      name: data.name.trim(),
      contact: data.contact,
      orderDetails: data.orderDetails as Record<string, unknown> | undefined,
      personalDataConsent: true,
      imageRightsConsent: data.imageRightsConsent,
      consentAcceptedAt: data.consentAcceptedAt ?? new Date().toISOString(),
    }, files);
    const delivered = await deliverSubmission(submission.id);
    return NextResponse.json({
      ok: true,
      stored: true,
      delivered: delivered.status === "delivered",
      reference: submission.reference,
    }, { status: 202 });
  } catch {
    return NextResponse.json({ ok: false, error: "Не удалось сохранить заявку. Позвоните нам или попробуйте ещё раз." }, { status: 500 });
  }
}
