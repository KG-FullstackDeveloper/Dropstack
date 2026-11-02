import { Hono } from "hono";
import type { WorkerEnvironment } from "./types";
import { customerAuthMiddleware } from "./auth";

const customerService = new Hono<WorkerEnvironment>();

customerService.use("*", customerAuthMiddleware);

customerService.get("/me", async (c) => {
  const customerId = c.get("customerId");

  const customer = await c.env.DB.prepare(
    `SELECT id, name, email, company, plan, role, status, subscription_expires_at, store_limit, stores_used, created_at, updated_at
     FROM platform_customers
     WHERE id = ? LIMIT 1`,
  )
    .bind(customerId)
    .first<{
      id: string;
      name: string | null;
      email: string;
      company: string | null;
      plan: string | null;
      role: string | null;
      status: string | null;
      subscription_expires_at: string | null;
      store_limit: number;
      stores_used: number;
      created_at: string;
      updated_at: string;
    }>();

  if (!customer) {
    return c.json({ success: false, error: "Customer not found." }, 404);
  }

  return c.json({
    success: true,
    data: {
      id: customer.id,
      name: customer.name ?? customer.email.split("@")[0],
      email: customer.email,
      company: customer.company,
      plan: customer.plan ?? "starter",
      role: customer.role ?? "customer",
      status: customer.status ?? "active",
      subscriptionExpiresAt: customer.subscription_expires_at,
      storeLimit: Number(customer.store_limit ?? 1),
      storesUsed: Number(customer.stores_used ?? 0),
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
    },
  });
});

customerService.get("/dashboard", async (c) => {
  const customer = await c.env.DB.prepare(
    `SELECT id, name, email, company, plan, role, status, subscription_expires_at, store_limit, stores_used, created_at, updated_at
     FROM platform_customers
     WHERE id = ? LIMIT 1`,
  )
    .bind(c.get("customerId"))
    .first<{
      id: string;
      name: string | null;
      email: string;
      company: string | null;
      plan: string | null;
      role: string | null;
      status: string | null;
      subscription_expires_at: string | null;
      store_limit: number;
      stores_used: number;
      created_at: string;
      updated_at: string;
    }>();

  if (!customer) {
    return c.json({ success: false, error: "Customer not found." }, 404);
  }

  const storeCount = Number(
    (
      await c.env.DB.prepare(
        `SELECT COUNT(*) AS count FROM stores WHERE id = ? OR LOWER(name) LIKE ? LIMIT 1`,
      )
        .bind(customer.id, `%${customer.email}%`)
        .first<{ count: number }>()
    )?.count ?? 0,
  );

  return c.json({
    success: true,
    data: {
      id: customer.id,
      name: customer.name ?? customer.email.split("@")[0],
      email: customer.email,
      company: customer.company,
      plan: customer.plan ?? "starter",
      status: customer.status ?? "active",
      storeLimit: Number(customer.store_limit ?? 1),
      storesUsed: Number(Math.min(customer.stores_used ?? 0, storeCount)),
      subscriptionExpiresAt: customer.subscription_expires_at,
      createdAt: customer.created_at,
    },
  });
});

export default customerService;
