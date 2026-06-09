import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

/** Заголовок секции: бейдж-надзаголовок + h2 + опциональный подзаголовок. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
  as = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
  as?: "h1" | "h2";
}) {
  const Tag = as;
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {eyebrow}
        </span>
      )}
      <Tag className="font-display text-3xl font-bold tracking-tight text-ink text-balance sm:text-4xl lg:text-5xl">
        {title}
      </Tag>
      {subtitle && (
        <p
          className={cn(
            "max-w-2xl text-base text-muted text-pretty sm:text-lg",
            align === "center" && "mx-auto",
          )}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
