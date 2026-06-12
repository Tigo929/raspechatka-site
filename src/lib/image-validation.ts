/** Единая валидация загружаемых изображений для всех роутов с файлами. */

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Проверяет magic-байты файла, чтобы расширение/MIME нельзя было подделать.
 * Принимает JPEG, PNG, WebP.
 */
export function hasValidImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
      buffer.subarray(8, 12).toString("latin1") === "WEBP"
    );
  }
  return false;
}

/**
 * Читает поле формы как изображение: валидирует тип, размер и сигнатуру.
 * Возвращает null, если поле пустое/отсутствует. Бросает Error с человекочитаемым
 * сообщением при нарушении правил.
 */
export async function readImageField(
  form: FormData,
  key: string,
): Promise<{ originalName: string; mimeType: string; buffer: Buffer } | null> {
  const value = form.get(key);
  if (!(value instanceof File) || value.size === 0) return null;
  if (!ALLOWED_IMAGE_TYPES.has(value.type)) {
    throw new Error("Недопустимый формат файла: принимаем PNG, JPG, WebP");
  }
  if (value.size > MAX_IMAGE_SIZE) {
    throw new Error("Файл слишком большой: максимум 10 МБ");
  }
  const buffer = Buffer.from(await value.arrayBuffer());
  if (!hasValidImageSignature(buffer, value.type)) {
    throw new Error("Файл повреждён или имеет неверный формат");
  }
  return { originalName: value.name, mimeType: value.type, buffer };
}
