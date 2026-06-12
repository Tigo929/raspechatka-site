import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { AnalyticsEvent } from "@/types";
import { getDataDirectory } from "@/lib/data-storage";

const MAX_EVENTS = 50_000;
let appendQueue: Promise<void> = Promise.resolve();

function legacyFile() { return path.join(getDataDirectory(), "analytics.json"); }
function eventFile() { return path.join(getDataDirectory(), "analytics.ndjson"); }

async function readLegacyEvents() {
  try {
    const raw = JSON.parse(await readFile(legacyFile(), "utf8")) as unknown;
    return Array.isArray(raw) ? raw as AnalyticsEvent[] : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function readEvents(): Promise<AnalyticsEvent[]> {
  let current: AnalyticsEvent[] = [];
  try {
    const lines = (await readFile(eventFile(), "utf8")).split("\n").filter(Boolean);
    current = lines.flatMap((line) => {
      try { return [JSON.parse(line) as AnalyticsEvent]; } catch { return []; }
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return [...await readLegacyEvents(), ...current].slice(-MAX_EVENTS);
}

export async function appendEvent(input: Omit<AnalyticsEvent, "id" | "timestamp">) {
  const event: AnalyticsEvent = { ...input, id: randomUUID(), timestamp: new Date().toISOString() };
  appendQueue = appendQueue.then(async () => {
    await mkdir(getDataDirectory(), { recursive: true });
    await appendFile(eventFile(), `${JSON.stringify(event)}\n`, "utf8");
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
  const pageviews = events.filter((event) => event.type === "pageview");
  const sessionEnds = events.filter((event) => event.type === "session_end");
  const uniqueSessions = new Set(pageviews.map((event) => event.sessionId)).size;
  const durations = sessionEnds.map((event) => event.duration ?? 0).filter((duration) => duration > 0 && duration < 3600);
  const avgDuration = durations.length ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length) : 0;

  const pageCount: Record<string, number> = {};
  const devices = { mobile: 0, desktop: 0, tablet: 0 };
  const refCount: Record<string, number> = {};
  const sessionPageCount: Record<string, number> = {};
  const ownHost = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname : "";
  for (const event of pageviews) {
    pageCount[event.page] = (pageCount[event.page] ?? 0) + 1;
    devices[event.device] += 1;
    sessionPageCount[event.sessionId] = (sessionPageCount[event.sessionId] ?? 0) + 1;
    if (event.referrer) {
      try {
        const host = new URL(event.referrer).hostname;
        if (host && host !== ownHost && host !== "localhost" && host !== "127.0.0.1") refCount[host] = (refCount[host] ?? 0) + 1;
      } catch { /* Игнорируем повреждённый referrer. */ }
    }
  }

  const topPages = Object.entries(pageCount).sort(([, a], [, b]) => b - a).slice(0, 10).map(([page, views]) => ({ page, views }));
  const topReferrers = Object.entries(refCount).sort(([, a], [, b]) => b - a).slice(0, 8).map(([referrer, count]) => ({ referrer, count }));
  const daily = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    const dateString = date.toISOString().slice(0, 10);
    const dayViews = pageviews.filter((event) => event.timestamp.slice(0, 10) === dateString);
    return { date: dateString, views: dayViews.length, sessions: new Set(dayViews.map((event) => event.sessionId)).size };
  });
  const sessionCounts = Object.values(sessionPageCount);
  const bounceRate = sessionCounts.length ? Math.round(sessionCounts.filter((count) => count === 1).length / sessionCounts.length * 100) : 0;
  return { totalPageviews: pageviews.length, uniqueSessions, avgDuration, topPages, devices, daily, topReferrers, bounceRate };
}
