import { Hono } from "hono";
import { getOrderById } from "../data/store";
const tracking = new Hono();
tracking.post("/lookup", async (c) => {
  let body: { orderId?: unknown; email?: unknown };
  try { body = await c.req.json(); } catch { return c.json({ success: false, error: "Enter a valid order number and email." }, 400); }
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!orderId || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ success: false, error: "Enter a valid order number and checkout email." }, 400);
  const order = getOrderById(orderId);
  if (!order || order.customer_email.toLowerCase() !== email) return c.json({ success: false, error: "We could not find an order matching those details." }, 404);
  return c.json({ success: true, data: { orderId: order.id, status: order.order_status, paymentStatus: order.payment_status, createdAt: order.created_at, trackingNumber: order.tracking_number, carrier: order.tracking_number ? "Use this tracking number with your carrier" : null } });
});
export default tracking;
