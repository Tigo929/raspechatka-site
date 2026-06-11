import { NextResponse } from "next/server";
import {
  adminCookieName,
  adminSessionMaxAge,
  createAdminSessionToken,
  isAdminConfigured,
  isSameOriginRequest,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { allowRequest, getRequestIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Админ-панель не настроена." },
      { status: 503 },
    );
  }
  if (!(await isSameOriginRequest(request))) {
    return NextResponse.json(
      { error: "Недопустимый источник запроса." },
      { status: 403 },
    );
  }
  if (
    !allowRequest(`admin-login:${getRequestIp(request)}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    })
  ) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте позже." },
      { status: 429 },
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json(
      { error: "Некорректный запрос." },
      { status: 400 },
    );
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Неверный пароль." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: adminSessionMaxAge,
  });
  return response;
}
