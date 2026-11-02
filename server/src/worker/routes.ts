import { Hono } from "hono";
import type { WorkerEnvironment } from "./types";

import { loginAdmin, signupAdmin } from "./admin-auth";
import { workerAuthMiddleware } from "./auth";
import { loginCustomer, registerCustomer } from "./customer-auth";
import aiService from "./ai-service";

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
routes.post("/auth/customer/register", registerCustomer);
routes.post("/auth/customer/login", loginCustomer);

routes.get("/auth/me", workerAuthMiddleware, async (c) => {
  const admin = await c.env.DB.prepare(
    `SELECT id, email, name, role
     FROM admin_users
     WHERE id = ?
     LIMIT 1`,
  )
    .bind(c.get("adminId"))
    .first<{
      id: string;
      email: string;
      name: string | null;
      role: string | null;
    }>();

  if (!admin) {
    return c.json({ success: false, error: "Admin account not found." }, 404);
  }

  return c.json({
    success: true,
    data: {
      id: admin.id,
      email: admin.email,
      name: admin.name ?? null,
      role: admin.role ?? null,
    },
  });
});

routes.route("/ai", aiService);
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
