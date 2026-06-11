import { NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { updateFaqItem, deleteFaqItem } from "@/lib/content-repository";
import type { ManagedFaqItem } from "@/types";

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
  const body = (await request.json()) as Partial<ManagedFaqItem>;
  if (!body.question?.trim() || !body.answer?.trim())
    return NextResponse.json({ error: "Вопрос и ответ обязательны." }, { status: 400 });

  try {
    const item = await updateFaqItem(id, {
      question: body.question.trim(),
      answer: body.answer.trim(),
      order: body.order ?? 0,
      published: body.published ?? true,
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Пункт не найден." }, { status: 404 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  if (!(await isSameOriginRequest(request)))
    return NextResponse.json({ error: "Недопустимый источник." }, { status: 403 });

  const { id } = await params;
  try {
    await deleteFaqItem(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Пункт не найден." }, { status: 404 });
  }
}
