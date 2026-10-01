import { Hono } from "hono";

import { getAllOrders, getOrderById } from "../data/store";
import { authMiddleware } from "../middleware/auth";
import { db } from "../database/db";
import type { OrderStatus } from "../types/order";

const ordersRoute = new Hono();

/*
|--------------------------------------------------------------------------
| GET / — all orders
|--------------------------------------------------------------------------
*/

ordersRoute.get("/", (c) => {
  const orders = getAllOrders();

  return c.json({
    success: true,
    data: orders,
  });
});

/*
|--------------------------------------------------------------------------
| GET /:id — single order with items
|--------------------------------------------------------------------------
*/

ordersRoute.get("/:id", (c) => {
  const id = c.req.param("id");
  const order = getOrderById(id);

  if (!order) {
    return c.json(
      {
        success: false,
        error: "Order not found.",
      },
      404
    );
  }

  return c.json({
    success: true,
    data: order,
  });
});

/*
|--------------------------------------------------------------------------
| PUT /:id/status — update order status (protected)
|--------------------------------------------------------------------------
*/

ordersRoute.put("/:id/status", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");

    const body = await c.req.json<{
      order_status?: OrderStatus;
      tracking_number?: string;
      payment_status?: string;
      settlement_status?: string;
    }>();

    const order = getOrderById(id);

    if (!order) {
      return c.json(
        {
          success: false,
          error: "Order not found.",
        },
        404
      );
    }

    const validOrderStatuses: OrderStatus[] = [
      "payment_pending",
      "payment_confirmed",
      "settlement_pending",
      "ready_to_fulfill",
      "supplier_ordered",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (
      body.order_status &&
      !validOrderStatuses.includes(body.order_status)
    ) {
      return c.json(
        {
          success: false,
          error: "Invalid order status.",
        },
        400
      );
    }

    const now = new Date().toISOString();

    const orderStatus = body.order_status ?? order.order_status;
    const trackingNumber =
      body.tracking_number !== undefined
        ? body.tracking_number || null
        : order.tracking_number;
    const paymentStatus = body.payment_status ?? order.payment_status;
    const settlementStatus =
      body.settlement_status ?? order.settlement_status;

    db.prepare(`
      UPDATE orders SET
        order_status = @order_status,
        tracking_number = @tracking_number,
        payment_status = @payment_status,
        settlement_status = @settlement_status,
        updated_at = @updated_at
      WHERE id = @id
    `).run({
      id,
      order_status: orderStatus,
      tracking_number: trackingNumber,
      payment_status: paymentStatus,
      settlement_status: settlementStatus,
      updated_at: now,
    });

    const updated = getOrderById(id);

    return c.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return c.json(
      {
        success: false,
        error: "Unable to update order status.",
      },
      500
    );
  }
});

export default ordersRoute;
