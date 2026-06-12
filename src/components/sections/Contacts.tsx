import { MapPin, Clock, Phone, Send } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { MaxButton } from "@/components/ui/MaxButton";
import { PlatformRatings } from "@/components/sections/PlatformRatings";
import { siteConfig } from "@/data/site";
import { getPublicSettings } from "@/lib/content-repository";

export async function Contacts() {
  const settings = await getPublicSettings();
  const phoneHref = `tel:${settings.phone.replace(/[^+\d]/g, "")}`;
  const { lat, lon } = siteConfig.geo;
  // Официальный встраиваемый виджет Яндекс.Карт с меткой на адресе.
  const mapSrc = `https://yandex.ru/map-widget/v1/?ll=${lon}%2C${lat}&z=17&pt=${lon},${lat},pm2rdm`;
  const mapLink = `https://yandex.ru/maps/?ll=${lon}%2C${lat}&z=17&pt=${lon},${lat}`;

  return (
    <Section id="contacts">
      <SectionHeading
        align="left"
        eyebrow="Контакты"
        title="Где нас найти"
        subtitle="Приезжайте в студию или напишите — поможем с заказом онлайн."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Инфо */}
        <Reveal className="flex flex-col gap-6">
          <ul className="flex flex-col gap-5">
            <li className="flex items-start gap-3.5">
              <span className="bg-accent-soft text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <MapPin width={20} height={20} />
              </span>
              <div>
                <p className="text-ink font-semibold">Адрес</p>
                <p className="text-muted text-sm">{settings.address}</p>
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="view"
                  className="text-accent mt-1 inline-block text-sm font-medium hover:underline"
                >
                  Открыть в Яндекс.Картах →
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3.5">
              <span className="bg-accent-soft text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <Clock width={20} height={20} />
              </span>
              <div>
                <p className="text-ink font-semibold">Часы работы</p>
                <p className="text-muted text-sm">{settings.hours}</p>
              </div>
            </li>
            <li className="flex items-start gap-3.5">
              <span className="bg-accent-soft text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <Phone width={20} height={20} />
              </span>
              <div>
                <p className="text-ink font-semibold">Телефон</p>
                <a
                  href={phoneHref}
                  className="text-muted hover:text-accent text-sm transition-colors"
                >
                  {settings.phone}
                </a>
              </div>
            </li>
          </ul>

          <PlatformRatings />

          <div className="flex flex-wrap gap-3">
            <Button href={settings.telegram} external className="w-fit">
              <Send width={18} height={18} /> Telegram
            </Button>
            <MaxButton href={settings.max} className="w-fit" />
          </div>
        </Reveal>

        {/* Карта */}
        <Reveal delay={0.1}>
          <div className="border-line shadow-soft h-full min-h-[340px] overflow-hidden rounded-3xl border">
            <iframe
              src={mapSrc}
              title={`Карта: ${settings.address}`}
              loading="lazy"
              allowFullScreen
              className="h-full min-h-[340px] w-full border-0"
            />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
