import "reflect-metadata";
import { NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { updateReview, deleteReview } from "@/lib/content-repository";
import { validateDto } from "@/lib/validate";
import { ReviewDto } from "@/lib/dto/review.dto";
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

  const { data, errors } = await validateDto(ReviewDto, plain);
  if (errors) return NextResponse.json({ error: errors[0] }, { status: 422 });

  try {
    const review = await updateReview(id, {
      name: stripHtml(data.name),
      context: data.context ? stripHtml(data.context) : "",
      rating: data.rating,
      text: stripHtml(data.text),
      date: data.date,
      source: (data.source ?? "manual") as import("@/types").ReviewSource,
      published: data.published ?? true,
    });
    return NextResponse.json({ review });
  } catch {
    return NextResponse.json({ error: "Отзыв не найден." }, { status: 404 });
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
    await deleteReview(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Отзыв не найден." }, { status: 404 });
  }
}