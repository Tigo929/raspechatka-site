import type { SubmissionContact } from "@/types";

/**
 * Нормализует и валидирует контакт заявки на сервере.
 * Мутирует переданный объект (приводит username/телефон к каноничному виду)
 * и возвращает текст ошибки или null при успехе.
 *
 * Единый источник правды для всех роутов (заказ, лид, конструктор),
 * чтобы правила контакта не расходились между формами.
 */
export function normalizeContact(contact: SubmissionContact): string | null {
  if (contact.method === "telegram") {
    const username = contact.value.trim().replace(/^@/, "");
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) return "Некорректный Telegram-юзернейм";
    contact.value = username;
    return null;
  }
  // method === "max" | "phone" — оба идентифицируются по номеру телефона
  const phone = contact.value.trim();
  if (phone.length < 6 || !/^[\d\s+()-]+$/.test(phone)) return "Некорректный номер телефона";
  contact.value = phone;
  return null;
}
