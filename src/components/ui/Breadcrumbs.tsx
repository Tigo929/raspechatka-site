import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Хлебные крошки (UI). JSON-LD BreadcrumbList подключается на странице. */
export function Breadcrumbs({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  return (
    <nav aria-label="Хлебные крошки" className="text-sm">
      <ol className="text-muted flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {last ? (
                <span className="text-ink font-medium" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-accent transition-colors"
                >
                  {item.name}
                </Link>
              )}
              {!last && (
                <ChevronRight width={14} height={14} className="text-line" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
