import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "dark";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-200 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-soft hover:bg-accent-hover hover:shadow-lift",
  secondary:
    "bg-ink text-paper hover:bg-ink-soft shadow-soft",
  ghost:
    "bg-transparent text-ink hover:bg-ink/5 border border-line",
  dark: "bg-white/10 text-white backdrop-blur hover:bg-white/20 border border-white/15",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-[0.95rem]",
  lg: "h-14 px-8 text-base",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps & {
  href: string;
  /** Внешняя ссылка (откроется в новой вкладке). */
  external?: boolean;
};

export function Button(props: ButtonAsButton | ButtonAsLink) {
  if ("href" in props && props.href !== undefined) {
    const {
      variant = "primary",
      size = "md",
      className,
      children,
      href,
      external,
    } = props;
    const classes = cn(base, variants[variant], sizes[size], className);
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  const { variant = "primary", size = "md", className, children, ...rest } =
    props;
  const classes = cn(base, variants[variant], sizes[size], className);
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
