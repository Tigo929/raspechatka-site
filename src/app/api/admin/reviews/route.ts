import "reflect-metadata";
import { NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { createReview, getReviews } from "@/lib/content-repository";
import { validateDto } from "@/lib/validate";
import { ReviewDto } from "@/lib/dto/review.dto";
import { stripHtml } from "@/lib/sanitize";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  return NextResponse.json({ reviews: await getReviews() });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  if (!(await isSameOriginRequest(request)))
    return NextResponse.json({ error: "Недопустимый источник." }, { status: 403 });

  let plain: unknown;
  try { plain = await request.json(); }
  catch { return NextResponse.json({ error: "Некорректный формат данных." }, { status: 400 }); }

  const { data, errors } = await validateDto(ReviewDto, plain);
  if (errors) return NextResponse.json({ error: errors[0] }, { status: 422 });

  const review = await createReview({
    name: stripHtml(data.name),
    context: data.context ? stripHtml(data.context) : "",
    rating: data.rating,
    text: stripHtml(data.text),
    date: data.date,
    source: (data.source ?? "manual") as import("@/types").ReviewSource,
    published: data.published ?? true,
  });
  return NextResponse.json({ review }, { status: 201 });
}
