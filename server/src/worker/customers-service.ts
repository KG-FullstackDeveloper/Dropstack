import { Hono } from "hono";
import type { Context } from "hono";
import type { WorkerEnvironment } from "./types";
import { customerAuthMiddleware, workerAuthMiddleware } from "./auth";

const customersService = new Hono<WorkerEnvironment>();

const requirePlatformOwner = async (
  c: Context<WorkerEnvironment>,
  next: () => Promise<void>,
) => {
  const role = String(c.get("adminRole") || "");

  if (role !== "platform_owner") {
    return c.json(
      {
        success: false,
        error: "Platform owner access required.",
      },
      403,
    );
  }

  await next();
};

customersService.get(
  "/",
  workerAuthMiddleware,
  requirePlatformOwner,
  async (c) => {
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
      return c.json(
        { success: false, error: "Unable to load customers." },
        500,
      );
    }
  },
);

customersService.get(
  "/all",
  workerAuthMiddleware,
  requirePlatformOwner,
  async (c) => {
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
      return c.json(
        { success: false, error: "Unable to load customers." },
        500,
      );
    }
  },
);

customersService.get("/me", customerAuthMiddleware, async (c) => {
  const customerId = c.get("customerId") ?? c.get("adminId");

  const customer = await c.env.DB.prepare(
    `SELECT * FROM platform_customers WHERE id = ? LIMIT 1`,
  )
    .bind(customerId)
    .first<Record<string, unknown>>();

  if (!customer) {
    return c.json(
      { success: false, error: "Customer account not found." },
      404,
    );
  }

  return c.json({
    success: true,
    data: {
      id: customer.id,
      name: customer.name ?? customer.email,
      email: customer.email,
      company: customer.company ?? null,
      plan: customer.plan ?? "starter",
      role: customer.role ?? "customer",
      status: customer.status ?? "active",
      subscriptionExpiresAt: customer.subscription_expires_at ?? null,
      storeLimit: Number(customer.store_limit ?? 1),
      storesUsed: Number(customer.stores_used ?? 0),
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
    },
  });
});

customersService.get("/dashboard", customerAuthMiddleware, async (c) => {
  const customerId = c.get("customerId") ?? c.get("adminId");

  const customer = await c.env.DB.prepare(
    `SELECT * FROM platform_customers WHERE id = ? LIMIT 1`,
  )
    .bind(customerId)
    .first<Record<string, unknown>>();

  if (!customer) {
    return c.json(
      { success: false, error: "Customer account not found." },
      404,
    );
  }

  return c.json({
    success: true,
    data: {
      id: customer.id,
      name: customer.name ?? customer.email,
      email: customer.email,
      company: customer.company ?? null,
      plan: customer.plan ?? "starter",
      status: customer.status ?? "active",
      subscriptionExpiresAt: customer.subscription_expires_at ?? null,
      storeLimit: Number(customer.store_limit ?? 1),
      storesUsed: Number(customer.stores_used ?? 0),
      createdAt: customer.created_at,
    },
  });
});

export default customersService;
