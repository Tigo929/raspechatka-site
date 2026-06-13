import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listSubmissions } from "@/lib/submission-repository";
import { listOutboxJobs } from "@/lib/delivery-outbox-repository";
import type { SubmissionWithOutbox } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const [submissions, jobs] = await Promise.all([listSubmissions(), listOutboxJobs()]);
  const jobMap = new Map(jobs.map((j) => [j.submissionId, j]));

  const withOutbox: SubmissionWithOutbox[] = submissions.map((s) => ({
    ...s,
    outboxJob: jobMap.get(s.id),
  }));

  return NextResponse.json({ submissions: withOutbox });
}
