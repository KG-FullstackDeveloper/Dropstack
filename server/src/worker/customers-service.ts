import { Hono } from "hono";
import type { Context } from "hono";
import type { WorkerEnvironment } from "./types";
import { customerAuthMiddleware, workerAuthMiddleware } from "./auth";

const customersService = new Hono<WorkerEnvironment>();

interface PlatformCustomer {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  plan: string | null;
  status: string | null;
  subscription_expires_at: string | null;
  store_limit: number | null;
  stores_used: number | null;
  created_at: string | null;
  updated_at: string | null;
}

function requirePlatformOwner(
  c: Context<WorkerEnvironment>,
  next: () => Promise<void>,
) {
  const role = String(c.get("adminRole") || "")
    .trim()
    .toLowerCase();

  if (role !== "platform_owner") {
    return c.json(
      {
        success: false,
        error: "Platform owner access required.",
      },
      403,
    );
  }

  return next();
}

async function getCustomerAccount(
  c: Context<WorkerEnvironment>,
): Promise<PlatformCustomer | null> {
  const customerId = c.get("customerId");

  if (!customerId) {
    return null;
  }

  return c.env.DB.prepare(
    `SELECT
       id,
       name,
       email,
       company,
       plan,
       status,
       subscription_expires_at,
       store_limit,
       stores_used,
       created_at,
       updated_at
     FROM platform_customers
     WHERE id = ?
     LIMIT 1`,
  )
    .bind(customerId)
    .first<PlatformCustomer>();
}

function customerIsActive(customer: PlatformCustomer): boolean {
  return String(customer.status || "active")
    .trim()
    .toLowerCase() === "active";
}

function serializeCustomer(customer: PlatformCustomer) {
  return {
    id: customer.id,
    name: customer.name || customer.email,
    email: customer.email,
    company: customer.company ?? null,
    plan: customer.plan || "starter",
    role: "customer",
    status: customer.status || "active",
    subscriptionExpiresAt: customer.subscription_expires_at ?? null,
    storeLimit: Math.max(0, Number(customer.store_limit ?? 1)),
    storesUsed: Math.max(0, Number(customer.stores_used ?? 0)),
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
  };
}

/* -------------------------------------------------------------------------- */
/* Platform owner: list merchant accounts                                     */
/* -------------------------------------------------------------------------- */

customersService.get(
  "/",
  workerAuthMiddleware,
  requirePlatformOwner,
  async (c) => {
    try {
      const result = await c.env.DB.prepare(
        `SELECT
           id,
           name,
           email,
           company,
           plan,
           status,
           subscription_expires_at,
           store_limit,
           stores_used,
           created_at,
           updated_at
         FROM platform_customers
         ORDER BY created_at DESC, id DESC
         LIMIT 250`,
      ).all<PlatformCustomer>();

      if (!result.success) {
        throw new Error("Merchant account query failed.");
      }

      return c.json({
        success: true,
        data: result.results ?? [],
      });
    } catch (error) {
      console.error("Platform customer list failed:", error);

      return c.json(
        {
          success: false,
          error: "Unable to load merchant accounts.",
        },
        500,
      );
    }
  },
);

/* -------------------------------------------------------------------------- */
/* Platform owner: alternate list endpoint                                    */
/* -------------------------------------------------------------------------- */

customersService.get(
  "/all",
  workerAuthMiddleware,
  requirePlatformOwner,
  async (c) => {
    try {
      const result = await c.env.DB.prepare(
        `SELECT
           id,
           name,
           email,
           company,
           plan,
           status,
           subscription_expires_at,
           store_limit,
           stores_used,
           created_at,
           updated_at
         FROM platform_customers
         ORDER BY created_at DESC, id DESC
         LIMIT 250`,
      ).all<PlatformCustomer>();

      if (!result.success) {
        throw new Error("Merchant account query failed.");
      }

      return c.json({
        success: true,
        data: result.results ?? [],
      });
    } catch (error) {
      console.error("Platform customer list failed:", error);

      return c.json(
        {
          success: false,
          error: "Unable to load merchant accounts.",
        },
        500,
      );
    }
  },
);

/* -------------------------------------------------------------------------- */
/* Customer: own account                                                      */
/* -------------------------------------------------------------------------- */

customersService.get("/me", customerAuthMiddleware, async (c) => {
  try {
    const customer = await getCustomerAccount(c);

    if (!customer) {
      return c.json(
        {
          success: false,
          error: "Customer account not found.",
        },
        404,
      );
    }

    if (!customerIsActive(customer)) {
      return c.json(
        {
          success: false,
          error: "Your account is currently inactive.",
        },
        403,
      );
    }

    return c.json({
      success: true,
      data: serializeCustomer(customer),
    });
  } catch (error) {
    console.error("Customer account lookup failed:", error);

    return c.json(
      {
        success: false,
        error: "Unable to load your account.",
      },
      500,
    );
  }
});

/* -------------------------------------------------------------------------- */
/* Customer: dashboard account information                                    */
/* -------------------------------------------------------------------------- */

customersService.get("/dashboard", customerAuthMiddleware, async (c) => {
  try {
    const customer = await getCustomerAccount(c);

    if (!customer) {
      return c.json(
        {
          success: false,
          error: "Customer account not found.",
        },
        404,
      );
    }

    if (!customerIsActive(customer)) {
      return c.json(
        {
          success: false,
          error: "Your account is currently inactive.",
        },
        403,
      );
    }

    return c.json({
      success: true,
      data: {
        ...serializeCustomer(customer),
        accountType: "merchant",
      },
    });
  } catch (error) {
    console.error("Customer dashboard lookup failed:", error);

    return c.json(
      {
        success: false,
        error: "Unable to load your dashboard.",
      },
      500,
    );
  }
});

export default customersService;