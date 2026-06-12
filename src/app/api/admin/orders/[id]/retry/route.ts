import { NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { deliverSubmission } from "@/lib/submission-delivery";
import { isValidUuid } from "@/lib/sanitize";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }
  if (!(await isSameOriginRequest(request))) {
    return NextResponse.json({ error: "Недопустимый источник." }, { status: 403 });
  }
  const { id } = await params;
  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Некорректный идентификатор." }, { status: 400 });
  }
  try {
    const submission = await deliverSubmission(id);
    const ok = submission.status === "delivered";
    return NextResponse.json({ submission, ok }, { status: ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ error: "Заявка не найдена." }, { status: 404 });
  }
}
