import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AlertTriangle } from "lucide-react";

interface LegalLayoutProps {
  title: string;
  lastUpdated?: string;
  /** Показывать предупреждение о проверке юристом */
  lawyerWarning?: boolean;
  children: ReactNode;
}

export function LegalLayout({
  title,
  lastUpdated,
  lawyerWarning = true,
  children,
}: LegalLayoutProps) {
  return (
    <div className="bg-paper min-h-screen">
      <div className="bg-midnight py-12 sm:py-16">
        <Container>
          <nav className="text-paper/50 mb-4 flex items-center gap-2 text-sm">
            <Link href="/" className="hover:text-paper/80 transition-colors">
              Главная
            </Link>
            <span>/</span>
            <span className="text-paper/70">{title}</span>
          </nav>
          <h1 className="font-display text-paper text-3xl font-extrabold sm:text-4xl">
            {title}
          </h1>
          {lastUpdated && (
            <p className="text-paper/50 mt-2 text-sm">
              Последнее обновление: {lastUpdated}
            </p>
          )}
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        {lawyerWarning && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            <AlertTriangle
              width={18}
              height={18}
              className="mt-0.5 shrink-0 text-amber-500"
            />
            <div>
              <strong>Важно для владельца сайта:</strong> этот текст является
              шаблоном и должен быть проверен юристом перед публикацией. Особенно
              важно: заполните все поля, отмеченные как{" "}
              <span className="font-mono">[ЗАПОЛНИТЬ]</span>. Поскольку вы
              являетесь физическим лицом без ИП/ООО, ряд формулировок может
              потребовать корректировки.
            </div>
          </div>
        )}

        <div className="legal-content mx-auto max-w-3xl">{children}</div>
      </Container>
    </div>
  );
}
