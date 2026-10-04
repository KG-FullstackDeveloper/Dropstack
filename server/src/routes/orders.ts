import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

import {
  getAllOrders,
  getOrderById,
  updateOrderRecord,
} from "../data/store";

const ordersRoute = new Hono();
ordersRoute.use("*", authMiddleware);

const ORDER_STATUSES = new Set([
  "payment_pending",
  "payment_confirmed",
  "settlement_pending",
  "ready_to_fulfill",
  "supplier_ordered",
  "shipped",
  "delivered",
  "cancelled",
]);

const PAYMENT_STATUSES = new Set([
  "pending",
  "confirmed",
  "failed",
  "refunded",
]);

const SETTLEMENT_STATUSES = new Set([
  "pending",
  "available",
  "settled",
]);

ordersRoute.get("/", (c) => {
  return c.json({
    success: true,
    data: getAllOrders(),
  });
});

ordersRoute.get("/:id", (c) => {
  const id = c.req.param("id");
  const order = getOrderById(id);

  if (!order) {
    return c.json(
      {
        success: false,
        error: "Order not found.",
      },
      404,
    );
  }

  return c.json({
    success: true,
    data: order,
  });
});

ordersRoute.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const current = getOrderById(id);

  if (!current) {
    return c.json(
      {
        success: false,
        error: "Order not found.",
      },
      404,
    );
  }

  let body: {
    order_status?: unknown;
    status?: unknown;
    payment_status?: unknown;
    tracking_number?: unknown;
    supplier_name?: unknown;
    supplier_order_reference?: unknown;
    settlement_status?: unknown;
    flutterwave_transaction_id?: unknown;
    flutterwave_reference?: unknown;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        success: false,
        error: "Invalid order update data.",
      },
      400,
    );
  }

  const updates: Parameters<typeof updateOrderRecord>[1] = {};
  const requestedOrderStatus = body.order_status ?? body.status;

  if (requestedOrderStatus !== undefined) {
    const nextStatus = String(requestedOrderStatus);
    if (!ORDER_STATUSES.has(nextStatus)) {
      return c.json(
        {
          success: false,
          error: "Invalid order status.",
        },
        400,
      );
    }
    updates.order_status = nextStatus as NonNullable<typeof current.order_status>;
  }

  if (body.payment_status !== undefined) {
    const nextPaymentStatus = String(body.payment_status);
    if (!PAYMENT_STATUSES.has(nextPaymentStatus)) {
      return c.json(
        {
          success: false,
          error: "Invalid payment status.",
        },
        400,
      );
    }
    updates.payment_status = nextPaymentStatus as NonNullable<typeof current.payment_status>;
  }

  if (body.settlement_status !== undefined) {
    const nextSettlementStatus = String(body.settlement_status);
    if (!SETTLEMENT_STATUSES.has(nextSettlementStatus)) {
      return c.json(
        {
          success: false,
          error: "Invalid settlement status.",
        },
        400,
      );
    }
    updates.settlement_status = nextSettlementStatus as NonNullable<typeof current.settlement_status>;
  }

  if (body.tracking_number !== undefined) {
    updates.tracking_number = body.tracking_number
      ? String(body.tracking_number).trim()
      : null;
  }

  if (body.supplier_name !== undefined) {
    updates.supplier_name = body.supplier_name
      ? String(body.supplier_name).trim()
      : null;
  }

  if (body.supplier_order_reference !== undefined) {
    updates.supplier_order_reference = body.supplier_order_reference
      ? String(body.supplier_order_reference).trim()
      : null;
  }

  if (body.flutterwave_transaction_id !== undefined) {
    updates.flutterwave_transaction_id = body.flutterwave_transaction_id
      ? String(body.flutterwave_transaction_id).trim()
      : null;
  }

  if (body.flutterwave_reference !== undefined) {
    updates.flutterwave_reference = body.flutterwave_reference
      ? String(body.flutterwave_reference).trim()
      : null;
  }

  try {
    const order = updateOrderRecord(id, updates);

    return c.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Order update error:", error);

    return c.json(
      {
        success: false,
        error: "Unable to update order.",
      },
      500,
    );
  }
});

export default ordersRoute;
