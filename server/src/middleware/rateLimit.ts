import type { MiddlewareHandler } from "hono";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Small in-process limiter for a single-node deployment. Use a shared store when horizontally scaled. */
export function rateLimit(options: { windowMs: number; limit: number; keyPrefix: string }): MiddlewareHandler {
  return async (c, next) => {
    const now = Date.now();
    const forwarded = c.req.header("x-real-ip") || c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const key = `${options.keyPrefix}:${forwarded}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    c.header("X-RateLimit-Limit", String(options.limit));
    c.header("X-RateLimit-Remaining", String(Math.max(0, options.limit - bucket.count)));
    if (bucket.count > options.limit) {
      c.header("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
      return c.json({ success: false, error: "Too many requests. Please try again later." }, 429);
    }
    await next();
    if (buckets.size > 5000) {
      for (const [bucketKey, value] of buckets) if (value.resetAt <= now) buckets.delete(bucketKey);
    }
  };
}
