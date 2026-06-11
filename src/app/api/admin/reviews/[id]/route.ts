import { NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { updateReview, deleteReview } from "@/lib/content-repository";
import type { ManagedReview } from "@/types";

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
  const body = (await request.json()) as Partial<ManagedReview>;
  if (!body.name?.trim() || !body.text?.trim())
    return NextResponse.json({ error: "Заполните обязательные поля." }, { status: 400 });

  try {
    const review = await updateReview(id, {
      name: body.name.trim(),
      context: body.context?.trim() ?? "",
      rating: Number(body.rating) || 5,
      text: body.text.trim(),
      date: body.date ?? new Date().toISOString().slice(0, 10),
      source: body.source ?? "manual",
      published: body.published ?? true,
    });
    return NextResponse.json({ review });
  } catch {
    return NextResponse.json({ error: "Отзыв не найден." }, { status: 404 });
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
    await deleteReview(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Отзыв не найден." }, { status: 404 });
  }
}
