import { ImageResponse } from "next/og";
import { siteConfig } from "@/data/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Динамическая OG-картинка для соцсетей и мессенджеров. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0e0e13",
        padding: "72px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            display: "flex",
            fontSize: 40,
            fontWeight: 800,
            color: "white",
            letterSpacing: -1,
          }}
        >
          <span>PRINT</span>
          <span style={{ color: "#ff4a1c" }}>LAB</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.05,
            maxWidth: 900,
            letterSpacing: -2,
          }}
        >
          Печать на футболках, которой хочется хвастаться
        </div>
        <div style={{ fontSize: 30, color: "#a7a7b2", maxWidth: 820 }}>
          С принтом, фото, надписью и логотипом · без минимального тиража ·
          печать от 1 дня
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 26,
          color: "white",
        }}
      >
        <div
          style={{
            background: "#ff4a1c",
            borderRadius: 999,
            padding: "12px 28px",
            fontWeight: 700,
          }}
        >
          Собрать футболку
        </div>
        <div style={{ color: "#a7a7b2" }}>
          {siteConfig.url.replace("https://", "")}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
