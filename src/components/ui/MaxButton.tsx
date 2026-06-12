import type { AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function MaxIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.527 3.654 1.44 5.156L2 22l4.844-1.44A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 2.5a7.5 7.5 0 110 15 7.5 7.5 0 010-15zm0 2a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" />
    </svg>
  );
}

interface MaxButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function MaxButton({
  href,
  className,
  size = "md",
  showLabel = true,
  children,
  ...props
}: MaxButtonProps) {
  const sizeClasses = {
    sm: "h-10 gap-1.5 rounded-xl px-4 text-xs",
    md: "h-11 gap-2 rounded-2xl px-5 text-sm",
    lg: "h-12 gap-2 rounded-2xl px-6 text-base",
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "max-btn-gradient inline-flex items-center justify-center font-semibold text-white",
        "active:scale-[0.97] transition-transform",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      <MaxIcon className="h-[1.1em] w-[1.1em] shrink-0" />
      {showLabel && (children ?? "MAX")}
    </a>
  );
}

/** Compact square icon-only variant for MobileStickyCTA */
export function MaxIconButton({
  href,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Написать в MAX"
      className={cn(
        "max-btn-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white",
        "active:scale-[0.97] transition-transform",
        className,
      )}
      {...props}
    >
      <MaxIcon className="h-5 w-5" />
    </a>
  );
}
