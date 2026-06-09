import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <span className="font-display text-7xl font-extrabold text-accent">404</span>
      <h1 className="mt-4 font-display text-3xl font-bold text-ink">
        Страница не найдена
      </h1>
      <p className="mt-3 max-w-md text-muted">
        Возможно, ссылка устарела. Загляните в каталог или соберите свою футболку
        в конструкторе.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/catalog">В каталог</Button>
        <Button href="/configurator" variant="ghost">
          Собрать футболку 
        </Button>
      </div>
    </Container>
  );
}
