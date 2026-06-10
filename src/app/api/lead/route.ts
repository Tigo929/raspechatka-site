import { NextResponse } from "next/server";

/**
 * Приём заявки с сайта. Если заданы env TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID —
 * отправляет лид в Telegram. Если не настроено — отвечает delivered:false,
 * и фронт предложит написать напрямую в мессенджер (лид не теряется).
 *
 * Настройка: создайте бота через @BotFather, узнайте chat_id (например через
 * @userinfobot), пропишите TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env.
 */
export async function POST(req: Request) {
  let body: { name?: string; phone?: string; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const comment = body.comment?.trim();

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
        },
      );
      return NextResponse.json({ ok: true, delivered: res.ok });
    } catch {
      return NextResponse.json({ ok: true, delivered: false });
    }
  }

  // Telegram не настроен — лид принят, но не доставлен на сервер.
  console.log("[lead] Telegram не настроен. Заявка:", text);
  return NextResponse.json({ ok: true, delivered: false });
}
