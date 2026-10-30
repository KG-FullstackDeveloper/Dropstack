import { Hono } from "hono";
import type { WorkerEnvironment } from "./types";
import { workerAuthMiddleware } from "./auth";

const customersService = new Hono<WorkerEnvironment>();

customersService.get("/", workerAuthMiddleware, async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT * FROM customers ORDER BY created_at DESC, id DESC LIMIT 250",
    ).all<Record<string, unknown>>();

    if (!result.success) {
      throw new Error(result.error || "Customer query failed.");
    }

    return c.json({
      success: true,
      data: result.results ?? [],
    });
  } catch (error) {
    console.error("Worker customer list failed:", error);
    return c.json({ success: false, error: "Unable to load customers." }, 500);
  }
});

customersService.get("/all", workerAuthMiddleware, async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT * FROM customers ORDER BY created_at DESC, id DESC LIMIT 250",
    ).all<Record<string, unknown>>();

    if (!result.success) {
      throw new Error(result.error || "Customer query failed.");
    }

    return c.json({
      success: true,
      data: result.results ?? [],
    });
  } catch (error) {
    console.error("Worker customer list failed:", error);
    return c.json({ success: false, error: "Unable to load customers." }, 500);
  }
});

export default customersService;
