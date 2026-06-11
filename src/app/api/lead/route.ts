import "reflect-metadata";
import { NextResponse } from "next/server";
import { allowRequest, getRequestIp } from "@/lib/rate-limit";
import { validateDto } from "@/lib/validate";
import { LeadDto } from "@/lib/dto/lead.dto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > 16_384)
    return NextResponse.json({ ok: false, error: "Слишком большой запрос" }, { status: 413 });

  if (!allowRequest(`lead:${getRequestIp(req)}`, { limit: 5, windowMs: 10 * 60 * 1000 }))
    return NextResponse.json(
      { ok: false, error: "Слишком много запросов. Попробуйте позже." },
      { status: 429 },
    );

  let plain: unknown;
  try {
    plain = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный формат данных" }, { status: 400 });
  }

  const { data, errors } = await validateDto(LeadDto, plain);

  if (errors) {
    return NextResponse.json({ ok: false, error: errors[0] }, { status: 422 });
  }

  // Honeypot
  if (data.website) return NextResponse.json({ ok: true, delivered: false });

  const text =
    `🟠 Новая заявка с сайта\n` +
    `Имя: ${data.name}\n` +
    `Телефон: ${data.phone}` +
    (data.comment ? `\nКомментарий: ${data.comment}` : "");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (token && chatId) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
        signal: AbortSignal.timeout(8000),
      });
      return NextResponse.json({ ok: true, delivered: res.ok });
    } catch {
      return NextResponse.json({ ok: true, delivered: false });
    }
  }

  return NextResponse.json({ ok: true, delivered: false });
}
