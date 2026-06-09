import {
  BadgeCheck,
  CalendarClock,
  Clock,
  Lock,
  PackageCheck,
  Palette,
  Printer,
  RefreshCcw,
  ShieldCheck,
  Shirt,
  type LucideIcon,
} from "lucide-react";

/** Иконки, доступные data-слою по строковому имени (benefits, guarantees). */
const iconMap: Record<string, LucideIcon> = {
  Printer,
  Shirt,
  Clock,
  Palette,
  PackageCheck,
  ShieldCheck,
  BadgeCheck,
  CalendarClock,
  Lock,
  RefreshCcw,
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = iconMap[name] ?? Shirt;
  return <Cmp className={className} aria-hidden />;
}
