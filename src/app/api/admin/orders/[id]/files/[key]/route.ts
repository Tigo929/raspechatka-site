import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSubmission, readSubmissionFile } from "@/lib/submission-repository";
import { isValidUuid } from "@/lib/sanitize";

export const runtime = "nodejs";

/** Отдаёт сохранённый файл заявки (макет/превью) администратору для просмотра. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; key: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }
  const { id, key } = await params;
  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Некорректный идентификатор." }, { status: 400 });
  }

  const submission = await getSubmission(id);
  const file = submission?.files.find((item) => item.key === key);
  if (!submission || !file) {
    return NextResponse.json({ error: "Файл не найден." }, { status: 404 });
  }

  try {
    const buffer = await readSubmissionFile(file);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "private, max-age=300",
        "Content-Disposition": `inline; filename="${file.key}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать файл." }, { status: 500 });
  }
}
