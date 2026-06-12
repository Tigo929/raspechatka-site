import "reflect-metadata";
import { NextResponse } from "next/server";
import { allowRequest, getRequestIp } from "@/lib/rate-limit";
import { validateDto } from "@/lib/validate";
import { LeadDto } from "@/lib/dto/lead.dto";
import { normalizeContact } from "@/lib/contact";
import { createSubmission } from "@/lib/submission-repository";
import { deliverSubmission } from "@/lib/submission-delivery";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 16_384) {
    return NextResponse.json({ ok: false, error: "Слишком большой запрос" }, { status: 413 });
  }
  if (!allowRequest(`lead:${getRequestIp(request)}`, { limit: 20, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ ok: false, error: "Слишком много запросов. Попробуйте позже." }, { status: 429 });
  }

  let plain: unknown;
  try {
    plain = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный формат данных" }, { status: 400 });
  }
  const validated = await validateDto(LeadDto, plain);
  if (validated.errors) return NextResponse.json({ ok: false, error: validated.errors[0] }, { status: 422 });
  const data = validated.data;
  if (data.website) {
    console.warn("[lead] honeypot сработал — запрос отброшен как спам");
    return NextResponse.json({ ok: true, stored: true, delivered: false });
  }
  const contactError = normalizeContact(data.contact);
  if (contactError) return NextResponse.json({ ok: false, error: contactError }, { status: 422 });

  try {
    const submission = await createSubmission({
      kind: "lead",
      name: data.name.trim(),
      contact: data.contact,
      comment: data.comment?.trim(),
      personalDataConsent: true,
      consentAcceptedAt: data.consentAcceptedAt ?? new Date().toISOString(),
    });
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
