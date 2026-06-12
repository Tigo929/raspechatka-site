"use client";

import Script from "next/script";
import { useConsent } from "@/hooks/useConsent";

const YM_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const VK_ID = process.env.NEXT_PUBLIC_VK_PIXEL_ID;

/**
 * Подключает скрипты аналитики ТОЛЬКО после получения согласия пользователя.
 * Yandex.Metrika и Google Analytics — категория "analytics".
 * VK Pixel — категория "marketing".
 *
 * Перезагружается при изменении localStorage (событие storage).
 */
export function AnalyticsScripts() {
  const { hasAnalytics: analytics, hasMarketing: marketing } = useConsent();

  return (
    <>
      {/* ── Яндекс.Метрика (аналитика) ─────────────────────────── */}
      {analytics && YM_ID && (
        <>
          <Script
            id="yandex-metrika"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${YM_ID},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`,
            }}
          />
          <noscript>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element -- официальный noscript-пиксель Метрики */}
              <img
                src={`https://mc.yandex.ru/watch/${YM_ID}`}
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
              />
            </div>
          </noscript>
        </>
      )}

      {/* ── Google Analytics (аналитика) ───────────────────────── */}
      {analytics && GA_ID && (
        <>
          <Script
            id="ga-gtag"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script
            id="ga-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`,
            }}
          />
        </>
      )}

      {/* ── VK Pixel (маркетинг) ───────────────────────────────── */}
      {marketing && VK_ID && (
        <Script
          id="vk-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(){var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.src="https://vk.com/js/api/openapi.js?169",t.onload=function(){VK.Retargeting.Init("${VK_ID}"),VK.Retargeting.Hit()},document.head.appendChild(t)}();`,
          }}
        />
      )}
    </>
  );
}
