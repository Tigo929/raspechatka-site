"use client";

import Link from "next/link";

interface ConsentCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  type?: "personal-data" | "image-rights";
}

/**
 * Обязательный чекбокс согласия.
 * type="personal-data"  — согласие на обработку ПД
 * type="image-rights"   — права на загружаемое изображение
 */
export function ConsentCheckbox({
  id,
  checked,
  onChange,
  type = "personal-data",
}: ConsentCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 select-none"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
        className="accent-accent mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
      />
      {type === "personal-data" ? (
        <span className="text-muted text-xs leading-snug">
          Я соглашаюсь на{" "}
          <Link
            href="/consent"
            target="_blank"
            className="text-ink underline underline-offset-2 hover:no-underline"
          >
            обработку персональных данных
          </Link>{" "}
          и принимаю{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="text-ink underline underline-offset-2 hover:no-underline"
          >
            политику конфиденциальности
          </Link>
          .
        </span>
      ) : (
        <span className="text-muted text-xs leading-snug">
          Я подтверждаю, что имею право использовать загружаемое изображение, и
          понимаю, что оно будет использовано для подготовки макета и выполнения
          заказа.
        </span>
      )}
    </label>
  );
}
