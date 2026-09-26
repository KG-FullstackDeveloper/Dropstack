import { Hono } from "hono";

import {
orders,
products,
} from "../data/store";

import { createId } from "../utils/id";

import type {
CreateOrderInput,
OrderItem,
} from "../types/order";

const checkout =
new Hono();

checkout.post(
"/",
async (c) => {
try {
const body =
await c.req.json<CreateOrderInput>();

  if (
    !body.customer_name?.trim()
  ) {
    return c.json(
      {
        success: false,
        error:
          "Customer name is required.",
      },
      400
    );
  }

  if (
    !body.customer_email?.trim()
  ) {
    return c.json(
      {
        success: false,
        error:
          "Customer email is required.",
      },
      400
    );
  }

  if (
    !body.shipping_address?.trim()
  ) {
    return c.json(
      {
        success: false,
        error:
          "Shipping address is required.",
      },
      400
    );
  }

  if (
    !body.country?.trim()
  ) {
    return c.json(
      {
        success: false,
        error:
          "Country is required.",
      },
      400
    );
  }

  if (
    !body.currency?.trim()
  ) {
    return c.json(
      {
        success: false,
        error:
          "Currency is required.",
      },
      400
    );
  }

  if (
    typeof body.subtotal !==
      "number" ||
    body.subtotal < 0
  ) {
    return c.json(
      {
        success: false,
        error:
          "Invalid subtotal.",
      },
      400
    );
  }

  const inputItems =
    body.items ?? [];

  const orderItems: OrderItem[] =
    [];

  let calculatedSubtotal = 0;

  for (const inputItem of inputItems) {
    if (
      !inputItem.product_id ||
      !Number.isFinite(
        inputItem.quantity
      ) ||
      inputItem.quantity <= 0
    ) {
      continue;
    }

    const product =
      products.find(
        (item) =>
          item.id ===
            inputItem.product_id &&
          item.active === 1
      );

    if (!product) {
      continue;
    }

    const quantity =
      Math.floor(
        inputItem.quantity
      );

    if (quantity <= 0) {
      continue;
    }

    const sellingPrice =
      Number(
        product.price
      ) || 0;

    const supplierCost =
      Number(
        product.supplier_cost
      ) || 0;

    const shippingCost =
      Number(
        product.shipping_cost
      ) || 0;

    const otherCost =
      Number(
        product.other_cost
      ) || 0;

    const total =
      sellingPrice *
      quantity;

    const totalCost =
      (
        supplierCost +
        shippingCost +
        otherCost
      ) * quantity;

    const profit =
      total -
      totalCost;

    orderItems.push({
      id: createId(
        "item"
      ),

      order_id: "",

      product_id:
        product.id,

      product_name:
        product.name,

      quantity,

      selling_price:
        sellingPrice,

      supplier_cost:
        supplierCost,

      shipping_cost:
        shippingCost,

      other_cost:
        otherCost,

      total,

      profit,
    });

    calculatedSubtotal +=
      total;
  }

  /*
   * If product items were supplied,
   * use the actual product subtotal.
   *
   * Otherwise keep the subtotal
   * supplied by the checkout client.
   */

  const subtotal =
    orderItems.length > 0
      ? calculatedSubtotal
      : body.subtotal;

  const shippingFee =
    typeof body.shipping_fee ===
      "number" &&
    body.shipping_fee >= 0
      ? body.shipping_fee
      : 0;

  const total =
    subtotal +
    shippingFee;

  const now =
    new Date().toISOString();

  const orderId =
    createId("order");

  for (
    const item of orderItems
  ) {
    item.order_id =
      orderId;
  }

  const order = {
    id: orderId,

    customer_name:
      body.customer_name.trim(),

    customer_email:
      body.customer_email.trim(),

    customer_phone:
      body.customer_phone?.trim() ||
      null,

    shipping_address:
      body.shipping_address.trim(),

    city:
      body.city?.trim() ||
      null,

    state:
      body.state?.trim() ||
      null,

    postal_code:
      body.postal_code?.trim() ||
      null,

    country:
      body.country
        .trim()
        .toUpperCase(),

    currency:
      body.currency
        .trim()
        .toUpperCase(),

    subtotal,

    shipping_fee:
      shippingFee,

    total,

    payment_status:
      "pending" as const,

    settlement_status:
      "pending" as const,

    order_status:
      "payment_pending" as const,

    flutterwave_transaction_id:
      null,

    flutterwave_reference:
      body.flutterwave_reference ||
      null,

    supplier_name:
      null,

    supplier_order_reference:
      null,

    tracking_number:
      null,

    created_at: now,

    updated_at: now,

    items:
      orderItems,
  };

  orders.push(order);

  return c.json(
    {
      success: true,

      data: {
        orderId:
          order.id,

        subtotal:
          order.subtotal,

        shippingFee:
          order.shipping_fee,

        total:
          order.total,

        currency:
          order.currency,

        deliveryTime:
          "Delivery time will be confirmed based on the detected market.",

        paymentStatus:
          order.payment_status,

        items:
          order.items,
      },
    },
    201
  );
} catch (error) {
  console.error(
    "Checkout error:",
    error
  );

  return c.json(
    {
      success: false,
      error:
        "Unable to create checkout order.",
    },
    500
  );
}


}
);

export default checkout;
