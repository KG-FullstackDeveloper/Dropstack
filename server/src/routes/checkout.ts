import { Hono } from "hono";
import { randomBytes, createHash } from "node:crypto";

import {
  getProductById,
  insertOrder,
  expirePendingReservations,
} from "../data/store";

import type { ReservedOrderInput } from "../data/store";
import { db } from "../database/db";
import { createId } from "../utils/id";

import { sendNewOrderNotificationEmail } from "../services/emailService";
import { sendNewOrderWhatsAppNotification } from "../services/whatsappService";
import { convertCurrencyAmount } from "../services/exchangeRates";
import {
  getShippingSettings,
  resolveShippingOption,
} from "../services/shippingService";

import type { CreateOrderInput, OrderItem } from "../types/order";

import type { ProductVariant } from "../types/product";

const checkout = new Hono();

const MAX_QUANTITY_PER_PRODUCT = 5;
// Global discount redemption records support usage limits and per-customer limits.
db.exec(`
  CREATE TABLE IF NOT EXISTS store_discount_redemptions (
    id TEXT PRIMARY KEY, discount_id TEXT NOT NULL, store_id TEXT NOT NULL, order_id TEXT NOT NULL,
    customer_email TEXT NOT NULL, redeemed_at TEXT NOT NULL, UNIQUE(discount_id, order_id)
  );
  CREATE INDEX IF NOT EXISTS idx_discount_redemptions_customer ON store_discount_redemptions(discount_id, customer_email);
`);


type Workspace = "global" | "nigeria";

function normalizeWorkspace(value: unknown): Workspace | null {
  return value === "global" || value === "nigeria" ? value : null;
}

function getVariantName(variant: ProductVariant): string {
  const name = String(variant.name ?? "").trim();
  const value = String(variant.value ?? "").trim();

  if (name && value && name.toLowerCase() !== value.toLowerCase()) {
    return `${name}: ${value}`;
  }

  return name || value || "Selected variant";
}

function getVariantPrice(
  variant: ProductVariant,
  basePrice: number,
): number | undefined {
  const rawPrice = String(variant.price ?? "").trim();

  if (!rawPrice) return basePrice;

  const price = Number(rawPrice);

  if (!Number.isFinite(price) || price < 0) return undefined;

  return price;
}

function createOrderReference(code: string): string {
  // Use a random suffix rather than relying on a predictable sequence.
  const suffix = randomBytes(4).toString("hex").slice(0, 5).toUpperCase();
  return `ORDER-${code}-${suffix}`;
}

checkout.get("/shipping", async (c) => {
  const workspace = normalizeWorkspace(c.req.query("workspace"));
  const storeId = c.req.query("store_id")?.trim();
  const country = c.req.query("country")?.trim().toUpperCase();
  const currency = c.req.query("currency")?.trim().toUpperCase();

  if (
    !workspace ||
    !storeId ||
    !country ||
    !currency ||
    !/^[A-Z]{3}$/.test(currency)
  ) {
    return c.json(
      {
        success: false,
        error: "Workspace, country, and currency are required.",
      },
      400,
    );
  }

  try {
    const store = db
      .prepare(
        `SELECT s.shipping_fee, s.delivery_estimate
         FROM stores s
         LEFT JOIN store_registry_metadata metadata ON metadata.store_id = s.id
         WHERE s.id = ?
           AND LOWER(s.status) = 'active'
           AND COALESCE(metadata.archived, 0) = 0`,
      )
      .get(storeId) as
      | { shipping_fee: number | null; delivery_estimate: string | null }
      | undefined;

    if (!store) {
      return c.json({ success: false, error: "Store is unavailable." }, 404);
    }

    if (workspace === "global") {
      const settings = getShippingSettings(workspace, country);
      return c.json({
        success: true,
        data: {
          policyText: settings.policyText,
          options: [{
            id: "free-shipping",
            name: "Free shipping",
            price: 0,
            minDays: 0,
            maxDays: 0,
            deliveryEstimate: store.delivery_estimate || "Delivery estimate provided after order review",
          }],
        },
      });
    }

    if (store.shipping_fee !== null) {
      return c.json({
        success: true,
        data: {
          policyText: getShippingSettings(workspace, country).policyText,
          options: [
            {
              id: "store-configured",
              name: "Standard delivery",
              price: await convertCurrencyAmount(
                store.shipping_fee,
                "USD",
                currency,
              ),
              minDays: 0,
              maxDays: 0,
              deliveryEstimate:
                store.delivery_estimate ||
                "Delivery time confirmed by the store",
            },
          ],
        },
      });
    }

    const settings = getShippingSettings(workspace, country);
    const options = await Promise.all(
      settings.options
        .filter((option) => option.active)
        .map(async (option) => ({
          id: option.id,
          name: option.name,
          price: await convertCurrencyAmount(option.price, "USD", currency),
          minDays: option.minDays,
          maxDays: option.maxDays,
          deliveryEstimate:
            store.delivery_estimate ||
            (option.minDays === option.maxDays
              ? `${option.minDays} business days`
              : `${option.minDays}–${option.maxDays} business days`),
        })),
    );

    return c.json({
      success: true,
      data: { policyText: settings.policyText, options },
    });
  } catch (error) {
    console.error("Shipping options unavailable:", error);
    return c.json(
      { success: false, error: "Shipping options are currently unavailable." },
      400,
    );
  }
});

