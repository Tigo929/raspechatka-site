type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

function evictExpired(now: number) {
  for (const [bucketKey, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(bucketKey);
  }
}

export function allowRequest(
  key: string,
  options: { limit: number; windowMs: number },
) {
  const now = Date.now();

  // Чистим протухшие корзины при разрастании карты — иначе поток уникальных
  // IP может неограниченно растить память (каждый новый ключ создаёт корзину).
  if (buckets.size > 1000) evictExpired(now);

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return true;
  }
  if (current.count >= options.limit) return false;
  current.count += 1;
  return true;
}

export function getRequestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
