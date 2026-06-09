import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Рейтинг звёздами. value — от 0 до 5 (поддерживает половинки округлением). */
export function Stars({
  value,
  className,
  size = 16,
}: {
  value: number;
  className?: string;
  size?: number;
}) {
  const rounded = Math.round(value);
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`Рейтинг ${value} из 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={
            i < rounded ? "fill-accent text-accent" : "fill-line text-line"
          }
          aria-hidden
        />
      ))}
    </span>
  );
}
