import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { sendShippingUpdateEmail } from "../services/emailService";
import { sendCustomerShippingWhatsAppNotification } from "../services/whatsappService";
import { getAllOrders, getOrderById, updateOrderRecord } from "../data/store";

const ordersRoute = new Hono();

ordersRoute.use("*", authMiddleware);

const ORDER_STATUSES = new Set([
  "payment_pending",
  "payment_review_pending",
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

const SETTLEMENT_STATUSES = new Set(["pending", "available", "settled"]);

const PAYMENT_REQUIRED_ORDER_STATUSES = new Set([
  "payment_confirmed",
  "settlement_pending",
  "ready_to_fulfill",
  "supplier_ordered",
  "shipped",
  "delivered",
]);

// List Global Ecommerce orders.
ordersRoute.get("/", (c) => {
  return c.json({
    success: true,
    data: getAllOrders(),
  });
});

// Retrieve one order by ID.
ordersRoute.get("/:id", (c) => {
  const id = c.req.param("id");

  if (!id) {
    return c.json({ success: false, error: "Order ID is required." }, 400);
  }

  const order = getOrderById(id);

  if (!order) {
    return c.json({ success: false, error: "Order not found." }, 404);
  }

  return c.json({
    success: true,
    data: order,
  });
});

// Update permitted order fields.
ordersRoute.patch("/:id", async (c) => {
  const id = c.req.param("id");

  if (!id) {
    return c.json({ success: false, error: "Order ID is required." }, 400);
  }

  const current = getOrderById(id);

  if (!current) {
    return c.json({ success: false, error: "Order not found." }, 404);
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
    return c.json({ success: false, error: "Invalid order update data." }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return c.json({ success: false, error: "Invalid order update data." }, 400);
  }

  const updates: Parameters<typeof updateOrderRecord>[1] = {};
  const requestedOrderStatus = body.order_status ?? body.status;

  if (requestedOrderStatus !== undefined) {
    if (
      typeof requestedOrderStatus !== "string" ||
      !ORDER_STATUSES.has(requestedOrderStatus)
    ) {
      return c.json({ success: false, error: "Invalid order status." }, 400);
    }

    updates.order_status = requestedOrderStatus as NonNullable<
      typeof current.order_status
    >;
  }

  if (body.payment_status !== undefined) {
    if (
      typeof body.payment_status !== "string" ||
      !PAYMENT_STATUSES.has(body.payment_status)
    ) {
      return c.json({ success: false, error: "Invalid payment status." }, 400);
    }

    if (
      body.payment_status === "confirmed" &&
      current.payment_status !== "confirmed"
    ) {
      return c.json(
        {
          success: false,
          error:
            "Payment confirmation must come from verified payment-provider processing.",
        },
        403,
      );
    }

    if (
      body.payment_status === "refunded" &&
      current.payment_status !== "refunded"
    ) {
      return c.json(
        {
          success: false,
          error:
            "Refund status can only be changed after a refund has been verified.",
        },
        403,
      );
    }

    updates.payment_status = body.payment_status as NonNullable<
      typeof current.payment_status
    >;
  }

  if (body.settlement_status !== undefined) {
    if (
      typeof body.settlement_status !== "string" ||
      !SETTLEMENT_STATUSES.has(body.settlement_status)
    ) {
      return c.json(
        { success: false, error: "Invalid settlement status." },
        400,
      );
    }

    if (
      body.settlement_status !== current.settlement_status &&
      body.settlement_status !== "pending"
    ) {
      return c.json(
        {
          success: false,
          error:
            "Settlement changes must come from verified settlement processing.",
        },
        403,
      );
    }

    updates.settlement_status = body.settlement_status as NonNullable<
      typeof current.settlement_status
    >;
  }

  if (body.tracking_number !== undefined) {
    if (
      body.tracking_number !== null &&
      typeof body.tracking_number !== "string"
    ) {
      return c.json(
        { success: false, error: "Tracking number must be text." },
        400,
      );
    }

    const trackingNumber =
      typeof body.tracking_number === "string"
        ? body.tracking_number.trim()
        : "";

    updates.tracking_number = trackingNumber || null;
  }

  if (body.supplier_name !== undefined) {
    if (body.supplier_name !== null && typeof body.supplier_name !== "string") {
      return c.json(
        { success: false, error: "Supplier name must be text." },
        400,
      );
    }

    const supplierName =
      typeof body.supplier_name === "string" ? body.supplier_name.trim() : "";

    updates.supplier_name = supplierName || null;
  }

  if (body.supplier_order_reference !== undefined) {
    if (
      body.supplier_order_reference !== null &&
      typeof body.supplier_order_reference !== "string"
    ) {
      return c.json(
        {
          success: false,
          error: "Supplier order reference must be text.",
        },
        400,
      );
    }

    const supplierReference =
      typeof body.supplier_order_reference === "string"
        ? body.supplier_order_reference.trim()
        : "";

    updates.supplier_order_reference = supplierReference || null;
  }

  if (body.flutterwave_transaction_id !== undefined) {
    return c.json(
      {
        success: false,
        error:
          "Transaction IDs can only be recorded by verified payment processing.",
      },
      403,
    );
  }

  if (body.flutterwave_reference !== undefined) {
    return c.json(
      {
        success: false,
        error:
          "Payment references can only be recorded by verified payment processing.",
      },
      403,
    );
  }

  const nextOrderStatus = updates.order_status ?? current.order_status;

  const nextPaymentStatus = updates.payment_status ?? current.payment_status;

  const nextTrackingNumber =
    updates.tracking_number !== undefined
      ? updates.tracking_number
      : current.tracking_number;
  const nextSupplierName =
    updates.supplier_name !== undefined
      ? updates.supplier_name
      : current.supplier_name;
  const nextSupplierReference =
    updates.supplier_order_reference !== undefined
      ? updates.supplier_order_reference
      : current.supplier_order_reference;

  if (
    PAYMENT_REQUIRED_ORDER_STATUSES.has(nextOrderStatus ?? "") &&
    nextPaymentStatus !== "confirmed"
  ) {
    return c.json(
      {
        success: false,
        error: "Payment must be confirmed before fulfillment can proceed.",
      },
      400,
    );
  }

  if (
    nextOrderStatus === "shipped" &&
    !String(nextTrackingNumber ?? "").trim()
  ) {
    return c.json(
      {
        success: false,
        error:
          "A tracking number is required before an order can be marked as shipped.",
      },
      400,
    );
  }

  if (
    nextOrderStatus === "supplier_ordered" &&
    (!String(nextSupplierName ?? "").trim() ||
      !String(nextSupplierReference ?? "").trim())
  ) {
    return c.json(
      {
        success: false,
        error:
          "Enter the supplier name and supplier order reference before marking this order as supplier ordered.",
      },
      400,
    );
  }

  try {
    const order = updateOrderRecord(id, updates);

    if (!order) {
      return c.json({ success: false, error: "Order not found." }, 404);
    }

    if (
      order.order_status === "shipped" &&
      (current.order_status !== "shipped" ||
        current.tracking_number !== order.tracking_number)
    ) {
      await sendShippingUpdateEmail({
        orderId: order.id,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        total: order.total,
        currency: order.currency,
        trackingNumber: order.tracking_number,
      });

      // Customer WhatsApp shipping updates are opt-in/configuration gated.
      await sendCustomerShippingWhatsAppNotification({
        orderId: order.id,
        customerPhone: String(order.customer_phone ?? ""),
        trackingNumber: String(order.tracking_number ?? "Not available"),
      });
    }

    return c.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Order update error:", error);

    return c.json({ success: false, error: "Unable to update order." }, 500);
  }
});

export default ordersRoute;
