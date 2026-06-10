import { Check } from "lucide-react";

const items = [
  "Без минимального тиража",
  "Макет в подарок при первом заказе",
  "Печать от 1 дня",
  "Премиальный хлопок 180–240 г/м²",
  "Гарантия на результат",
  "Доставка по всей России",
  "Работаем с юрлицами",
];

/** Бегущая строка преимуществ под hero — снимает базовые возражения сразу. */
export function TrustBar() {
  return (
    <div className="border-line border-y bg-white/50 py-4">
      <div className="mask-fade-x overflow-hidden">
        <div className="flex w-max animate-[marquee_32s_linear_infinite] gap-8 pr-8">
          {[...items, ...items].map((item, i) => (
            <span
              key={i}
              className="text-ink-soft flex shrink-0 items-center gap-2 text-sm font-medium"
            >
              <Check width={16} height={16} className="text-accent" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
