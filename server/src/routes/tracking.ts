import { Hono } from "hono";
import { getOrderById } from "../data/store";

const tracking = new Hono();

// Small in-process guard against repeated order/email guessing.
// For multi-instance production hosting, add a shared rate limiter too.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const MAX_TRACKING_KEYS = 5000;

function isRateLimited(key: string, now = Date.now()): boolean {
  let record = attempts.get(key);

  if (!record || record.resetAt <= now) {
    record = { count: 0, resetAt: now + WINDOW_MS };
  }

  record.count += 1;
  attempts.set(key, record);

  // Bound memory use if many different IPs call this endpoint.
  if (attempts.size > MAX_TRACKING_KEYS) {
    for (const [storedKey, value] of attempts) {
      if (value.resetAt <= now) attempts.delete(storedKey);
    }
    while (attempts.size > MAX_TRACKING_KEYS) {
      const oldestKey = attempts.keys().next().value;
      if (!oldestKey) break;
      attempts.delete(oldestKey);
    }
  }

  return record.count > MAX_ATTEMPTS;
}

tracking.post("/lookup", async (c) => {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") || "unknown";

  if (isRateLimited(ip)) {
    return c.json(
      { success: false, error: "Too many tracking attempts. Please wait 15 minutes and try again." },
      429,
    );
  }

  let body: { orderId?: unknown; email?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Enter a valid order number and email." }, 400);
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (
    !orderId || orderId.length > 100 ||
    !email || email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return c.json({ success: false, error: "Enter a valid order number and checkout email." }, 400);
  }

  const order = getOrderById(orderId);

  // Use the same generic message so the endpoint doesn't confirm whether an order ID exists.
  if (!order || String(order.customer_email || "").trim().toLowerCase() !== email) {
    return c.json({ success: false, error: "We could not find an order matching those details." }, 404);
  }

  return c.json({
    success: true,
    data: {
      orderId: order.id,
      status: order.order_status,
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
      trackingNumber: order.tracking_number || null,
      carrier: order.tracking_number ? "Use this tracking number with your carrier" : null,
    },
  });
});

export default tracking;
