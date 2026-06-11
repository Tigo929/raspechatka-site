import { NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { createReview, getReviews } from "@/lib/content-repository";
import type { ManagedReview } from "@/types";

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

  const body = (await request.json()) as Partial<ManagedReview>;
  if (!body.name?.trim() || !body.text?.trim() || !body.date)
    return NextResponse.json({ error: "Заполните обязательные поля." }, { status: 400 });

  const review = await createReview({
    name: body.name.trim(),
    context: body.context?.trim() ?? "",
    rating: Number(body.rating) || 5,
    text: body.text.trim(),
    date: body.date,
    source: body.source ?? "manual",
    published: body.published ?? true,
  });
  return NextResponse.json({ review }, { status: 201 });
}
