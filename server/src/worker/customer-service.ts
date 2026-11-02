
import { Hono } from "hono";
import type { Context } from "hono";
import type { WorkerEnvironment } from "./types";
import { customerAuthMiddleware, workerAuthMiddleware } from "./auth";

const customersService = new Hono<WorkerEnvironment>();

type PlatformCustomer = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  plan: string;
  status: string;
  role: string;
  subscription_expires_at: string | null;
  store_limit: number;
  stores_used: number;
  created_at: string;
  updated_at: string;
};

const requirePlatformOwner = async (
  c: Context<WorkerEnvironment>,
  next: () => Promise<void>,
) => {
  const role = String(c.get("adminRole") || "").trim().toLowerCase();

  if (role !== "platform_owner") {
    return c.json(
      { success: false, error: "Platform owner access required." },
      403,
    );
  }

  await next();
};

const getActiveCustomer = async (
  c: Context<WorkerEnvironment>,
): Promise<PlatformCustomer | null> => {
  const customerId = c.get("customerId");

  if (!customerId) return null;

  const customer = await c.env.DB.prepare(
    `SELECT
       id, name, email, company, plan, status, role,
       subscription_expires_at, store_limit, stores_used,
       created_at, updated_at
     FROM platform_customers
     WHERE id = ?
     LIMIT 1`,
  )
    .bind(customerId)
    .first<PlatformCustomer>();

  if (!customer) return null;

  if (customer.role !== "customer" || customer.status !== "active") {
    return null;
  }

  return customer;
};

const toCustomerResponse = (customer: PlatformCustomer) => ({
  id: customer.id,
  name: customer.name || customer.email,
  email: customer.email,
  company: customer.company ?? null,
  plan: customer.plan,
  role: customer.role,
  status: customer.status,
  subscriptionExpiresAt: customer.subscription_expires_at ?? null,
  storeLimit: Number(customer.store_limit ?? 1),
  storesUsed: Number(customer.stores_used ?? 0),
  createdAt: customer.created_at,
  updatedAt: customer.updated_at,
});

// Platform-owner-only customer list.
// Never return password hashes or unrestricted database records.
customersService.get(
  "/",
  workerAuthMiddleware,
  requirePlatformOwner,
  async (c) => {
    try {
      const result = await c.env.DB.prepare(
        `SELECT
           id, name, email, company, plan, status, role,
           subscription_expires_at, store_limit, stores_used,
           created_at, updated_at
         FROM platform_customers
         ORDER BY created_at DESC, id DESC
         LIMIT 250`,
      ).all<PlatformCustomer>();

      if (!result.success) {
        throw new Error("Customer query failed.");
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

// Keep the existing /all endpoint for compatibility.
customersService.get(
  "/all",
  workerAuthMiddleware,
  requirePlatformOwner,
  async (c) => {
    try {
      const result = await c.env.DB.prepare(
        `SELECT
           id, name, email, company, plan, status, role,
           subscription_expires_at, store_limit, stores_used,
           created_at, updated_at
         FROM platform_customers
         ORDER BY created_at DESC, id DESC
         LIMIT 250`,
      ).all<PlatformCustomer>();

      if (!result.success) {
        throw new Error("Customer query failed.");
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

// Customer can access only their own account.
customersService.get("/me", customerAuthMiddleware, async (c) => {
  try {
    const customer = await getActiveCustomer(c);

    if (!customer) {
      return c.json(
        { success: false, error: "Customer account is unavailable or suspended." },
        403,
      );
    }

    return c.json({
      success: true,
      data: toCustomerResponse(customer),
    });
  } catch (error) {
    console.error("Customer session lookup failed:", error);
    return c.json(
      { success: false, error: "Unable to load customer account." },
      500,
    );
  }
});

// Customer dashboard is restricted to the authenticated customer.
customersService.get("/dashboard", customerAuthMiddleware, async (c) => {
  try {
    const customer = await getActiveCustomer(c);

    if (!customer) {
      return c.json(
        { success: false, error: "Customer account is unavailable or suspended." },
        403,
      );
    }

    return c.json({
      success: true,
      data: toCustomerResponse(customer),
    });
  } catch (error) {
    console.error("Customer dashboard lookup failed:", error);
    return c.json(
      { success: false, error: "Unable to load customer dashboard." },
      500,
    );
  }
});

export default customersService;
