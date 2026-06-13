import { NextResponse } from "next/server";
import { validateCronSecret } from "@/lib/cron-secret";
import { processDeliveryOutbox, reconcileOutbox } from "@/lib/submission-delivery";

export const runtime = "nodejs";

/** Called by cron (127.0.0.1 only — nginx blocks /api/internal/ from public). */
export async function POST(request: Request) {
  const result = validateCronSecret(
    request.headers.get("x-outbox-secret") ?? "",
    process.env.OUTBOX_CRON_SECRET?.trim(),
  );

  if (result === "not_configured") {
    return NextResponse.json({ error: "OUTBOX_CRON_SECRET не настроен" }, { status: 503 });
  }
  if (result !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reconciled = await reconcileOutbox();
  const processed = await processDeliveryOutbox({ limit: 10 });

  return NextResponse.json({ ok: true, reconciled, processed }, { status: 200 });
}
