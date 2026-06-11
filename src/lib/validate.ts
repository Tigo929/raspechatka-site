import "reflect-metadata";
import { validate, ValidationError } from "class-validator";
import { plainToInstance } from "class-transformer";

/** Форматирует ошибки class-validator в плоский массив строк. */
function flattenErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const err of errors) {
    if (err.constraints) {
      messages.push(...Object.values(err.constraints));
    }
    if (err.children?.length) {
      messages.push(...flattenErrors(err.children));
    }
  }
  return messages;
}

/**
 * Валидирует plain-объект через DTO-класс.
 * Возвращает { data } при успехе или { errors } при ошибке.
 */
export async function validateDto<T extends object>(
  cls: new () => T,
  plain: unknown,
): Promise<{ data: T; errors: null } | { data: null; errors: string[] }> {
  const instance = plainToInstance(cls, plain, {
    excludeExtraneousValues: false,
    enableImplicitConversion: true,
  });

  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: false,
    skipMissingProperties: false,
  });

  if (errors.length) {
    return { data: null, errors: flattenErrors(errors) };
  }

  return { data: instance, errors: null };
}
