import "reflect-metadata";
import JSZip from "jszip";
import { NextResponse } from "next/server";
import { allowRequest, getRequestIp } from "@/lib/rate-limit";
import { validateDto } from "@/lib/validate";
import { OrderDto } from "@/lib/dto/order.dto";

export const runtime = "nodejs";

const MAX_SIZE_JSON = 16_384;        // 16 KB для JSON-заявок
const MAX_SIZE_FORM = 25 * 1024 * 1024; // 25 MB для FormData с изображениями

// ── Метки для Telegram ──────────────────────────────────────────────────────

const contactLabels: Record<string, string> = {
  telegram: "Telegram",
  max: "MAX",
  phone: "Звонок",
};

function printTypeLabel(front: string | null | undefined, back: string | null | undefined): string {
  if (front && back) return "Двухсторонняя";
  if (front) return "Передняя сторона";
  if (back) return "Задняя сторона";
  return "Без принта";
}

function buildText(
  name: string,
  contactStr: string,
  od?: { color?: string; size?: string; prints?: Record<string, string | null>; productName?: string },
  hasFiles = false,
): string {
  const lines: string[] = [`🛒 Новый заказ\nИмя: ${name}\nКонтакт: ${contactStr}`];

  if (od) {
    const details: string[] = [];
    if (od.productName) details.push(`Товар: ${od.productName}`);
    if (od.color) details.push(`Цвет: ${od.color}`);
    if (od.size) details.push(`Размер: ${od.size}`);
    if (od.prints !== undefined) {
      details.push(`Печать: ${printTypeLabel(od.prints.front, od.prints.back)}`);
      if (od.prints.front) details.push(`Файл (перед): ${od.prints.front}`);
      if (od.prints.back) details.push(`Файл (спина): ${od.prints.back}`);
    }
    if (details.length) lines.push("\n📦 Детали:\n" + details.join("\n"));
  }

  if (hasFiles) lines.push("\n📎 Макеты приложены в архиве");

  return lines.join("");
}

async function sendToTelegram(token: string, chatId: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendDocumentToTelegram(
  token: string,
  chatId: string,
  caption: string,
  zipBuffer: Buffer,
  filename: string,
): Promise<boolean> {
  try {
    const fd = new FormData();
    fd.append("chat_id", chatId);
    fd.append("caption", caption);
    const zipArrayBuffer = zipBuffer.buffer.slice(zipBuffer.byteOffset, zipBuffer.byteOffset + zipBuffer.byteLength) as ArrayBuffer;
    fd.append("document", new Blob([zipArrayBuffer], { type: "application/zip" }), filename);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body: fd,
      signal: AbortSignal.timeout(30_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Создание ZIP-архива ─────────────────────────────────────────────────────

const sideNames: Record<string, string> = {
  front: "Передняя_часть",
  back:  "Задняя_часть",
};

const extByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
};

async function buildZip(
  images: { side: "front" | "back"; file: File }[],
): Promise<Buffer> {
  const zip = new JSZip();
  for (const { side, file } of images) {
    const ext = extByType[file.type] ?? "png";
    const name = `${sideNames[side]}.${ext}`;
    zip.file(name, Buffer.from(await file.arrayBuffer()));
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

// ── Валидация подписи изображения ───────────────────────────────────────────

function isValidImageSignature(buf: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mimeType === "image/png")  return buf.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if (mimeType === "image/webp") return buf.subarray(0,4).toString() === "RIFF" && buf.subarray(8,12).toString() === "WEBP";
  return false;
}

// ── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");
  const maxSize = isMultipart ? MAX_SIZE_FORM : MAX_SIZE_JSON;

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > maxSize)
    return NextResponse.json({ ok: false, error: "Слишком большой запрос" }, { status: 413 });

  if (!allowRequest(`order:${getRequestIp(req)}`, { limit: 5, windowMs: 10 * 60 * 1000 }))
    return NextResponse.json(
      { ok: false, error: "Слишком много запросов. Попробуйте позже." },
      { status: 429 },
    );

  // ── Парсим тело ──────────────────────────────────────────────────────────

  let plain: unknown;
  const images: { side: "front" | "back"; file: File }[] = [];

  if (isMultipart) {
    let formData: FormData;
    try { formData = await req.formData(); }
    catch { return NextResponse.json({ ok: false, error: "Некорректный формат данных" }, { status: 400 }); }

    const dataField = formData.get("data");
    if (typeof dataField !== "string")
      return NextResponse.json({ ok: false, error: "Поле data обязательно" }, { status: 400 });

    try { plain = JSON.parse(dataField); }
    catch { return NextResponse.json({ ok: false, error: "Некорректный JSON в поле data" }, { status: 400 }); }

    // Извлекаем файлы изображений
    for (const side of ["front", "back"] as const) {
      const file = formData.get(`${side}Image`);
      if (!(file instanceof File) || file.size === 0) continue;

      const allowed = Object.keys(extByType);
      if (!allowed.includes(file.type))
        return NextResponse.json({ ok: false, error: `Недопустимый тип файла: ${file.type}` }, { status: 400 });
      if (file.size > 10 * 1024 * 1024)
        return NextResponse.json({ ok: false, error: "Файл изображения слишком большой (макс. 10 МБ)" }, { status: 413 });

      const buf = Buffer.from(await file.arrayBuffer());
      if (!isValidImageSignature(buf, file.type))
        return NextResponse.json({ ok: false, error: "Некорректный файл изображения" }, { status: 400 });

      images.push({ side, file });
    }
  } else {
    try { plain = await req.json(); }
    catch { return NextResponse.json({ ok: false, error: "Некорректный формат данных" }, { status: 400 }); }
  }

  // ── Валидация через DTO ──────────────────────────────────────────────────

  const { data, errors } = await validateDto(OrderDto, plain);
  if (errors) return NextResponse.json({ ok: false, error: errors[0] }, { status: 422 });

  // Honeypot
  if (data.website) return NextResponse.json({ ok: true, delivered: false });

  // Дополнительная валидация Telegram username
  if (data.contact.method === "telegram") {
    const u = data.contact.value.replace(/^@/, "");
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(u))
      return NextResponse.json(
        { ok: false, error: "Telegram-юзернейм может содержать только буквы, цифры и _" },
        { status: 422 },
      );
    data.contact.value = u;
  }

  // ── Формируем сообщение ──────────────────────────────────────────────────

  const contactStr =
    data.contact.method === "telegram"
      ? `@${data.contact.value} (Telegram)`
      : `${data.contact.value} (${contactLabels[data.contact.method] ?? data.contact.method})`;

  const hasFiles = images.length > 0;
  const text = buildText(data.name, contactStr, data.orderDetails, hasFiles);

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return NextResponse.json({ ok: true, delivered: false });

  // ── Отправка в Telegram ──────────────────────────────────────────────────

  try {
    if (hasFiles) {
      const zipBuffer = await buildZip(images);
      const safeClientName = data.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_").slice(0, 20);
      const filename = `Printlab_${safeClientName}.zip`;
      const delivered = await sendDocumentToTelegram(token, chatId, text, zipBuffer, filename);
      return NextResponse.json({ ok: true, delivered });
    } else {
      const delivered = await sendToTelegram(token, chatId, text);
      return NextResponse.json({ ok: true, delivered });
    }
  } catch {
    return NextResponse.json({ ok: true, delivered: false });
  }
}
