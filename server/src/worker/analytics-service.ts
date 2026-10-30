import { Hono } from "hono";
import type { WorkerEnvironment } from "./types";
import { workerAuthMiddleware } from "./auth";

const analyticsService = new Hono<WorkerEnvironment>();

analyticsService.get("/", workerAuthMiddleware, async (c) => {
  try {
    const [products, orders, customers] = await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) AS count FROM products").first<{
        count: number;
      }>(),
      c.env.DB.prepare("SELECT COUNT(*) AS count FROM orders").first<{
        count: number;
      }>(),
      c.env.DB.prepare("SELECT COUNT(*) AS count FROM customers").first<{
        count: number;
      }>(),
    ]);

    return c.json({
      success: true,
      data: {
        products: Number(products?.count ?? 0),
        orders: Number(orders?.count ?? 0),
        customers: Number(customers?.count ?? 0),
      },
    });
  } catch (error) {
    console.error("Worker analytics query failed:", error);
    return c.json({ success: false, error: "Unable to load analytics." }, 500);
  }
});

export default analyticsService;
