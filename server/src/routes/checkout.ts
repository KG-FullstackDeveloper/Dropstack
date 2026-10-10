import { Hono } from "hono";

import { getProductById, insertOrder } from "../data/store";
import { createId } from "../utils/id";

import type {
  CreateOrderInput,
  Order,
  OrderItem,
} from "../types/order";

const checkout = new Hono();

type ShippingMarket =
  | "AFRICA"
  | "UK"
  | "EUROPE"
  | "USA"
  | "CANADA"
  | "OTHER";

const AFRICA = new Set([
  "NG", "GH", "ZA", "KE", "UG", "TZ",
  "RW", "ZM", "ZW", "SN", "CI", "CM",
]);

const EUROPE = new Set([
  "DE", "FR", "ES", "IT", "NL", "BE", "AT",
  "PT", "IE", "SE", "NO", "DK", "FI", "PL",
  "CZ", "CH", "GR",
]);

const USD_TO_CURRENCY: Record<string, number> = {
  USD: 1,
  NGN: 1600,
  GHS: 15.5,
  ZAR: 17.5,
  KES: 129,
  UGX: 3500,
  TZS: 2650,
  GBP: 0.75,
  EUR: 0.86,
  CAD: 1.38,
};

function getShippingMarket(country: string): ShippingMarket {
  if (AFRICA.has(country)) return "AFRICA";
  if (country === "GB") return "UK";
  if (EUROPE.has(country)) return "EUROPE";
  if (country === "US") return "USA";
  if (country === "CA") return "CANADA";
  return "OTHER";
}

function getDefaultCurrency(country: string): string {
  const countryCurrencies: Record<string, string> = {
    NG: "NGN",
    GH: "GHS",
    ZA: "ZAR",
    KE: "KES",
    UG: "UGX",
    TZ: "TZS",
    GB: "GBP",
    US: "USD",
    CA: "CAD",
  };

  if (countryCurrencies[country]) {
    return countryCurrencies[country];
  }

  // Countries using the euro.
  if (
    [
      "DE", "FR", "ES", "IT", "NL", "BE", "AT",
      "PT", "IE", "FI", "GR",
    ].includes(country)
  ) {
    return "EUR";
  }

  // The existing shipping conversion table does not contain
  // exchange rates for every worldwide currency.
  return "USD";
}

function getShippingBaseAmount(market: ShippingMarket): number {
  const fees: Record<ShippingMarket, number> = {
    AFRICA: 15,
    UK: 10,
    EUROPE: 15,
    USA: 20,
    CANADA: 20,
    OTHER: 20,
  };

  return fees[market];
}

function calculateServerShippingFee(
  country: string,
  currency: string,
): number | null {
  const expectedCurrency = getDefaultCurrency(country);

  // Prevent the customer from selecting a cheaper currency
  // to manipulate the server-calculated shipping fee.
  if (currency !== expectedCurrency) {
    return null;
  }

  const conversionRate = USD_TO_CURRENCY[currency];

  if (
    typeof conversionRate !== "number" ||
    !Number.isFinite(conversionRate) ||
    conversionRate <= 0
  ) {
    return null;
  }

  const amount =
    getShippingBaseAmount(getShippingMarket(country)) *
    conversionRate;

  return Number.isFinite(amount)
    ? Math.round(amount * 100) / 100
    : null;
}

