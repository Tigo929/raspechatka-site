import { NextResponse } from "next/server";
import { allowRequest, getRequestIp } from "@/lib/rate-limit";

/**
 * Приём заявки с сайта. Если заданы env TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID —
 * отправляет лид в Telegram. Если не настроено — отвечает delivered:false,
 * и фронт предложит написать напрямую в мессенджер (лид не теряется).
 *
 * Настройка: создайте бота через @BotFather, узнайте chat_id (например через
 * @userinfobot), пропишите TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env.
 */
export async function POST(req: Request) {
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) {
    return NextResponse.json(
      { ok: false, error: "payload too large" },
      { status: 413 },
    );
  }
  if (
    !allowRequest(`lead:${getRequestIp(req)}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000,
    })
  ) {
    return NextResponse.json(
      { ok: false, error: "Слишком много запросов. Попробуйте позже." },
      { status: 429 },
    );
  }

  let body: {
    name?: string;
    phone?: string;
    comment?: string;
    website?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  if (body.website) {
    return NextResponse.json({ ok: true, delivered: false });
  }

  const name = body.name?.trim().slice(0, 80);
  const phone = body.phone?.trim().slice(0, 40);
  const comment = body.comment?.trim().slice(0, 1000);

  if (!name || !phone || phone.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Укажите имя и корректный телефон" },
      { status: 400 },
    );
  }

  const text =
    `🟠 Новая заявка с сайта\n` +
    `Имя: ${name}\n` +
    `Телефон: ${phone}` +
    (comment ? `\nКомментарий: ${comment}` : "");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (token && chatId) {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text }),
          signal: AbortSignal.timeout(8000),
        },
      );
      return NextResponse.json({ ok: true, delivered: res.ok });
    } catch {
      return NextResponse.json({ ok: true, delivered: false });
    }
  }

  // Не пишем персональные данные в серверный лог.
  return NextResponse.json({ ok: true, delivered: false });
}
