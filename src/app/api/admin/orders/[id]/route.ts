import { NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { updateSubmissionProcessing } from "@/lib/submission-repository";
import { isValidUuid } from "@/lib/sanitize";
import type { ProcessingStatus } from "@/types";

export const runtime = "nodejs";

const allowedStatuses = new Set<ProcessingStatus>(["new", "in_progress", "done", "cancelled"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  let body: { processingStatus?: string };
  try {
    body = (await request.json()) as { processingStatus?: string };
  } catch {
    return NextResponse.json({ error: "Некорректный формат данных." }, { status: 400 });
  }
  const status = body.processingStatus as ProcessingStatus | undefined;
  if (!status || !allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Недопустимый статус обработки." }, { status: 422 });
  }

  try {
    const submission = await updateSubmissionProcessing(id, status);
    return NextResponse.json({ submission });
  } catch {
    return NextResponse.json({ error: "Заявка не найдена." }, { status: 404 });
  }
}
