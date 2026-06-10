import { NextResponse } from "next/server";
import { adminCookieName, isSameOriginRequest } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!(await isSameOriginRequest(request))) {
    return NextResponse.json(
      { error: "Недопустимый источник запроса." },
      { status: 403 },
    );
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, "", { path: "/", maxAge: 0 });
  return response;
}
