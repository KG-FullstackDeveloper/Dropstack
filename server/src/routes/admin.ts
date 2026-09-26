import { Hono } from "hono";

import {
  orders,
  products,
} from "../data/store";

const admin = new Hono();

/*
|--------------------------------------------------------------------------
| GET ADMIN ORDERS
|--------------------------------------------------------------------------
*/

admin.get("/orders", (c) => {
  return c.json({
    success: true,
    data: [...orders].reverse(),
  });
});

/*
|--------------------------------------------------------------------------
| GET ADMIN STATS
|--------------------------------------------------------------------------
*/

admin.get("/stats", (c) => {
  const totalOrders =
    orders.length;

  const pendingOrders =
    orders.filter(
      (order) =>
        order.order_status ===
        "payment_pending"
    ).length;

  const confirmedPayments =
    orders.filter(
      (order) =>
        order.payment_status ===
        "confirmed"
    ).length;

  const totalSales =
    orders.reduce(
      (total, order) =>
        total + order.total,
      0
    );

  const activeProducts =
    products.filter(
      (product) =>
        product.active === 1
    ).length;

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

export default admin;
