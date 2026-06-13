import { after, NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { processDeliveryOutbox } from "@/lib/submission-delivery";
import { requeueJob, getJobBySubmissionId, enqueueDeliveryJob } from "@/lib/delivery-outbox-repository";
import { getSubmission } from "@/lib/submission-repository";
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

  const submission = await getSubmission(id);
  if (!submission) {
    return NextResponse.json({ error: "Заявка не найдена." }, { status: 404 });
  }

  // Find existing outbox job or create one if missing (backward compat with pre-outbox submissions)
  let job = await getJobBySubmissionId(id);
  if (job) {
    job = await requeueJob(job.id);
  } else {
    job = await enqueueDeliveryJob(id, submission.files.length > 0);
  }

  after(() => { void processDeliveryOutbox({ limit: 1 }); });

  return NextResponse.json({ ok: true, queued: true, submission }, { status: 202 });
}
