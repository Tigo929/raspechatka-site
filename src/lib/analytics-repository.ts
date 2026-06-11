import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { AnalyticsEvent } from "@/types";

const dataDir = path.join(process.cwd(), "data");
const analyticsFile = path.join(dataDir, "analytics.json");

const MAX_EVENTS = 50_000;

let appendQueue: Promise<void> = Promise.resolve();

async function safeWrite(file: string, data: unknown) {
  await mkdir(dataDir, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tmp, file);
}

async function readEvents(): Promise<AnalyticsEvent[]> {
  try {
    const raw = JSON.parse(await readFile(analyticsFile, "utf8")) as unknown;
    return Array.isArray(raw) ? (raw as AnalyticsEvent[]) : [];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    return [];
  }
}

export async function appendEvent(
  input: Omit<AnalyticsEvent, "id" | "timestamp">,
): Promise<void> {
  appendQueue = appendQueue.then(async () => {
    const events = await readEvents();
    const event: AnalyticsEvent = {
      ...input,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };
    const updated = [...events, event].slice(-MAX_EVENTS);
    await safeWrite(analyticsFile, updated);
  });
  return appendQueue;
}

export interface AnalyticsSummary {
  totalPageviews: number;
  uniqueSessions: number;
  avgDuration: number;
  topPages: { page: string; views: number }[];
  devices: { mobile: number; desktop: number; tablet: number };
  daily: { date: string; views: number; sessions: number }[];
  topReferrers: { referrer: string; count: number }[];
  bounceRate: number;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const events = await readEvents();
  const pageviews = events.filter((e) => e.type === "pageview");
  const sessionEnds = events.filter((e) => e.type === "session_end");

  const uniqueSessions = new Set(pageviews.map((e) => e.sessionId)).size;

  // Avg duration from session_end events that have duration
  const durations = sessionEnds
    .map((e) => e.duration ?? 0)
    .filter((d) => d > 0 && d < 3600);
  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  // Top pages
  const pageCount: Record<string, number> = {};
  for (const e of pageviews) {
    pageCount[e.page] = (pageCount[e.page] ?? 0) + 1;
  }
  const topPages = Object.entries(pageCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([page, views]) => ({ page, views }));

  // Device breakdown
  const devices = { mobile: 0, desktop: 0, tablet: 0 };
  for (const e of pageviews) {
    devices[e.device] = (devices[e.device] ?? 0) + 1;
  }

  // Daily (last 30 days)
  const now = new Date();
  const daily: { date: string; views: number; sessions: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayViews = pageviews.filter(
      (e) => e.timestamp.slice(0, 10) === dateStr,
    );
    const daySessions = new Set(dayViews.map((e) => e.sessionId)).size;
    daily.push({ date: dateStr, views: dayViews.length, sessions: daySessions });
  }

  // Top referrers
  const refCount: Record<string, number> = {};
  for (const e of pageviews) {
    if (e.referrer && e.referrer !== window?.location?.origin) {
      const key = e.referrer.replace(/^https?:\/\//, "").split("/")[0];
      refCount[key] = (refCount[key] ?? 0) + 1;
    }
  }
  const topReferrers = Object.entries(refCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([referrer, count]) => ({ referrer, count }));

  // Bounce rate: sessions with only 1 pageview
  const sessionPageCount: Record<string, number> = {};
  for (const e of pageviews) {
    sessionPageCount[e.sessionId] = (sessionPageCount[e.sessionId] ?? 0) + 1;
  }
  const sessionList = Object.values(sessionPageCount);
  const bouncedSessions = sessionList.filter((c) => c === 1).length;
  const bounceRate =
    sessionList.length > 0
      ? Math.round((bouncedSessions / sessionList.length) * 100)
      : 0;

  return {
    totalPageviews: pageviews.length,
    uniqueSessions,
    avgDuration,
    topPages,
    devices,
    daily,
    topReferrers,
    bounceRate,
  };
}
