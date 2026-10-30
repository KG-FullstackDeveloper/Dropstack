import { Hono } from "hono";
import type { WorkerEnvironment } from "./types";

import { loginAdmin, signupAdmin } from "./admin-auth";
import { workerAuthMiddleware } from "./auth";

import adminService from "./admin-service";
import productsService from "./products-service";
import storesService from "./stores-service";
import customersService from "./customers-service";
import analyticsService from "./analytics-service";
import inventoryService from "./inventory-service";
import discountsService from "./discounts-service";
import ordersService from "./orders-service";
import settingsService from "./settings-service";

const routes = new Hono<WorkerEnvironment>();

routes.get("/health", async (c) => {
  try {
    const result = await c.env.DB.prepare("SELECT 1 AS healthy").first<{
      healthy: number;
    }>();

    if (result?.healthy !== 1) {
      throw new Error("D1 health check failed.");
    }

    return c.json({
      success: true,
      status: "ok",
      service: "custom-ecommerce-api",
      runtime: "cloudflare-workers",
      database: "connected",
    });
  } catch (error) {
    console.error("Worker health check failed:", error);
    return c.json(
      { success: false, status: "error", database: "unavailable" },
      503,
    );
  }
});

routes.post("/auth/login", loginAdmin);
routes.post("/auth/signup", signupAdmin);

routes.get("/auth/me", workerAuthMiddleware, (c) =>
  c.json({
    success: true,
    data: {
      id: c.get("adminId"),
      email: c.get("adminEmail"),
    },
  }),
);

routes.route("/admin", adminService);
routes.route("/products", productsService);
routes.route("/stores", storesService);
routes.route("/customers", customersService);
routes.route("/analytics", analyticsService);
routes.route("/inventory", inventoryService);
routes.route("/discounts", discountsService);
routes.route("/orders", ordersService);
routes.route("/settings", settingsService);

export default routes;
