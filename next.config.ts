import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  // data/ пишется в рантайме (заявки, аналитика). Если dev-watcher следит за
  // ней, каждая запись триггерит HMR-пересборку, а hmrRefresh, прилетевший во
  // время гидрации вкладки, убивает её (React 19: setState до mount) — формы
  // выглядят живыми, но не отправляются.
  // dev-сервер проекта работает на webpack — игнор настраиваем на его watcher.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**", "**/data/**", "**/*.log"],
      };
    }
    return config;
  },
  // Глушим предупреждение Turbopack-сборки о наличии webpack-конфига.
  turbopack: {},
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 604800,
    localPatterns: [
      { pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
