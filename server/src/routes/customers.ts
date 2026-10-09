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

          COUNT(*) AS order_count,

          SUM(
            CASE
              WHEN LOWER(TRIM(COALESCE(payment_status, ''))) = 'confirmed'
                AND LOWER(TRIM(COALESCE(payment_status, ''))) != 'refunded'
                AND LOWER(TRIM(COALESCE(order_status, ''))) != 'cancelled'
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
        `
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
      500
    );
  }
});

export default customersRoute;
