import { Hono } from "hono";

import {
  getProductById,
  insertOrder,
} from "../data/store";
import { createId } from "../utils/id";
import { sendNewOrderNotificationEmail, sendOrderConfirmationEmail } from "../services/emailService";
import { getShippingInfo } from "../services/shippingService";

import type {
  CreateOrderInput,
  Order,
  OrderItem,
} from "../types/order";

const checkout = new Hono();

checkout.post("/", async (c) => {
  try {
    const body = await c.req.json<CreateOrderInput>();

    if (!body.customer_name?.trim()) {
      return c.json(
        {
          success: false,
          error: "Customer name is required.",
        },
        400,
      );
    }

    if (!body.customer_email?.trim()) {
      return c.json(
        {
          success: false,
          error: "Customer email is required.",
        },
        400,
      );
    }

    if (!body.shipping_address?.trim()) {
      return c.json(
        {
          success: false,
          error: "Shipping address is required.",
        },
        400,
      );
    }

    if (!body.country?.trim()) {
      return c.json(
        {
          success: false,
          error: "Country is required.",
        },
        400,
      );
    }

    if (!body.currency?.trim()) {
      return c.json(
        {
          success: false,
          error: "Currency is required.",
        },
        400,
      );
    }

    if (
      typeof body.subtotal !== "number" ||
      !Number.isFinite(body.subtotal) ||
      body.subtotal < 0
    ) {
      return c.json(
        {
          success: false,
          error: "Invalid subtotal.",
        },
        400,
      );
    }

    const inputItems = body.items ?? [];
    const orderItems: OrderItem[] = [];
    let calculatedSubtotal = 0;

    for (const inputItem of inputItems) {
      if (
        !inputItem.product_id ||
        !Number.isFinite(inputItem.quantity) ||
        inputItem.quantity <= 0
      ) {
        return c.json({ success: false, error: "The cart contains an invalid product quantity." }, 400);
      }

      const product = getProductById(inputItem.product_id);

      if (!product || product.active !== 1) {
        return c.json({ success: false, error: "A product in your cart is no longer available." }, 400);
      }

      const quantity = Math.floor(inputItem.quantity);

      if (quantity <= 0) {
        continue;
      }

      const sellingPrice = Number(product.price) || 0;
      const supplierCost = Number(product.supplier_cost) || 0;
      const shippingCost = Number(product.shipping_cost) || 0;
      const otherCost = Number(product.other_cost) || 0;
      const total = sellingPrice * quantity;
      const totalCost =
        (supplierCost + shippingCost + otherCost) * quantity;
      const profit = total - totalCost;

      orderItems.push({
        id: createId("item"),
        order_id: "",
        product_id: product.id,
        product_name: product.name,
        quantity,
        selling_price: sellingPrice,
        supplier_cost: supplierCost,
        shipping_cost: shippingCost,
        other_cost: otherCost,
        total,
        profit,
      });

      calculatedSubtotal += total;
    }

    if (inputItems.length === 0) {
      return c.json({ success: false, error: "Your cart is empty." }, 400);
    }

    if (orderItems.length === 0) {
      return c.json(
        {
          success: false,
          error: "No valid products were found in the order.",
        },
        400,
      );
    }

    const subtotal = calculatedSubtotal;

    // Shipping fees are determined on the server; never trust a fee supplied by the browser.
    const shippingFee = getShippingInfo(body.country.trim().toUpperCase()).fee;

    const total = subtotal + shippingFee;
    const now = new Date().toISOString();
    const orderId = createId("order");

    for (const item of orderItems) {
      item.order_id = orderId;
    }

    const order: Order = {
      id: orderId,
      customer_name: body.customer_name.trim(),
      customer_email: body.customer_email.trim(),
      customer_phone: body.customer_phone?.trim() || null,
      shipping_address: body.shipping_address.trim(),
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      postal_code: body.postal_code?.trim() || null,
      country: body.country.trim().toUpperCase(),
      currency: body.currency.trim().toUpperCase(),
      subtotal,
      shipping_fee: shippingFee,
      total,
      payment_status: "pending",
      settlement_status: "pending",
      order_status: "payment_pending",
      fulfillment_mode: "international_dropship",
      payment_method: "online",
      flutterwave_transaction_id: null,
      flutterwave_reference: body.flutterwave_reference?.trim() || null,
      supplier_name: null,
      supplier_order_reference: null,
      tracking_number: null,
      created_at: now,
      updated_at: now,
      items: orderItems,
    };

    insertOrder(order);

    const emailDetails = {
      orderId: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      total: order.total,
      currency: order.currency,
      items: order.items.map((item) => ({ product_name: item.product_name, quantity: item.quantity, total: item.total })),
      shippingAddress: [order.shipping_address, order.city, order.state, order.country].filter(Boolean).join(", "),
    };
    await Promise.all([sendOrderConfirmationEmail(emailDetails), sendNewOrderNotificationEmail(emailDetails)]);

    return c.json(
      {
        success: true,
        data: {
          orderId: order.id,
          subtotal: order.subtotal,
          shippingFee: order.shipping_fee,
          total: order.total,
          currency: order.currency,
          deliveryTime:
            "Delivery time will be confirmed based on the detected market.",
          paymentStatus: order.payment_status,
          items: order.items,
        },
      },
      201,
    );
  } catch (error) {
    console.error("Checkout error:", error);

    return c.json(
      {
        success: false,
        error: "Unable to create checkout order.",
      },
      500,
    );
  }
});

export default checkout;
