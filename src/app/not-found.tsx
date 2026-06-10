import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <span className="font-display text-accent text-7xl font-extrabold">
        404
      </span>
      <h1 className="font-display text-ink mt-4 text-3xl font-bold">
        Страница не найдена
      </h1>
      <p className="text-muted mt-3 max-w-md">
        Возможно, ссылка устарела. Загляните в каталог или соберите свою
        футболку в конструкторе.
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
