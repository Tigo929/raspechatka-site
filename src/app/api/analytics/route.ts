import { NextResponse } from "next/server";
import { appendEvent } from "@/lib/analytics-repository";
import { allowRequest, getRequestIp } from "@/lib/rate-limit";
import type { AnalyticsEvent } from "@/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  if (!allowRequest(`analytics:${ip}`, { limit: 60, windowMs: 60_000 })) {
    return NextResponse.json({ ok: true }); // silently drop
  }

  try {
    const body = (await request.json()) as Partial<Omit<AnalyticsEvent, "id" | "timestamp">>;
    const { type, page, sessionId, device } = body;
    if (!type || !page || !sessionId || !device) {
      return NextResponse.json({ ok: true });
    }
    if (!["pageview", "session_end"].includes(type)) {
      return NextResponse.json({ ok: true });
    }

    await appendEvent({
      type: type as AnalyticsEvent["type"],
      page: String(page).slice(0, 200),
      sessionId: String(sessionId).slice(0, 64),
      device: (["mobile", "desktop", "tablet"].includes(String(device))
        ? device
        : "desktop") as AnalyticsEvent["device"],
      duration: typeof body.duration === "number" ? Math.min(body.duration, 7200) : undefined,
      referrer: body.referrer ? String(body.referrer).slice(0, 300) : undefined,
    });
  } catch {
    // never surface analytics errors to client
  }
  return NextResponse.json({ ok: true });
}
