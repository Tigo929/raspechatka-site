import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function checkImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png")
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/webp")
    return buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
  return false;
}

async function readImageField(
  form: FormData,
  key: string,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const value = form.get(key);
  if (!(value instanceof File) || value.size === 0) return null;
  if (!ALLOWED_TYPES.has(value.type))
    throw new Error(`Недопустимый формат файла (${key}): принимаем PNG, JPG, WebP`);
  if (value.size > MAX_FILE_SIZE)
    throw new Error(`Файл слишком большой (${key}): максимум 10 МБ`);
  const buffer = Buffer.from(await value.arrayBuffer());
  if (!checkImageSignature(buffer, value.type))
    throw new Error(`Файл повреждён или неверный формат (${key})`);
  return { buffer, mimeType: value.type };
}

async function tgRequest(endpoint: string, body: FormData | string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не настроен");

  const isJson = typeof body === "string";
  const res = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
    method: "POST",
    headers: isJson ? { "Content-Type": "application/json" } : undefined,
    body,
    signal: AbortSignal.timeout(30_000),
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  console.log(`[tg/${endpoint}] HTTP ${res.status}`, JSON.stringify(data)?.slice(0, 400));

  if (!res.ok || (data && typeof data === "object" && !(data as Record<string, unknown>).ok)) {
    const desc =
      data && typeof data === "object"
        ? ((data as Record<string, unknown>).description as string | undefined)
        : undefined;
    throw new Error(`Telegram ответил ошибкой: ${desc ?? res.status}`);
  }
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return NextResponse.json({ ok: false, error: "Ожидается multipart/form-data" }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Не удалось прочитать форму" }, { status: 400 });
  }

  const name = ((form.get("name") as string | null) ?? "").trim();
  const phone = ((form.get("phone") as string | null) ?? "").trim();
  const telegram = ((form.get("telegram") as string | null) ?? "").trim().replace(/^@/, "");
  const email = ((form.get("email") as string | null) ?? "").trim();
  const comment = ((form.get("comment") as string | null) ?? "").trim();
  const product = ((form.get("product") as string | null) ?? "").trim();
  const size = ((form.get("size") as string | null) ?? "").trim();
  const color = ((form.get("color") as string | null) ?? "").trim();

  console.log("[constructor] поля:", { name, phone, telegram: telegram || null, email: email || null, product, size, color });

  if (!name) return NextResponse.json({ ok: false, error: "Укажите ваше имя" }, { status: 422 });
  if (!phone && !telegram && !email) {
    return NextResponse.json(
      { ok: false, error: "Укажите хотя бы один способ связи: телефон или Telegram" },
      { status: 422 },
    );
  }

  let frontImage: { buffer: Buffer; mimeType: string } | null = null;
  let backImage: { buffer: Buffer; mimeType: string } | null = null;
  let previewImage: { buffer: Buffer; mimeType: string } | null = null;

  try {
    [frontImage, backImage, previewImage] = await Promise.all([
      readImageField(form, "frontImage"),
      readImageField(form, "backImage"),
      readImageField(form, "previewImage"),
    ]);
    console.log("[constructor] файлы:", {
      frontImage: frontImage ? `${frontImage.mimeType} ${Math.round(frontImage.buffer.byteLength / 1024)}KB` : null,
      backImage: backImage ? `${backImage.mimeType} ${Math.round(backImage.buffer.byteLength / 1024)}KB` : null,
      previewImage: previewImage ? `${previewImage.mimeType} ${Math.round(previewImage.buffer.byteLength / 1024)}KB` : null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ошибка файла";
    console.error("[constructor] ошибка файла:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!chatId) {
    console.error("[constructor] TELEGRAM_CHAT_ID не задан");
    return NextResponse.json({ ok: false, error: "Сервис временно недоступен" }, { status: 503 });
  }

  const textLines = [
    "🛒 Новая заявка с конструктора",
    "",
    `Товар: ${product || "—"}`,
    `Размер: ${size || "—"}`,
    `Цвет: ${color || "—"}`,
    "",
    `Имя: ${name}`,
    phone ? `Телефон: ${phone}` : null,
    telegram ? `Telegram: @${telegram}` : null,
    email ? `Email: ${email}` : null,
    comment ? `\nКомментарий: ${comment}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");

  try {
    // 1. Текстовое сообщение с деталями заказа
    await tgRequest("sendMessage", JSON.stringify({ chat_id: chatId, text: textLines }));

    // 2. Изображения через sendMediaGroup (или sendPhoto для одного)
    type PhotoEntry = { buffer: Buffer; mimeType: string; caption: string };
    const photos: PhotoEntry[] = [
      frontImage && { buffer: frontImage.buffer, mimeType: frontImage.mimeType, caption: "📸 Перед" },
      backImage && { buffer: backImage.buffer, mimeType: backImage.mimeType, caption: "📸 Спина" },
      previewImage && { buffer: previewImage.buffer, mimeType: previewImage.mimeType, caption: "🖼 Превью заказа" },
    ].filter((p): p is PhotoEntry => p !== null);

    if (photos.length === 1) {
      const fd = new FormData();
      fd.set("chat_id", chatId);
      fd.set("caption", photos[0].caption);
      fd.set("photo", new Blob([new Uint8Array(photos[0].buffer)], { type: photos[0].mimeType }), "photo.jpg");
      await tgRequest("sendPhoto", fd);
    } else if (photos.length > 1) {
      const fd = new FormData();
      fd.set("chat_id", chatId);
      const mediaJson = photos.map((photo, i) => {
        const field = `img${i}`;
        fd.set(field, new Blob([new Uint8Array(photo.buffer)], { type: photo.mimeType }), `${field}.jpg`);
        return { type: "photo", media: `attach://${field}`, caption: photo.caption };
      });
      fd.set("media", JSON.stringify(mediaJson));
      await tgRequest("sendMediaGroup", fd);
    }

    console.log("[constructor] заявка доставлена в Telegram");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("[constructor] ошибка доставки:", reason);
    return NextResponse.json(
      {
        ok: false,
        error: "Заявка не отправилась. Попробуйте ещё раз или напишите нам в Telegram.",
      },
      { status: 502 },
    );
  }
}
