import { cn } from "@/lib/utils";
import { Container } from "./Container";

/** Вертикальная секция с консистентными отступами и опциональным контейнером. */
export function Section({
  id,
  className,
  containerClassName,
  bare = false,
  children,
}: {
  id?: string;
  className?: string;
  containerClassName?: string;
  /** bare = без внутреннего Container (для full-bleed секций). */
  bare?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-24 py-16 sm:py-20 lg:py-28", className)}
    >
      {bare ? children : <Container className={containerClassName}>{children}</Container>}
    </section>
  );
}
