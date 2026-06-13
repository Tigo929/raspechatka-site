import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/data/site";
import { getPublicSettings } from "@/lib/content-repository";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  return {
    title: "Контакты",
    description: `Контакты студии печати Распечатка: ${settings.phone}, ${settings.email}. ${settings.address}.`,
    alternates: { canonical: `${siteConfig.url}/contacts` },
    robots: { index: true, follow: true },
  };
}

export default async function ContactsPage() {
  const settings = await getPublicSettings();
  const phoneHref = `tel:${settings.phone.replace(/[^+\d]/g, "")}`;
  return (
    <div className="bg-paper min-h-screen">
      <div className="bg-midnight py-12 sm:py-16">
        <Container>
          <nav className="text-paper/50 mb-4 flex items-center gap-2 text-sm">
            <Link href="/" className="hover:text-paper/80 transition-colors">
              Главная
            </Link>
            <span>/</span>
            <span className="text-paper/70">Контакты</span>
          </nav>
          <h1 className="font-display text-paper text-3xl font-extrabold sm:text-4xl">
            Контакты
          </h1>
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {/* Уведомление о физлице */}
          <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800">
            <strong>Обратите внимание:</strong> сайт принимает предварительные
            заявки. Финальные условия заказа, оплаты и изготовления
            согласуются индивидуально с менеджером.
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <ContactCard
              icon={<Phone width={22} height={22} />}
              title="Телефон"
              value={settings.phone}
              href={phoneHref}
            />
            <ContactCard
              icon={<Mail width={22} height={22} />}
              title="Email"
              value={settings.email}
              href={`mailto:${settings.email}`}
            />
            <ContactCard
              icon={<MessageCircle width={22} height={22} />}
              title="Telegram"
              value="Написать в Telegram"
              href={settings.telegram}
              external
              variant="telegram"
            />
            {settings.max && (
              <ContactCard
                icon={<MessageCircle width={22} height={22} />}
                title="MAX"
                value="Написать в MAX"
                href={settings.max}
                external
                variant="max"
              />
            )}
          </div>

          <div className="border-line mt-8 rounded-2xl border bg-white p-6">
            <div className="flex items-start gap-3">
              <MapPin
                width={22}
                height={22}
                className="text-accent mt-0.5 shrink-0"
              />
              <div>
                <p className="text-ink font-semibold">Адрес</p>
                <p className="text-muted mt-1 text-sm">{settings.address}</p>
                <p className="text-muted mt-0.5 text-sm">{settings.hours}</p>
                <a
                  href={`https://yandex.ru/maps/org/raspechatka/169229058790/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent mt-3 inline-block text-sm font-medium underline underline-offset-2"
                >
                  Открыть на Яндекс.Картах
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t pt-8">
            <h2 className="font-display text-ink text-lg font-bold">
              Реквизиты
            </h2>
            <p className="text-muted mt-2 text-sm">
              <strong>Гулян Тигран Саакович</strong>
              <br />
              Плательщик налога на профессиональный доход (самозанятый).
              <br />
              При получении оплаты выдаётся чек через приложение «Мой налог».
            </p>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-ink text-lg font-bold">
              По вопросам персональных данных
            </h2>
            <p className="text-muted mt-2 text-sm">
              Обращения по вопросам обработки персональных данных направляйте
              на:{" "}
              <a
                href={`mailto:${settings.email}`}
                className="text-accent underline underline-offset-2"
              >
                {settings.email}
              </a>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

function ContactCard({
  icon,
  title,
  value,
  href,
  external,
  variant = "default",
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  href: string;
  external?: boolean;
  variant?: "default" | "telegram" | "max";
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "border-line flex items-start gap-4 rounded-2xl border bg-white p-5 transition-all duration-300",
        variant === "telegram" &&
          "hover:border-[#2AABEE] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(42,171,238,0.6)]",
        variant === "max" &&
          "hover:border-[#7B4FFF] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(123,79,255,0.55)]",
        (!variant || variant === "default") && "hover:border-accent",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          variant === "telegram" && "bg-[#E8F7FF] text-[#229ED9]",
          variant === "max" && "bg-[#F2EBFF] text-[#7B4FFF]",
          (!variant || variant === "default") && "bg-accent-soft text-accent",
        )}
      >
        {icon}
      </span>
      <div>
        <p className="text-muted text-xs">{title}</p>
        <p className="text-ink mt-0.5 font-semibold">{value}</p>
      </div>
    </a>
  );
}
