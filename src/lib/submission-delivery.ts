import { getSubmission, readSubmissionFile, updateSubmissionDelivery } from "@/lib/submission-repository";
import type { StoredSubmission, SubmissionFile } from "@/types";

const contactLabels = { telegram: "Telegram", max: "MAX", phone: "Телефон" } as const;

/** Короткие подписи для каждого вложения в медиагруппе. */
const fileLabels: Record<SubmissionFile["key"], string> = {
  previewImage: "🖼 Превью заказа",
  frontPreview: "🖼 Превью (перед)",
  backPreview: "🖼 Превью (спина)",
  frontImage: "📸 Оригинал (перед)",
  backImage: "📸 Оригинал (спина)",
};

/** Порядок вложений: сначала превью (нагляднее всего), затем оригиналы. */
const fileOrder: SubmissionFile["key"][] = [
  "previewImage",
  "frontPreview",
  "backPreview",
  "frontImage",
  "backImage",
];

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
    const prints = details.prints as Record<string, string | null> | undefined;
    if (prints?.front) lines.push(`Принт спереди: ${prints.front}`);
    if (prints?.back) lines.push(`Принт сзади: ${prints.back}`);
  }
  if (submission.files.length) lines.push("", "📎 Макеты — следующими сообщениями");
  return lines.join("\n");
}

async function telegramRequest(endpoint: string, body: BodyInit) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не настроен");
  const response = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
    method: "POST",
    body,
    headers: typeof body === "string" ? { "Content-Type": "application/json" } : undefined,
    signal: AbortSignal.timeout(endpoint === "sendMessage" ? 8_000 : 30_000),
  });
  const data = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!response.ok || (data && data.ok === false)) {
    throw new Error(`Telegram HTTP ${response.status}: ${data?.description ?? "ошибка"}`);
  }
}

/** Отправляет вложения заявки отдельными фото (медиагруппой или одиночным фото). */
async function sendPhotos(chatId: string, submission: StoredSubmission) {
  const ordered = [...submission.files].sort(
    (a, b) => fileOrder.indexOf(a.key) - fileOrder.indexOf(b.key),
  );

  const photos = await Promise.all(
    ordered.map(async (file) => ({
      buffer: await readSubmissionFile(file),
      mimeType: file.mimeType,
      caption: fileLabels[file.key] ?? file.key,
    })),
  );

  if (photos.length === 1) {
    const form = new FormData();
    form.set("chat_id", chatId);
    form.set("caption", photos[0].caption);
    form.set(
      "photo",
      new Blob([new Uint8Array(photos[0].buffer)], { type: photos[0].mimeType }),
      "photo",
    );
    await telegramRequest("sendPhoto", form);
    return;
  }

  // Telegram ограничивает медиагруппу 10 элементами — у заявки их максимум 5.
  const form = new FormData();
  form.set("chat_id", chatId);
  const media = photos.map((photo, index) => {
    const field = `photo${index}`;
    form.set(field, new Blob([new Uint8Array(photo.buffer)], { type: photo.mimeType }), field);
    return { type: "photo", media: `attach://${field}`, caption: photo.caption };
  });
  form.set("media", JSON.stringify(media));
  await telegramRequest("sendMediaGroup", form);
}

async function send(submission: StoredSubmission) {
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!chatId) throw new Error("TELEGRAM_CHAT_ID не настроен");

  // 1. Текст с деталями уходит всегда — менеджер увидит заявку даже если фото не дойдут.
  await telegramRequest("sendMessage", JSON.stringify({ chat_id: chatId, text: buildText(submission) }));

  // 2. Макеты отдельными фото, чтобы менеджер сразу видел дизайн без скачивания архива.
  if (submission.files.length > 0) {
    await sendPhotos(chatId, submission);
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
