import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { db } from "../database/db";

const customersRoute = new Hono();

customersRoute.use("*", authMiddleware);

/**
 * GET /api/customers
 *
 * Read-only Global Ecommerce customer summaries.
 * Customer records are derived from the Global orders table.
 * Nigeria data is never queried here.
 */
customersRoute.get("/", (c) => {
  try {
    const customers = db
      .prepare(
        `
        SELECT
          (
            SELECT latest.customer_email
            FROM orders AS latest
            WHERE LOWER(TRIM(latest.customer_email)) =
                  LOWER(TRIM(orders.customer_email))
            ORDER BY latest.created_at DESC
            LIMIT 1
          ) AS customer_email,

          (
            SELECT latest.customer_name
            FROM orders AS latest
            WHERE LOWER(TRIM(latest.customer_email)) =
                  LOWER(TRIM(orders.customer_email))
            ORDER BY latest.created_at DESC
            LIMIT 1
          ) AS customer_name,

          (
            SELECT latest.customer_phone
            FROM orders AS latest
            WHERE LOWER(TRIM(latest.customer_email)) =
                  LOWER(TRIM(orders.customer_email))
            ORDER BY latest.created_at DESC
            LIMIT 1
          ) AS customer_phone,

          (
            SELECT latest.country
            FROM orders AS latest
            WHERE LOWER(TRIM(latest.customer_email)) =
                  LOWER(TRIM(orders.customer_email))
            ORDER BY latest.created_at DESC
            LIMIT 1
          ) AS country,

          (
            SELECT latest.currency
            FROM orders AS latest
            WHERE LOWER(TRIM(latest.customer_email)) =
                  LOWER(TRIM(orders.customer_email))
            ORDER BY latest.created_at DESC
            LIMIT 1
          ) AS currency,

          COUNT(*) AS order_count,

          SUM(
            CASE
              WHEN LOWER(TRIM(COALESCE(payment_status, ''))) = 'confirmed'
                AND LOWER(TRIM(COALESCE(order_status, ''))) NOT IN ('cancelled', 'refunded')
                AND COALESCE(currency, '') = COALESCE((
                  SELECT latest.currency
                  FROM orders AS latest
                  WHERE LOWER(TRIM(latest.customer_email)) =
                        LOWER(TRIM(orders.customer_email))
                  ORDER BY latest.created_at DESC
                  LIMIT 1
                ), '')
              THEN COALESCE(total, 0)
              ELSE 0
            END
          ) AS total_spend,

          MIN(created_at) AS first_order_at,
          MAX(created_at) AS last_order_at

        FROM orders

        WHERE TRIM(COALESCE(customer_email, '')) != ''

        GROUP BY LOWER(TRIM(customer_email))

        ORDER BY MAX(created_at) DESC
        `,
      )
      .all();

    return c.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Failed to load customers:", error);

    return c.json(
      {
        success: false,
        error: "Failed to load customers.",
      },
      500,
    );
  }
});

customersRoute.get("/me", (c) => {
  const customerId = ((c as any).get("customerId") ??
    (c as any).get("adminId")) as string | undefined;

  const customer = db
    .prepare(
      `SELECT id, name, email, company, plan, role, status, subscription_expires_at, store_limit, stores_used, created_at, updated_at
       FROM platform_customers
       WHERE id = ? LIMIT 1`,
    )
    .get(customerId) as
    | {
        id: string;
        name: string;
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
      }
    | undefined;

  if (!customer) {
    return c.json(
      { success: false, error: "Customer account not found." },
      404,
    );
  }

  if ((customer.status || "active").toLowerCase() === "suspended") {
    return c.json(
      { success: false, error: "This account has been suspended." },
      403,
    );
  }

  return c.json({
    success: true,
    data: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      company: customer.company,
      plan: customer.plan || "starter",
      role: customer.role || "customer",
      status: customer.status || "active",
      subscriptionExpiresAt: customer.subscription_expires_at,
      storeLimit: Number(customer.store_limit || 1),
      storesUsed: Number(customer.stores_used || 0),
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
    },
  });
});

customersRoute.get("/dashboard", (c) => {
  const customerId = ((c as any).get("customerId") ??
    (c as any).get("adminId")) as string | undefined;

  const customer = db
    .prepare(
      `SELECT id, name, email, company, plan, role, status, subscription_expires_at, store_limit, stores_used, created_at
       FROM platform_customers
       WHERE id = ? LIMIT 1`,
    )
    .get(customerId) as
    | {
        id: string;
        name: string;
        email: string;
        company: string | null;
        plan: string | null;
        role: string | null;
        status: string | null;
        subscription_expires_at: string | null;
        store_limit: number;
        stores_used: number;
        created_at: string;
      }
    | undefined;

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
      name: customer.name,
      email: customer.email,
      company: customer.company,
      plan: customer.plan || "starter",
      role: customer.role || "customer",
      status: customer.status || "active",
      subscriptionExpiresAt: customer.subscription_expires_at,
      storeLimit: Number(customer.store_limit || 1),
      storesUsed: Number(customer.stores_used || 0),
      createdAt: customer.created_at,
    },
  });
});

export default customersRoute;
