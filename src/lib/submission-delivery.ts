import JSZip from "jszip";
import { getSubmission, listSubmissions, updateSubmissionDelivery } from "@/lib/submission-repository";
import {
  claimNextJob,
  enqueueDeliveryJob,
  failJobStep,
  listOutboxJobs,
  saveJobArchiveDelivered,
  saveJobMessageDelivered,
} from "@/lib/delivery-outbox-repository";
import type { StoredSubmission, SubmissionFile } from "@/types";

const contactLabels = { telegram: "Telegram", max: "MAX", phone: "Телефон" } as const;

const zipFileNames: Record<SubmissionFile["key"], string> = {
  previewImage: "preview.png",
  frontPreview: "preview-front.png",
  backPreview:  "preview-back.png",
  frontImage:   "original-front",
  backImage:    "original-back",
};

const mimeExt: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png":  ".png",
  "image/webp": ".webp",
};

function contactText(submission: StoredSubmission) {
  const value =
    submission.contact.method === "telegram"
      ? `@${submission.contact.value.replace(/^@/, "")}`
      : submission.contact.value;
  return `${value} (${contactLabels[submission.contact.method]})`;
}

function buildText(submission: StoredSubmission) {
  const lines = [
    submission.kind === "order" ? "🛒 Новый заказ" : "🟠 Новая заявка с сайта",
    `Номер: ${submission.reference}`,
    `Имя: ${submission.name}`,
    `Контакт: ${contactText(submission)}`,
  ];
  if (submission.comment) lines.push(`Комментарий: ${submission.comment}`);
  if (submission.orderDetails) {
    const details = submission.orderDetails;
    lines.push("", "📦 Детали заказа:");
    if (details.productName) lines.push(`Товар: ${String(details.productName)}`);
    if (details.color) lines.push(`Цвет: ${String(details.color)}`);
    if (details.size) lines.push(`Размер: ${String(details.size)}`);
    if (details.quantity) lines.push(`Количество: ${String(details.quantity)} шт.`);
    const prints = details.prints as Record<string, string | null> | undefined;
    if (prints?.front) lines.push(`Принт спереди: ${prints.front}`);
    if (prints?.back) lines.push(`Принт сзади: ${prints.back}`);
  }
  if (submission.files.length) lines.push("", "📎 Макеты — в архиве (следующее сообщение)");
  return lines.join("\n");
}

async function telegramRequest(endpoint: string, body: BodyInit) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не настроен");
  const response = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
    method: "POST",
    body,
    headers: typeof body === "string" ? { "Content-Type": "application/json" } : undefined,
    signal: AbortSignal.timeout(endpoint === "sendMessage" ? 8_000 : 60_000),
  });
  const data = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!response.ok || (data && data.ok === false)) {
    throw new Error(`Telegram HTTP ${response.status}: ${data?.description ?? "ошибка"}`);
  }
}

/** Sends the text notification message to Telegram. Exported for TelegramDeliveryProvider. */
export async function sendTelegramTextMessage(submission: StoredSubmission) {
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!chatId) throw new Error("TELEGRAM_CHAT_ID не настроен");
  await telegramRequest("sendMessage", JSON.stringify({ chat_id: chatId, text: buildText(submission) }));
}

/** Packs all submission files into a ZIP and sends as document. Exported for TelegramDeliveryProvider. */
export async function sendTelegramZipArchive(submission: StoredSubmission) {
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!chatId) throw new Error("TELEGRAM_CHAT_ID не настроен");

  const { readSubmissionFile } = await import("@/lib/submission-repository");
  const zip = new JSZip();
  zip.file("order.txt", buildText(submission));

  await Promise.all(
    submission.files.map(async (file) => {
      const buffer = await readSubmissionFile(file);
      const baseName = zipFileNames[file.key] ?? file.key;
      const ext = mimeExt[file.mimeType] ?? ".bin";
      const fileName = baseName.includes(".") ? baseName : `${baseName}${ext}`;
      zip.file(fileName, buffer);
    }),
  );

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const form = new FormData();
  form.set("chat_id", chatId);
  form.set("caption", `📦 ${submission.reference} — ${submission.name}`);
  form.set(
    "document",
    new Blob([new Uint8Array(zipBuffer)], { type: "application/zip" }),
    `${submission.reference}.zip`,
  );
  await telegramRequest("sendDocument", form);
}

async function processSingleJob(
  deliveryProvider: import("@/lib/delivery-provider").SubmissionDeliveryProvider,
): Promise<boolean> {
  const job = await claimNextJob();
  if (!job) return false;

  const submission = await getSubmission(job.submissionId);
  if (!submission) {
    await saveJobMessageDelivered(job.id);
    return true;
  }

  if (job.message.status !== "delivered") {
    try {
      await deliveryProvider.sendMessage(submission);
      await saveJobMessageDelivered(job.id);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Ошибка доставки";
      await failJobStep(job.id, "message", msg);
      await updateSubmissionDelivery(job.submissionId, "failed", msg).catch(() => undefined);
      return true;
    }
  }

  if (job.archive.required && job.archive.status !== "delivered") {
    try {
      await deliveryProvider.sendArchive(submission);
      await saveJobArchiveDelivered(job.id);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Ошибка архива";
      await failJobStep(job.id, "archive", msg);
      await updateSubmissionDelivery(job.submissionId, "failed", msg).catch(() => undefined);
      return true;
    }
  }

  await updateSubmissionDelivery(job.submissionId, "delivered").catch(() => undefined);
  return true;
}

/**
 * Claims and processes up to `limit` outbox jobs (default: 1).
 * Returns the number of jobs processed.
 * Call via after() with { limit: 1 }, or from cron with { limit: 10 }.
 */
export async function processDeliveryOutbox(options?: {
  provider?: import("@/lib/delivery-provider").SubmissionDeliveryProvider;
  limit?: number;
}): Promise<number> {
  const { TelegramDeliveryProvider } = await import("@/lib/delivery-provider");
  const deliveryProvider = options?.provider ?? new TelegramDeliveryProvider();
  const limit = options?.limit ?? 1;

  let processed = 0;
  while (processed < limit) {
    const didWork = await processSingleJob(deliveryProvider);
    if (!didWork) break;
    processed++;
  }
  return processed;
}

/**
 * Finds undelivered submissions without outbox jobs and creates jobs for them.
 * Handles crash-gap: process crashed after createSubmission but before enqueueDeliveryJob.
 * Returns the number of new jobs created.
 */
export async function reconcileOutbox(): Promise<number> {
  const [submissions, jobs] = await Promise.all([listSubmissions(), listOutboxJobs()]);
  const jobSubmissionIds = new Set(jobs.map((j) => j.submissionId));

  const unmatched = submissions.filter(
    (s) => s.status !== "delivered" && !jobSubmissionIds.has(s.id),
  );

  let created = 0;
  for (const s of unmatched) {
    await enqueueDeliveryJob(s.id, s.files.length > 0);
    created++;
  }
  return created;
}

/** @deprecated Use enqueueDeliveryJob + processDeliveryOutbox instead. Kept for migration safety. */
export async function deliverSubmission(id: string) {
  const submission = await getSubmission(id);
  if (!submission) throw new Error("not_found");
  try {
    await sendTelegramTextMessage(submission);
    if (submission.files.length > 0) await sendTelegramZipArchive(submission);
    return await updateSubmissionDelivery(id, "delivered");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка доставки";
    return updateSubmissionDelivery(id, "failed", message);
  }
}
