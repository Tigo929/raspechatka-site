import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: "Контакты",
  description: `Контакты студии печати Распечатка: ${siteConfig.phone}, ${siteConfig.email}. ${siteConfig.address}.`,
  alternates: { canonical: `${siteConfig.url}/contacts` },
  robots: { index: true, follow: true },
};

export default function ContactsPage() {
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
              value={siteConfig.phone}
              href={siteConfig.phoneHref}
            />
            <ContactCard
              icon={<Mail width={22} height={22} />}
              title="Email"
              value={siteConfig.email}
              href={`mailto:${siteConfig.email}`}
            />
            <ContactCard
              icon={<MessageCircle width={22} height={22} />}
              title="Telegram"
              value="Написать в Telegram"
              href={siteConfig.social.telegram}
              external
            />
            <ContactCard
              icon={<MessageCircle width={22} height={22} />}
              title="WhatsApp"
              value="Написать в WhatsApp"
              href={siteConfig.social.whatsapp}
              external
            />
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
                <p className="text-muted mt-1 text-sm">{siteConfig.address}</p>
                <p className="text-muted mt-0.5 text-sm">{siteConfig.hours}</p>
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
              <strong>[ЗАПОЛНИТЬ: ФИО владельца]</strong>
              <br />
              Деятельность осуществляется как физическое лицо.
              <br />
              <span className="text-amber-700">
                После регистрации ИП/ООО здесь необходимо указать ИНН, ОГРН/ОГРНИП
                и полные реквизиты.
              </span>
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
                href={`mailto:${siteConfig.email}`}
                className="text-accent underline underline-offset-2"
              >
                {siteConfig.email}
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
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="border-line hover:border-accent flex items-start gap-4 rounded-2xl border bg-white p-5 transition-colors"
    >
      <span className="bg-accent-soft text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
        {icon}
      </span>
      <div>
        <p className="text-muted text-xs">{title}</p>
        <p className="text-ink mt-0.5 font-semibold">{value}</p>
      </div>
    </a>
  );
}
