import { Hono } from "hono";
import type { WorkerEnvironment } from "./types";
import { workerAuthMiddleware } from "./auth";

const ordersService = new Hono<WorkerEnvironment>();

ordersService.get("/", workerAuthMiddleware, async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT *
         FROM orders
         ORDER BY created_at DESC, id DESC
         LIMIT 250`,
    ).all<Record<string, unknown>>();

    if (!result.success) {
      throw new Error(result.error || "Order query failed.");
    }

    return c.json({
      success: true,
      data: result.results ?? [],
    });
  } catch (error) {
    console.error("Worker order list failed:", error);
    return c.json({ success: false, error: "Unable to load orders." }, 500);
  }
});

ordersService.get("/:id", workerAuthMiddleware, async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT *
         FROM orders
         WHERE id = ?
         LIMIT 1`,
    )
      .bind(c.req.param("id"))
      .first<Record<string, unknown>>();

    if (!result) {
      return c.json({ success: false, error: "Order not found." }, 404);
    }

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Worker order detail failed:", error);
    return c.json(
      { success: false, error: "Unable to load order details." },
      500,
    );
  }
});

ordersService.patch("/:id", workerAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));

    if (!body || typeof body !== "object") {
      return c.json({ success: false, error: "Invalid order payload." }, 400);
    }

    const allowedFields = [
      "order_status",
      "payment_status",
      "settlement_status",
      "tracking_number",
      "customer_name",
      "customer_email",
      "customer_phone",
      "shipping_address",
      "city",
      "state",
      "postal_code",
      "country",
    ];

    const updates = Object.entries(body).filter(([field]) =>
      allowedFields.includes(field),
    );

    if (updates.length === 0) {
      return c.json(
        { success: false, error: "No order fields to update." },
        400,
      );
    }

    const assignments = updates.map(([field]) => `${field} = ?`);
    const values = updates.map(([, value]) => value);
    values.push(new Date().toISOString(), id);

    const result = await c.env.DB.prepare(
      `UPDATE orders
         SET ${assignments.join(", ")}, updated_at = ?
         WHERE id = ?`,
    )
      .bind(...values)
      .run();

    if (!result.success) {
      throw new Error(result.error || "Order update failed.");
    }

    return c.json({
      success: true,
      data: { id, updated: true },
    });
  } catch (error) {
    console.error("Worker order update failed:", error);
    return c.json({ success: false, error: "Unable to update order." }, 500);
  }
});

export default ordersService;