checkout.post("/", async (c) => {
  let body: CreateOrderInput;

  try {
    body = await c.req.json<CreateOrderInput>();
  } catch {
    return c.json(
      { success: false, error: "Invalid checkout request body." },
      400,
    );
  }

  try {
    if (!body || typeof body !== "object") {
      return c.json(
        { success: false, error: "Invalid checkout request." },
        400,
      );
    }

    const customerName =
      typeof body.customer_name === "string"
        ? body.customer_name.trim()
        : "";

    const customerEmail =
      typeof body.customer_email === "string"
        ? body.customer_email.trim()
        : "";

    const shippingAddress =
      typeof body.shipping_address === "string"
        ? body.shipping_address.trim()
        : "";

    const country =
      typeof body.country === "string"
        ? body.country.trim().toUpperCase()
        : "";

    const currency =
      typeof body.currency === "string"
        ? body.currency.trim().toUpperCase()
        : "";

    if (!customerName) {
      return c.json(
        { success: false, error: "Customer name is required." },
        400,
      );
    }

    if (
      !customerEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
    ) {
      return c.json(
        { success: false, error: "A valid customer email is required." },
        400,
      );
    }

    if (!shippingAddress) {
      return c.json(
        { success: false, error: "Shipping address is required." },
        400,
      );
    }

    if (!/^[A-Z]{2}$/.test(country)) {
      return c.json(
        { success: false, error: "A valid country code is required." },
        400,
      );
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      return c.json(
        { success: false, error: "A valid currency code is required." },
        400,
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return c.json(
        { success: false, error: "Your cart is empty." },
        400,
      );
    }

    const orderItems: OrderItem[] = [];
    const seenProductIds = new Set<string>();
    let calculatedSubtotal = 0;

    for (const inputItem of body.items) {
      if (
        !inputItem ||
        typeof inputItem.product_id !== "string" ||
        !inputItem.product_id.trim() ||
        !Number.isSafeInteger(inputItem.quantity) ||
        inputItem.quantity <= 0
      ) {
        return c.json(
          {
            success: false,
            error: "The cart contains an invalid product or quantity.",
          },
          400,
        );
      }

      const productId = inputItem.product_id.trim();

      if (seenProductIds.has(productId)) {
        return c.json(
          {
            success: false,
            error: "The cart contains duplicate products. Please refresh your cart.",
          },
          400,
        );
      }

      seenProductIds.add(productId);

      const product = getProductById(productId);

      if (!product || product.active !== 1) {
        return c.json(
          {
            success: false,
            error: "A product is unavailable. Please refresh your cart.",
          },
          400,
        );
      }

      const quantity = inputItem.quantity;
      const sellingPrice = Number(product.price);
      const supplierCost = Number(product.supplier_cost ?? 0);
      const productShippingCost = Number(product.shipping_cost ?? 0);
      const otherCost = Number(product.other_cost ?? 0);

      if (
        !Number.isFinite(sellingPrice) ||
        sellingPrice < 0 ||
        !Number.isFinite(supplierCost) ||
        supplierCost < 0 ||
        !Number.isFinite(productShippingCost) ||
        productShippingCost < 0 ||
        !Number.isFinite(otherCost) ||
        otherCost < 0
      ) {
        console.error("Invalid product pricing:", productId);

        return c.json(
          {
            success: false,
            error: "A product has invalid pricing. Please contact support.",
          },
          500,
        );
      }

      const lineTotal =
        Math.round(sellingPrice * quantity * 100) / 100;

      const totalCost =
        Math.round(
          (supplierCost + productShippingCost + otherCost) *
            quantity *
            100,
        ) / 100;

      const profit =
        Math.round((lineTotal - totalCost) * 100) / 100;

      if (
        !Number.isFinite(lineTotal) ||
        !Number.isFinite(totalCost) ||
        !Number.isFinite(profit)
      ) {
        return c.json(
          { success: false, error: "Unable to calculate the order total." },
          400,
        );
      }

      orderItems.push({
        id: createId("item"),
        order_id: "",
        product_id: product.id,
        product_name: product.name,
        quantity,
        selling_price: sellingPrice,
        supplier_cost: supplierCost,
        shipping_cost: productShippingCost,
        other_cost: otherCost,
        total: lineTotal,
        profit,
      });

      calculatedSubtotal += lineTotal;
    }

    const subtotal =
      Math.round(calculatedSubtotal * 100) / 100;

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return c.json(
        { success: false, error: "Invalid calculated subtotal." },
        400,
      );
    }

    // Both values come from server-side calculations.
    // body.subtotal and body.shipping_fee are never trusted.
    const shippingFee = calculateServerShippingFee(country, currency);

    if (shippingFee === null) {
      return c.json(
        {
          success: false,
          error:
            "The selected country or currency is not supported by the current shipping configuration.",
        },
        400,
      );
    }

    const total =
      Math.round((subtotal + shippingFee) * 100) / 100;

    const now = new Date().toISOString();
    const orderId = createId("order");

    for (const item of orderItems) {
      item.order_id = orderId;
    }

    const order: Order = {
      id: orderId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone:
        typeof body.customer_phone === "string"
          ? body.customer_phone.trim() || null
          : null,
      shipping_address: shippingAddress,
      city:
        typeof body.city === "string"
          ? body.city.trim() || null
          : null,
      state:
        typeof body.state === "string"
          ? body.state.trim() || null
          : null,
      postal_code:
        typeof body.postal_code === "string"
          ? body.postal_code.trim() || null
          : null,
      country,
      currency,
      subtotal,
      shipping_fee: shippingFee,
      total,
      payment_status: "pending",
      settlement_status: "pending",
      order_status: "payment_pending",
      fulfillment_mode: "international_dropship",
      payment_method: "online",
      flutterwave_transaction_id: null,

      // Payment references must be generated/verified by the
      // server-side payment integration, not supplied by the browser.
      flutterwave_reference: null,

      supplier_name: null,
      supplier_order_reference: null,
      tracking_number: null,
      created_at: now,
      updated_at: now,
      items: orderItems,
    };

    insertOrder(order);

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
