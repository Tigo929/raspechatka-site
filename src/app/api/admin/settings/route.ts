import { NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { getSettings, updateSettings } from "@/lib/content-repository";
import type { ManagedSettings } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  if (!(await isSameOriginRequest(request)))
    return NextResponse.json({ error: "Недопустимый источник." }, { status: 403 });

  const body = (await request.json()) as Partial<ManagedSettings>;
  if (!body.phone || !body.email)
    return NextResponse.json({ error: "Телефон и email обязательны." }, { status: 400 });

  const settings = await updateSettings({
    phone: body.phone.trim(),
    email: body.email.trim(),
    address: body.address?.trim() ?? "",
    hours: body.hours?.trim() ?? "",
    telegram: body.telegram?.trim() ?? "",
    whatsapp: body.whatsapp?.trim() ?? "",
    yandexMetrikaId: body.yandexMetrikaId?.trim() ?? "",
  });
  return NextResponse.json({ settings });
}
