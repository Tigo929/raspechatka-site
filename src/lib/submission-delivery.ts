import JSZip from "jszip";
import { getSubmission, readSubmissionFile, updateSubmissionDelivery } from "@/lib/submission-repository";
import type { StoredSubmission, SubmissionFile } from "@/types";

const contactLabels = { telegram: "Telegram", max: "MAX", phone: "Телефон" } as const;

/** Имя файла внутри ZIP-архива для каждого вложения. */
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

/** Упаковывает все файлы заявки в ZIP и отправляет документом. */
async function sendZipArchive(chatId: string, submission: StoredSubmission) {
  const zip = new JSZip();

  // Информация о заказе текстом
  zip.file("order.txt", buildText(submission));

  // Читаем все файлы параллельно и добавляем в архив
  await Promise.all(
    submission.files.map(async (file) => {
      const buffer = await readSubmissionFile(file);
      const baseName = zipFileNames[file.key] ?? file.key;
      const ext = mimeExt[file.mimeType] ?? ".bin";
      // preview-файлы уже имеют расширение в baseName, оригиналы — нет
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

async function send(submission: StoredSubmission) {
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!chatId) throw new Error("TELEGRAM_CHAT_ID не настроен");

  // 1. Текстовое сообщение — менеджер видит заявку даже если архив не дойдёт
  await telegramRequest("sendMessage", JSON.stringify({ chat_id: chatId, text: buildText(submission) }));

  // 2. ZIP-архив с превью и оригиналами
  if (submission.files.length > 0) {
    await sendZipArchive(chatId, submission);
  }
}

export async function deliverSubmission(id: string) {
  const submission = await getSubmission(id);
  if (!submission) throw new Error("not_found");
  try {
    await send(submission);
    return await updateSubmissionDelivery(id, "delivered");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка доставки";
    return updateSubmissionDelivery(id, "failed", message);
  }
}
