"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useConsent } from "@/hooks/useConsent";

function getDevice(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getSessionId(): string {
  const key = "pl_sid";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

function send(body: Record<string, unknown>) {
  const data = JSON.stringify(body);
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([data], { type: "application/json" }));
  } else {
    fetch("/api/analytics", { method: "POST", body: data, keepalive: true }).catch(() => {});
  }
}

export function PageTracker() {
  const pathname = usePathname();
  const { hasAnalytics } = useConsent();

  useEffect(() => {
    if (!hasAnalytics || pathname.startsWith("/admin")) return;

    const sessionId = getSessionId();
    const enterAt = Date.now();
    const device = getDevice();
    const referrer = document.referrer || undefined;

    send({ type: "pageview", page: pathname, sessionId, device, referrer });

    const handleUnload = () => {
      const duration = Math.round((Date.now() - enterAt) / 1000);
      send({ type: "session_end", page: pathname, sessionId, device, duration });
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
    };
  }, [hasAnalytics, pathname]);

  return null;
}
