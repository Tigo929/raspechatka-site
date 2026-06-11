import "reflect-metadata";
import { NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { updateFaqItem, deleteFaqItem } from "@/lib/content-repository";
import { validateDto } from "@/lib/validate";
import { FaqDto } from "@/lib/dto/faq.dto";
import { stripHtml, isValidUuid } from "@/lib/sanitize";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  if (!(await isSameOriginRequest(request)))
    return NextResponse.json({ error: "Недопустимый источник." }, { status: 403 });

  const { id } = await params;
  if (!isValidUuid(id))
    return NextResponse.json({ error: "Некорректный идентификатор." }, { status: 400 });

  let plain: unknown;
  try { plain = await request.json(); }
  catch { return NextResponse.json({ error: "Некорректный формат данных." }, { status: 400 }); }

  const { data, errors } = await validateDto(FaqDto, plain);
  if (errors) return NextResponse.json({ error: errors[0] }, { status: 422 });

  try {
    const item = await updateFaqItem(id, {
      question: stripHtml(data.question),
      answer: stripHtml(data.answer),
      order: data.order ?? 0,
      published: data.published ?? true,
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Пункт не найден." }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });

  const { id } = await params;
  if (!isValidUuid(id))
    return NextResponse.json({ error: "Некорректный идентификатор." }, { status: 400 });

  try {
    await deleteFaqItem(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Пункт не найден." }, { status: 404 });
  }
}