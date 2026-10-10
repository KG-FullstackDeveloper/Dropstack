import { Hono } from "hono";

import { db } from "../database/db";
import { getAllOrders } from "../data/store";
import { authMiddleware } from "../middleware/auth";

const admin = new Hono();
admin.use("*", authMiddleware);

/*
|--------------------------------------------------------------------------
| GET /admin/orders
|--------------------------------------------------------------------------
*/

admin.get("/orders", (c) => {
  const orders = getAllOrders();

  return c.json({
    success: true,
    data: orders,
  });
});

/*
|--------------------------------------------------------------------------
| GET /admin/stats
|--------------------------------------------------------------------------
*/

admin.get("/stats", (c) => {
  const totalOrders = (
    db.prepare("SELECT COUNT(*) as count FROM orders").get() as {
      count: number;
    }
  ).count;

  const pendingOrders = (
    db
      .prepare(
        "SELECT COUNT(*) as count FROM orders WHERE order_status = 'payment_pending'"
      )
      .get() as { count: number }
  ).count;

  const confirmedPayments = (
    db
      .prepare(
        "SELECT COUNT(*) as count FROM orders WHERE payment_status = 'confirmed'"
      )
      .get() as { count: number }
  ).count;

  const totalSalesRow = db
    .prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders")
    .get() as { total: number };

  const totalSales = totalSalesRow.total;

  const activeProducts = (
    db
      .prepare(
        "SELECT COUNT(*) as count FROM products WHERE active = 1"
      )
      .get() as { count: number }
  ).count;

  return c.json({
    success: true,
    data: {
      totalOrders,
      pendingOrders,
      confirmedPayments,
      totalSales,
      activeProducts,
    },
  });
});

/*
|--------------------------------------------------------------------------
| GET /admin/customers — aggregate unique customers
|--------------------------------------------------------------------------
*/

admin.get("/customers", (c) => {
  const customers = db
    .prepare(`
      SELECT
        customer_email,
        customer_name,
        customer_phone,
        country,
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as total_spend,
        MIN(created_at) as first_order_at,
        MAX(created_at) as last_order_at
      FROM orders
      GROUP BY customer_email
      ORDER BY total_spend DESC
    `)
    .all() as {
    customer_email: string;
    customer_name: string;
    customer_phone: string | null;
    country: string;
    order_count: number;
    total_spend: number;
    first_order_at: string;
    last_order_at: string;
  }[];

  return c.json({
    success: true,
    data: customers,
  });
});

export default admin;
