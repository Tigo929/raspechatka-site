import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listSubmissions } from "@/lib/submission-repository";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }
  return NextResponse.json({ submissions: await listSubmissions() });
}
