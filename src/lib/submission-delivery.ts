import JSZip from "jszip";
import { getSubmission, readSubmissionFile, updateSubmissionDelivery } from "@/lib/submission-repository";
import type { StoredSubmission } from "@/types";

const contactLabels = { telegram: "Telegram", max: "MAX", phone: "Телефон" } as const;

function contactText(submission: StoredSubmission) {
  const value = submission.contact.method === "telegram"
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
    const prints = details.prints as Record<string, string | null> | undefined;
    if (prints?.front) lines.push(`Принт спереди: ${prints.front}`);
    if (prints?.back) lines.push(`Принт сзади: ${prints.back}`);
  }
  if (submission.files.length) lines.push("", "📎 Оригиналы и превью приложены в архиве");
  return lines.join("\n");
}

function buildAlertText(submission: StoredSubmission) {
  const lines = [
    submission.kind === "order" ? "🚨 Новый заказ" : "🚨 Новая заявка",
    `Номер: ${submission.reference}`,
    `Имя: ${submission.name}`,
    `Контакт: ${contactText(submission)}`,
    "Нужно обработать заявку.",
  ];
  if (submission.comment) lines.push(`Комментарий: ${submission.comment}`);
  if (submission.orderDetails?.productName) {
    lines.push(`Товар: ${String(submission.orderDetails.productName)}`);
  }
  return lines.join("\n");
}

async function telegramRequest(endpoint: string, body: BodyInit) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не настроен");
  const response = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
    method: "POST",
    body,
    headers: typeof body === "string" ? { "Content-Type": "application/json" } : undefined,
    signal: AbortSignal.timeout(endpoint === "sendDocument" ? 30_000 : 8_000),
  });
  if (!response.ok) throw new Error(`Telegram вернул HTTP ${response.status}`);
}

async function send(submission: StoredSubmission) {
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!chatId) throw new Error("TELEGRAM_CHAT_ID не настроен");
  const alertText = buildAlertText(submission);
  const text = buildText(submission);

  // Сначала отправляем короткое уведомление, чтобы менеджер в любом случае увидел новую заявку.
  await telegramRequest("sendMessage", JSON.stringify({ chat_id: chatId, text: alertText }));

  if (submission.files.length === 0) {
    return;
  }

  const zip = new JSZip();
  for (const file of submission.files) {
    const label: Record<string, string> = {
      frontImage: "Оригинал_перед",
      backImage: "Оригинал_спина",
      frontPreview: "Превью_перед",
      backPreview: "Превью_спина",
    };
    const extension = file.originalName.includes(".") ? `.${file.originalName.split(".").pop()}` : "";
    zip.file(`${label[file.key] ?? file.key}${extension}`, await readSubmissionFile(file));
  }
  const archive = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const archiveBuffer = archive.buffer.slice(
    archive.byteOffset,
    archive.byteOffset + archive.byteLength,
  ) as ArrayBuffer;
  const form = new FormData();
  form.set("chat_id", chatId);
  form.set("caption", text);
  form.set("document", new Blob([archiveBuffer], { type: "application/zip" }), `${submission.reference}.zip`);
  try {
    await telegramRequest("sendDocument", form);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "неизвестная ошибка";
    await telegramRequest(
      "sendMessage",
      JSON.stringify({
        chat_id: chatId,
        text: `${text}\n\n⚠️ Архив с макетами не приложился автоматически: ${reason}`,
      }),
    );
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