checkout.post("/", async (c) => {
  try {
    const body = await c.req.json<CreateOrderInput>();

    try {
      expirePendingReservations();
    } catch (error) {
      console.error("Unable to process expired reservations:", error);
    }

    const customerName = body.customer_name?.trim();
    const customerEmail = body.customer_email?.trim();
    const shippingAddress = body.shipping_address?.trim();
    const country = body.country?.trim().toUpperCase();
    const currency = body.currency?.trim().toUpperCase();

    if (!customerName) {
      return c.json(
        { success: false, error: "Customer name is required." },
        400,
      );
    }

    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return c.json(
        { success: false, error: "Enter a valid customer email address." },
        400,
      );
    }

    if (!shippingAddress) {
      return c.json(
        { success: false, error: "Shipping address is required." },
        400,
      );
    }

    if (!country || !currency) {
      return c.json(
        { success: false, error: "Country and currency are required." },
        400,
      );
    }

    // The client must explicitly identify the workspace and selected method.
    const workspace = normalizeWorkspace(body.workspace);
    const storeId = body.store_id?.trim();
    const shippingMethodId = body.shipping_method_id?.trim();

    if (!workspace) {
      return c.json(
        { success: false, error: "A valid store workspace is required." },
        400,
      );
    }

    if (!storeId) {
      return c.json(
        { success: false, error: "A valid storefront is required." },
        400,
      );
    }

    if (!shippingMethodId) {
      return c.json(
        { success: false, error: "Please select a shipping method." },
        400,
      );
    }

    if (body.shipping_policy_accepted !== true) {
      return c.json(
        {
          success: false,
          error:
            "You must explicitly accept the shipping policy before continuing.",
        },
        400,
      );
    }

    let shippingSettings;
    let selectedShipping;

    try {
      const store = db
        .prepare(
          `SELECT s.shipping_fee, s.delivery_estimate
           FROM stores s
           LEFT JOIN store_registry_metadata metadata ON metadata.store_id = s.id
           WHERE s.id = ?
             AND LOWER(s.status) = 'active'
             AND COALESCE(metadata.archived, 0) = 0`,
        )
        .get(storeId) as
        | { shipping_fee: number | null; delivery_estimate: string | null }
        | undefined;

      if (!store) {
        return c.json({ success: false, error: "Store is unavailable." }, 404);
      }

      shippingSettings = getShippingSettings(workspace, country);

      if (workspace === "global") {
        if (shippingMethodId !== "free-shipping") {
          return c.json(
            { success: false, error: "Free shipping is the only available shipping option." },
            400,
          );
        }

        selectedShipping = {
          id: "free-shipping",
          name: "Free shipping",
          code: "FREE",
          price: 0,
          minDays: 0,
          maxDays: 0,
          deliveryEstimate: store.delivery_estimate || "Delivery estimate provided after order review",
        };
      } else if (store.shipping_fee !== null) {
        if (shippingMethodId !== "store-configured") {
          return c.json(
            {
              success: false,
              error: "The selected shipping option is unavailable.",
            },
            400,
          );
        }

        selectedShipping = {
          id: "store-configured",
          name: "Standard delivery",
          code: "STD",
          price: await convertCurrencyAmount(
            store.shipping_fee,
            "USD",
            currency,
          ),
          minDays: 0,
          maxDays: 0,
          deliveryEstimate:
            store.delivery_estimate || "Delivery time confirmed by the store",
        };
      } else {
        selectedShipping = await resolveShippingOption(
          workspace,
          country,
          shippingMethodId,
          currency,
        );
        if (store.delivery_estimate) {
          selectedShipping.deliveryEstimate = store.delivery_estimate;
        }
      }
    } catch (error) {
      console.error("Shipping configuration error:", error);
      return c.json(
        {
          success: false,
          error: "Shipping is currently unavailable. Please contact the store.",
        },
        400,
      );
    }

    const inputItems = body.items;

    if (!Array.isArray(inputItems) || inputItems.length === 0) {
      return c.json({ success: false, error: "Your cart is empty." }, 400);
    }

    if (inputItems.length > 100) {
      return c.json(
        {
          success: false,
          error: "Too many different products in one order.",
        },
        400,
      );
    }

    const productQuantities = new Map<string, number>();

    for (const item of inputItems) {
      if (
        !item ||
        typeof item.product_id !== "string" ||
        !item.product_id.trim() ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return c.json(
          {
            success: false,
            error: "The cart contains an invalid product quantity.",
          },
          400,
        );
      }

      const id = item.product_id.trim();
      const quantity = (productQuantities.get(id) ?? 0) + item.quantity;

      if (quantity > MAX_QUANTITY_PER_PRODUCT) {
        return c.json(
          {
            success: false,
            error: `Checkout is limited to ${MAX_QUANTITY_PER_PRODUCT} units per product.`,
          },
          400,
        );
      }

      productQuantities.set(id, quantity);
    }

    const orderItems: OrderItem[] = [];
    const requestedStock = new Map<string, number>();
    let subtotal = 0;

    for (const inputItem of inputItems) {
      const product = getProductById(inputItem.product_id.trim());

      if (!product || product.active !== 1) {
        return c.json(
          {
            success: false,
            error: "A product in your cart is no longer available.",
          },
          400,
        );
      }

      const listing = db
        .prepare(
          `SELECT price_override FROM store_products
           WHERE store_id = ? AND product_id = ?`,
        )
        .get(storeId, product.id) as
        | { price_override: number | null }
        | undefined;

      if (!listing) {
        return c.json(
          {
            success: false,
            error: "A product in your cart is not listed in this store.",
          },
          400,
        );
      }

      const variants = product.variants ?? [];
      let selectedVariant: ProductVariant | undefined;

      if (variants.length > 0) {
        const variantId = inputItem.variant_id?.trim();

        if (!variantId) {
          return c.json(
            {
              success: false,
              error: `Please select an option for "${product.name}".`,
            },
            400,
          );
        }

        selectedVariant = variants.find(
          (variant) => String(variant.id) === variantId,
        );

        if (!selectedVariant) {
          return c.json(
            {
              success: false,
              error: `The selected option for "${product.name}" is invalid.`,
            },
            400,
          );
        }
      } else if (inputItem.variant_id?.trim()) {
        return c.json(
          {
            success: false,
            error: `The selected option for "${product.name}" is no longer available.`,
          },
          400,
        );
      }

      const rawStock =
        selectedVariant?.stock !== undefined && selectedVariant?.stock !== null
          ? selectedVariant.stock
          : product.stock;

      const stock = Number(rawStock);

      if (
        rawStock === undefined ||
        rawStock === null ||
        rawStock === "" ||
        !Number.isSafeInteger(stock) ||
        stock < 0
      ) {
        return c.json(
          {
            success: false,
            error: `Stock information for "${product.name}" is unavailable.`,
          },
          409,
        );
      }

      const stockKey = selectedVariant
        ? `${product.id}::variant::${selectedVariant.id}`
        : `${product.id}::product`;

      const previouslyRequested = requestedStock.get(stockKey) ?? 0;

      if (previouslyRequested + inputItem.quantity > stock) {
        return c.json(
          {
            success: false,
            error: `Insufficient stock for "${product.name}". Please update your cart.`,
          },
          409,
        );
      }

      requestedStock.set(stockKey, previouslyRequested + inputItem.quantity);

      const basePrice = Number(listing.price_override ?? product.price);
      const productCurrency = product.currency || "USD";

      if (!Number.isFinite(basePrice) || basePrice < 0) {
        return c.json(
          {
            success: false,
            error: `The price for "${product.name}" is unavailable.`,
          },
          400,
        );
      }

      const productPrice =
        listing.price_override !== null
          ? basePrice
          : selectedVariant
            ? getVariantPrice(selectedVariant, basePrice)
            : basePrice;

      if (
        productPrice === undefined ||
        !Number.isFinite(productPrice) ||
        productPrice < 0
      ) {
        return c.json(
          {
            success: false,
            error: `The selected option for "${product.name}" has an invalid price.`,
          },
          400,
        );
      }

      let price: number;
      let supplierCost: number;
      let shippingCost: number;
      let otherCost: number;

      try {
        [price, supplierCost, shippingCost, otherCost] = await Promise.all([
          convertCurrencyAmount(productPrice, productCurrency, currency),
          convertCurrencyAmount(
            Number(product.supplier_cost) || 0,
            productCurrency,
            currency,
          ),
          convertCurrencyAmount(
            Number(product.shipping_cost) || 0,
            productCurrency,
            currency,
          ),
          convertCurrencyAmount(
            Number(product.other_cost) || 0,
            productCurrency,
            currency,
          ),
        ]);
      } catch (error) {
        console.error("Checkout currency conversion failed:", error);
        return c.json(
          {
            success: false,
            error: `Prices are unavailable in ${currency}. Please try again later.`,
          },
          400,
        );
      }

      const itemTotal = price * inputItem.quantity;
      const profit =
        itemTotal -
        (supplierCost + shippingCost + otherCost) * inputItem.quantity;

      if (!Number.isFinite(itemTotal) || !Number.isFinite(profit)) {
        return c.json(
          {
            success: false,
            error: "Unable to calculate a product total.",
          },
          400,
        );
      }

      orderItems.push({
        id: createId("item"),
        order_id: "",
        product_id: product.id,
        product_name: product.name,
        variant_id: selectedVariant?.id ?? null,
        variant_name: selectedVariant ? getVariantName(selectedVariant) : null,
        quantity: inputItem.quantity,
        selling_price: price,
        supplier_cost: supplierCost,
        shipping_cost: shippingCost,
        other_cost: otherCost,
        total: itemTotal,
        profit,
      });

      subtotal += itemTotal;
    }

    const shippingFee = selectedShipping.price;
    let discountAmount = 0;
    let appliedDiscount: any = null;
    const discountCode = workspace === "global" ? String((body as any).discount_code || "").trim().toUpperCase().replace(/\s+/g, "") : "";

    // Nigeria checkout remains unchanged; only Global checkout redeems these codes.
    if (discountCode) {
      const discount: any = db.prepare("SELECT * FROM store_discounts WHERE store_id = ? AND code = ? AND active = 1").get(storeId, discountCode);
      if (!discount) return c.json({ success: false, error: "This discount code is invalid or inactive." }, 400);
      const nowMs = Date.now();
      if (discount.starts_at && nowMs < Date.parse(discount.starts_at)) return c.json({ success: false, error: "This discount has not started yet." }, 400);
      if (discount.ends_at && nowMs > Date.parse(discount.ends_at)) return c.json({ success: false, error: "This discount has expired." }, 400);
      if (discount.usage_limit != null && Number(discount.usage_count) >= Number(discount.usage_limit)) return c.json({ success: false, error: "This discount has reached its usage limit." }, 400);
      if (discount.minimum_order_amount != null && subtotal < Number(discount.minimum_order_amount)) return c.json({ success: false, error: `Minimum order subtotal is ${discount.minimum_order_amount}.` }, 400);
      const productIds: string[] = JSON.parse(discount.product_ids || "[]");
      const eligible = orderItems.filter(item => discount.type === "order_amount" || productIds.length === 0 || productIds.includes(item.product_id));
      const eligibleQty = eligible.reduce((sum, item) => sum + item.quantity, 0);
      if (discount.minimum_quantity != null && eligibleQty < Number(discount.minimum_quantity)) return c.json({ success: false, error: `Add at least ${discount.minimum_quantity} qualifying item(s).` }, 400);
      if (discount.per_customer_limit != null) {
        const prior = db.prepare("SELECT COUNT(*) AS count FROM store_discount_redemptions WHERE discount_id = ? AND LOWER(customer_email) = LOWER(?)").get(discount.id, customerEmail) as { count: number };
        if (prior.count >= Number(discount.per_customer_limit)) return c.json({ success: false, error: "You have already used this discount the maximum number of times." }, 400);
      }
      if (discount.type === "order_amount") discountAmount = Math.min(subtotal, Number(discount.value));
      else if (discount.type === "product_amount") discountAmount = Math.min(eligible.reduce((sum, item) => sum + item.total, 0), Number(discount.value));
      else if (discount.type === "buy_x_get_y") {
        const buy = Math.max(1, Number(discount.buy_quantity || 1)); const get = Math.max(1, Number(discount.get_quantity || 1));
        const freeUnits = Math.floor(eligibleQty / (buy + get)) * get;
        const prices = eligible.flatMap(item => Array.from({ length: item.quantity }, () => item.selling_price)).sort((a, b) => a - b);
        discountAmount = prices.slice(0, freeUnits).reduce((sum, price) => sum + price, 0) * Math.min(100, Math.max(0, Number(discount.get_discount_percent ?? 100))) / 100;
      }
      // Global shipping is already free, so free_shipping codes have no extra monetary reduction.
      discountAmount = Math.min(subtotal, Math.max(0, discountAmount));
      appliedDiscount = discount;
    }
    const total = Math.max(0, subtotal - discountAmount) + shippingFee;

    if (
      !Number.isFinite(subtotal) ||
      !Number.isFinite(shippingFee) ||
      !Number.isFinite(total)
    ) {
      return c.json(
        { success: false, error: "Unable to calculate the order total." },
        400,
      );
    }

    const now = new Date();
    const orderId = createId("order");
    const confirmationToken = randomBytes(32).toString("hex");
    const confirmationTokenHash = createHash("sha256")
      .update(confirmationToken)
      .digest("hex");
    const reservationExpiresAt = new Date(
      now.getTime() + 20 * 60 * 1000,
    ).toISOString();

    for (const item of orderItems) item.order_id = orderId;

    const orderReference = createOrderReference(selectedShipping.code);

    const order: ReservedOrderInput = {
      id: orderId,
      workspace,
      store_id: storeId,
      order_reference: orderReference,

      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: body.customer_phone?.trim() || null,

      shipping_address: shippingAddress,
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      postal_code: body.postal_code?.trim() || null,
      country,

      currency,
      subtotal,
      shipping_fee: shippingFee,
      total,

      shipping_method_id: selectedShipping.id,
      shipping_method_name: selectedShipping.name,
      shipping_method_code: selectedShipping.code,
      shipping_price_snapshot: selectedShipping.price,
      shipping_min_days: selectedShipping.minDays,
      shipping_max_days: selectedShipping.maxDays,
      shipping_delivery_estimate: selectedShipping.deliveryEstimate,
      shipping_policy_accepted: true,
      shipping_policy_text_snapshot: shippingSettings.policyText,
      shipping_policy_accepted_at: now.toISOString(),

      payment_status: "pending",
      settlement_status: "pending",
      order_status: "payment_pending",

      fulfillment_mode: "international_dropship",
      payment_method: "online",

      flutterwave_transaction_id: null,
      flutterwave_reference: null,
      supplier_name: null,
      supplier_order_reference: null,
      tracking_number: null,

      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      confirmation_token_hash: confirmationTokenHash,
      reservation_expires_at: reservationExpiresAt,
      items: orderItems,
    };

    try {
      insertOrder(order);
    } catch (error) {
      console.error("Order creation transaction failed:", error);
      return c.json(
        {
          success: false,
          error:
            "Stock or order details changed while placing your order. Please try again.",
        },
        409,
      );
    }

    if (appliedDiscount) {
      try {
        const redeem = db.transaction(() => {
          db.prepare("INSERT INTO store_discount_redemptions (id, discount_id, store_id, order_id, customer_email, redeemed_at) VALUES (?, ?, ?, ?, ?, ?)").run(createId("discount-redemption"), appliedDiscount.id, storeId, orderId, customerEmail, now.toISOString());
          db.prepare("UPDATE store_discounts SET usage_count = usage_count + 1, updated_at = ? WHERE id = ? AND store_id = ?").run(now.toISOString(), appliedDiscount.id, storeId);
        });
        redeem();
      } catch (error) {
        console.error("Discount redemption recording failed:", error);
      }
    }

    try {
      await sendNewOrderNotificationEmail({
        orderId: order.id,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        total: order.total,
        currency: order.currency,
        items: (order.items ?? []).map((item) => ({
          product_name: item.product_name,
          variant_name: item.variant_name ?? null,
          quantity: item.quantity,
          total: item.total,
        })),
        shippingAddress: [
          order.shipping_address,
          order.city,
          order.state,
          order.country,
        ]
          .filter(Boolean)
          .join(", "),
      });
    } catch (error) {
      console.error(`Order ${order.id}: store-owner email failed:`, error);
    }

    // WhatsApp order alerts are optional and best-effort; they never block checkout.
    if (workspace === "global") {
      await sendNewOrderWhatsAppNotification({
        orderId: order.id,
        customerName: order.customer_name,
        total: order.total,
        currency: order.currency,
      });
    }

    return c.json(
      {
        success: true,
        data: {
          orderId: order.id,
          orderReference,
          confirmationToken,
          reservationExpiresAt,
          subtotal,
          discountAmount,
          discountCode: appliedDiscount?.code ?? null,
          shippingFee,
          total,
          currency,
          shippingMethod: {
            id: selectedShipping.id,
            name: selectedShipping.name,
            code: selectedShipping.code,
            price: selectedShipping.price,
            deliveryEstimate: selectedShipping.deliveryEstimate,
          },
          shippingPolicyAccepted: true,
          paymentStatus: order.payment_status,
          orderStatus: order.order_status,
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
