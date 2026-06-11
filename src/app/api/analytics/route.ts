import "reflect-metadata";
import { NextResponse } from "next/server";
import { appendEvent } from "@/lib/analytics-repository";
import { allowRequest, getRequestIp } from "@/lib/rate-limit";
import { validateDto } from "@/lib/validate";
import { AnalyticsDto } from "@/lib/dto/analytics.dto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  if (!allowRequest(`analytics:${ip}`, { limit: 60, windowMs: 60_000 })) {
    return NextResponse.json({ ok: true }); // silently drop
  }

  try {
    const plain = await request.json();
    const { data } = await validateDto(AnalyticsDto, plain);
    if (!data) return NextResponse.json({ ok: true }); // silently ignore invalid

    await appendEvent({
      type: data.type,
      page: data.page,
      sessionId: data.sessionId,
      device: data.device,
      duration: data.duration,
      referrer: data.referrer,
    });
  } catch {
    // never surface analytics errors to client
  }
  return NextResponse.json({ ok: true });
}