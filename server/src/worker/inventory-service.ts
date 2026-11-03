
import { Hono } from "hono";
import type { WorkerEnvironment } from "./types";
import {
  workerAuthMiddleware,
  customerAuthMiddleware,
} from "./auth";

const inventoryService = new Hono<WorkerEnvironment>();

// GET /api/inventory — platform-owner inventory history.
inventoryService.get("/", workerAuthMiddleware, async (c) => {
  try {
    if (c.get("adminRole") !== "platform_owner") {
      return c.json(
        { success: false, error: "Platform-owner access required." },
        403,
      );
    }

    const result = await c.env.DB.prepare(
      `SELECT *
       FROM inventory_movements
       ORDER BY created_at DESC
       LIMIT 250`,
    ).all<Record<string, unknown>>();

    if (!result.success) {
      throw new Error(result.error || "Inventory query failed.");
    }

    return c.json({
      success: true,
      data: result.results ?? [],
    });
  } catch (error) {
    console.error("Worker inventory query failed:", error);
    return c.json(
      { success: false, error: "Unable to load inventory history." },
      500,
    );
  }
});

// GET /api/inventory/mine — merchant inventory history.
inventoryService.get("/mine", customerAuthMiddleware, async (c) => {
  try {
    const customerId = c.get("customerId");

    if (!customerId) {
      return c.json(
        { success: false, error: "Merchant authentication is required." },
        401,
      );
    }

    const result = await c.env.DB.prepare(
      `SELECT im.*
       FROM inventory_movements im
       WHERE EXISTS (
         SELECT 1
         FROM products p
         WHERE p.id = im.product_id
           AND (
             EXISTS (
               SELECT 1
               FROM stores s
               WHERE s.id = p.store_id
                 AND s.owner_customer_id = ?
             )
             OR EXISTS (
               SELECT 1
               FROM store_products sp
               INNER JOIN stores s ON s.id = sp.store_id
               WHERE sp.product_id = p.id
                 AND s.owner_customer_id = ?
             )
           )
       )
       ORDER BY im.created_at DESC
       LIMIT 250`,
    )
      .bind(customerId, customerId)
      .all<Record<string, unknown>>();

    if (!result.success) {
      throw new Error(result.error || "Merchant inventory query failed.");
    }

    return c.json({
      success: true,
      data: result.results ?? [],
    });
  } catch (error) {
    console.error("Worker merchant inventory query failed:", error);
    return c.json(
      { success: false, error: "Unable to load your inventory history." },
      500,
    );
  }
});

export default inventoryService;
