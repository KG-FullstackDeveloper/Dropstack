import { Hono } from "hono";
import type { WorkerEnvironment } from "./types";
import { workerAuthMiddleware } from "./auth";

const inventoryService = new Hono<WorkerEnvironment>();

inventoryService.get("/", workerAuthMiddleware, async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT * FROM inventory_movements ORDER BY created_at DESC LIMIT 250`,
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

export default inventoryService;
