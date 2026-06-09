import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  tone = "accent",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "accent" | "ink" | "light";
}) {
  const tones = {
    accent: "bg-accent-soft text-accent",
    ink: "bg-ink text-paper",
    light: "bg-white/15 text-white backdrop-blur",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
