import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: "Политика использования Cookie",
  description:
    "Как Распечатка использует cookie-файлы и технологии аналитики. Управление настройками cookie.",
  alternates: { canonical: `${siteConfig.url}/cookie-policy` },
  robots: { index: true, follow: false },
};

export default function CookiePolicyPage() {
  return (
    <LegalLayout
      title="Политика использования Cookie"
      lastUpdated="01.06.2025"
      lawyerWarning
    >
      <div className="prose prose-slate max-w-none">
        <h2>1. Что такое cookie</h2>
        <p>
          Cookie — это небольшие текстовые файлы, которые сохраняются на вашем
          устройстве при посещении сайта. Они позволяют сайту запоминать ваши
          предпочтения и улучшать работу сервиса.
        </p>

        <h2>2. Какие cookie мы используем</h2>

        <h3>Необходимые cookie</h3>
        <p>
          Обеспечивают базовую функциональность сайта. Не могут быть отключены.
        </p>
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Цель</th>
              <th>Срок</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>printlab_cookie_consent</code>
              </td>
              <td>Хранение вашего выбора настроек cookie</td>
              <td>1 год</td>
            </tr>
            <tr>
              <td>
                <code>printlab_admin_session</code>
              </td>
              <td>Сессия администратора (только для авторизованных)</td>
              <td>12 часов</td>
            </tr>
          </tbody>
        </table>

        <h3>Аналитические cookie</h3>
        <p>
          Используются только при наличии вашего согласия. Помогают нам
          улучшать сайт.
        </p>
        <table>
          <thead>
            <tr>
              <th>Сервис</th>
              <th>Цель</th>
              <th>Политика</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Яндекс.Метрика</td>
              <td>Анализ посещаемости, поведения пользователей</td>
              <td>
                <a
                  href="https://yandex.ru/legal/confidential/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  yandex.ru/legal
                </a>
              </td>
            </tr>
            <tr>
              <td>Google Analytics</td>
              <td>Анализ трафика и конверсий</td>
              <td>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  policies.google.com
                </a>
              </td>
            </tr>
          </tbody>
        </table>

        <h3>Маркетинговые cookie</h3>
        <p>
          Используются только при наличии вашего согласия. Применяются для
          показа релевантной рекламы.
        </p>
        <table>
          <thead>
            <tr>
              <th>Сервис</th>
              <th>Цель</th>
              <th>Политика</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>VK Pixel</td>
              <td>Таргетированная реклама ВКонтакте</td>
              <td>
                <a
                  href="https://vk.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  vk.com/privacy
                </a>
              </td>
            </tr>
            <tr>
              <td>Telegram Widget</td>
              <td>Авторизация через Telegram</td>
              <td>
                <a
                  href="https://telegram.org/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  telegram.org/privacy
                </a>
              </td>
            </tr>
          </tbody>
        </table>

        <h2>3. Как управлять cookie</h2>
        <p>
          Вы можете изменить настройки cookie в любой момент, нажав кнопку
          «Настроить cookie» в баннере при первом посещении или обратившись к
          нам по адресу{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
        </p>
        <p>
          Также вы можете настроить или отключить cookie в настройках вашего
          браузера. Обратите внимание, что отключение необходимых cookie может
          повлиять на работу сайта.
        </p>

        <h2>4. Согласие на cookie</h2>
        <p>
          Подключение аналитических и маркетинговых сервисов происходит только
          после вашего явного согласия через баннер cookie. Без согласия
          никакие данные не передаются третьим сервисам.
        </p>

        <h2>5. Изменения в политике</h2>
        <p>
          Мы оставляем за собой право вносить изменения в данную политику.
          Актуальная версия доступна на этой странице.
        </p>
      </div>
    </LegalLayout>
  );
}
