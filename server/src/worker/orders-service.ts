
import { Hono } from "hono";
import type { WorkerEnvironment } from "./types";
import {
  workerAuthMiddleware,
  customerAuthMiddleware,
} from "./auth";

const ordersService = new Hono<WorkerEnvironment>();

// Platform-owner order list.
ordersService.get("/", workerAuthMiddleware, async (c) => {
  try {
    if (c.get("adminRole") !== "platform_owner") {
      return c.json(
        { success: false, error: "Platform-owner access required." },
        403,
      );
    }

    const result = await c.env.DB.prepare(
      `SELECT *
       FROM orders
       ORDER BY created_at DESC, id DESC
       LIMIT 250`,
    ).all<Record<string, unknown>>();

    if (!result.success) {
      throw new Error(result.error || "Order query failed.");
    }

    return c.json({ success: true, data: result.results ?? [] });
  } catch (error) {
    console.error("Worker order list failed:", error);
    return c.json({ success: false, error: "Unable to load orders." }, 500);
  }
});

// Merchant order list: only orders from stores owned by this merchant.
ordersService.get("/mine", customerAuthMiddleware, async (c) => {
  try {
    const customerId = c.get("customerId");

    if (!customerId) {
      return c.json(
        { success: false, error: "Merchant authentication is required." },
        401,
      );
    }

    const result = await c.env.DB.prepare(
      `SELECT o.*
       FROM orders o
       INNER JOIN stores s ON s.id = o.store_id
       WHERE s.owner_customer_id = ?
       ORDER BY o.created_at DESC, o.id DESC
       LIMIT 250`,
    )
      .bind(customerId)
      .all<Record<string, unknown>>();

    if (!result.success) {
      throw new Error(result.error || "Merchant order query failed.");
    }

    return c.json({ success: true, data: result.results ?? [] });
  } catch (error) {
    console.error("Worker merchant order list failed:", error);
    return c.json(
      { success: false, error: "Unable to load your orders." },
      500,
    );
  }
});

// Platform-owner order details.
ordersService.get("/:id", workerAuthMiddleware, async (c) => {
  try {
    if (c.get("adminRole") !== "platform_owner") {
      return c.json(
        { success: false, error: "Platform-owner access required." },
        403,
      );
    }

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

    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Worker order detail failed:", error);
    return c.json(
      { success: false, error: "Unable to load order details." },
      500,
    );
  }
});

// Merchant order details.
ordersService.get("/mine/:id", customerAuthMiddleware, async (c) => {
  try {
    const customerId = c.get("customerId");

    if (!customerId) {
      return c.json(
        { success: false, error: "Merchant authentication is required." },
        401,
      );
    }

    const result = await c.env.DB.prepare(
      `SELECT o.*
       FROM orders o
       INNER JOIN stores s ON s.id = o.store_id
       WHERE o.id = ?
         AND s.owner_customer_id = ?
       LIMIT 1`,
    )
      .bind(c.req.param("id"), customerId)
      .first<Record<string, unknown>>();

    if (!result) {
      return c.json({ success: false, error: "Order not found." }, 404);
    }

    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Worker merchant order detail failed:", error);
    return c.json(
      { success: false, error: "Unable to load order details." },
      500,
    );
  }
});

// Platform-owner order updates.
ordersService.patch("/:id", workerAuthMiddleware, async (c) => {
  try {
    if (c.get("adminRole") !== "platform_owner") {
      return c.json(
        { success: false, error: "Platform-owner access required." },
        403,
      );
    }

    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));

    if (!body || typeof body !== "object" || Array.isArray(body)) {
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

// Merchant order updates, restricted to their own stores.
ordersService.patch("/mine/:id", customerAuthMiddleware, async (c) => {
  try {
    const customerId = c.get("customerId");

    if (!customerId) {
      return c.json(
        { success: false, error: "Merchant authentication is required." },
        401,
      );
    }

    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return c.json({ success: false, error: "Invalid order payload." }, 400);
    }

    const allowedFields = [
      "order_status",
      "tracking_number",
    ];

    const updates = Object.entries(body).filter(([field]) =>
      allowedFields.includes(field),
    );

    if (updates.length === 0) {
      return c.json(
        { success: false, error: "No permitted order fields to update." },
        400,
      );
    }

    const assignments = updates.map(([field]) => `${field} = ?`);
    const values = updates.map(([, value]) => value);

    values.push(new Date().toISOString(), id, customerId);

    const result = await c.env.DB.prepare(
      `UPDATE orders
       SET ${assignments.join(", ")}, updated_at = ?
       WHERE id = ?
         AND store_id IN (
           SELECT id FROM stores WHERE owner_customer_id = ?
         )`,
    )
      .bind(...values)
      .run();

    if (!result.success) {
      throw new Error(result.error || "Merchant order update failed.");
    }

    if ((result.meta?.changes ?? 0) === 0) {
      return c.json({ success: false, error: "Order not found." }, 404);
    }

    return c.json({
      success: true,
      data: { id, updated: true },
    });
  } catch (error) {
    console.error("Worker merchant order update failed:", error);
    return c.json(
      { success: false, error: "Unable to update order." },
      500,
    );
  }
});

export default ordersService;
