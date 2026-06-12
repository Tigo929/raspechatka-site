import "reflect-metadata";
import { NextResponse } from "next/server";
import { allowRequest, getRequestIp } from "@/lib/rate-limit";
import { validateDto } from "@/lib/validate";
import { OrderDto } from "@/lib/dto/order.dto";
import { createSubmission, type SubmissionFileInput } from "@/lib/submission-repository";
import { deliverSubmission } from "@/lib/submission-delivery";

export const runtime = "nodejs";

const MAX_SIZE_JSON = 16_384;
const MAX_SIZE_FORM = 45 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function isValidImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/webp") return buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
  return false;
}

function normalizeContact(data: OrderDto) {
  if (data.contact.method === "telegram") {
    const username = data.contact.value.trim().replace(/^@/, "");
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) return "Некорректный Telegram-юзернейм";
    data.contact.value = username;
    return null;
  }
  const phone = data.contact.value.trim();
  if (phone.length < 6 || !/^[\d\s+()-]+$/.test(phone)) return "Некорректный номер телефона";
  data.contact.value = phone;
  return null;
}

async function readImage(form: FormData, key: SubmissionFileInput["key"]) {
  const value = form.get(key);
  if (!(value instanceof File) || value.size === 0) return null;
  if (!allowedTypes.has(value.type)) throw new Error("Недопустимый тип изображения");
  if (value.size > MAX_IMAGE_SIZE) throw new Error("Изображение слишком большое (макс. 10 МБ)");
  const buffer = Buffer.from(await value.arrayBuffer());
  if (!isValidImageSignature(buffer, value.type)) throw new Error("Файл изображения повреждён или имеет неверный формат");
  return { key, originalName: value.name, mimeType: value.type, buffer } satisfies SubmissionFileInput;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > (isMultipart ? MAX_SIZE_FORM : MAX_SIZE_JSON)) {
    return NextResponse.json({ ok: false, error: "Слишком большой запрос" }, { status: 413 });
  }
  if (!allowRequest(`order:${getRequestIp(request)}`, { limit: 5, windowMs: 10 * 60 * 1000 })) {
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
  const contactError = normalizeContact(data);
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
