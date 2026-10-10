
import { db } from "../database/db";

import type { Product, ProductVariant } from "../types/product";
import type { Order, OrderItem } from "../types/order";

export type ProductWithStore = Product & {
  store_id?: string | null;
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};

/* -------------------------------------------------------------------------- */
/* JSON HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function parseJsonArray<T>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

/* -------------------------------------------------------------------------- */
/* PRODUCT NORMALIZATION                                                      */
/* -------------------------------------------------------------------------- */

function normalizeProduct(product: ProductWithStore): ProductWithStore {
  return {
    ...product,
    store_id: product.store_id ?? null,
    images: parseJsonArray<string>(product.images, []).filter(Boolean),
    variants: parseJsonArray<ProductVariant>(product.variants, []).filter(Boolean),
    stock: Number(product.stock ?? 0),
    low_stock_threshold: Number(product.low_stock_threshold ?? 0),
    supplier_cost: Number(product.supplier_cost ?? 0),
    shipping_cost: Number(product.shipping_cost ?? 0),
    other_cost: Number(product.other_cost ?? 0),
    profit_per_unit: Number(product.profit_per_unit ?? 0),
    profit_margin: Number(product.profit_margin ?? 0),
    price: Number(product.price ?? 0),
    active: Number(product.active ?? 0) === 1 ? 1 : 0,
  };
}

/* -------------------------------------------------------------------------- */
/* PRODUCT QUERIES                                                            */
/* -------------------------------------------------------------------------- */

/** All products, preserving the existing admin behaviour. */
export function getAllProducts(): ProductWithStore[] {
  const products = db
    .prepare("SELECT * FROM products ORDER BY created_at DESC")
    .all() as ProductWithStore[];

  return products.map(normalizeProduct);
}

/** All active products, preserving the existing global endpoint behaviour. */
export function getActiveProducts(): ProductWithStore[] {
  const products = db
    .prepare(`
      SELECT *
      FROM products
      WHERE active = 1
      ORDER BY created_at DESC
    `)
    .all() as ProductWithStore[];

  return products.map(normalizeProduct);
}

/** Products belonging to one store only. */
export function getProductsByStoreId(
  storeId: string,
  activeOnly = false,
): ProductWithStore[] {
  const query = activeOnly
    ? `
      SELECT *
      FROM products
      WHERE store_id = ? AND active = 1
      ORDER BY created_at DESC
    `
    : `
      SELECT *
      FROM products
      WHERE store_id = ?
      ORDER BY created_at DESC
    `;

  const products = db
    .prepare(query)
    .all(storeId) as ProductWithStore[];

  return products.map(normalizeProduct);
}

/** Global products are products not assigned to a store. */
export function getGlobalProducts(): ProductWithStore[] {
  const products = db
    .prepare(`
      SELECT *
      FROM products
      WHERE store_id IS NULL
      ORDER BY created_at DESC
    `)
    .all() as ProductWithStore[];

  return products.map(normalizeProduct);
}

export function getProductById(
  id: string,
): ProductWithStore | undefined {
  const product = db
    .prepare(`
      SELECT *
      FROM products
      WHERE id = ?
      LIMIT 1
    `)
    .get(id) as ProductWithStore | undefined;

  return product ? normalizeProduct(product) : undefined;
}

export function getProductBySlug(
  slug: string,
): ProductWithStore | undefined {
  const product = db
    .prepare(`
      SELECT *
      FROM products
      WHERE slug = ? AND active = 1
      LIMIT 1
    `)
    .get(slug) as ProductWithStore | undefined;

  return product ? normalizeProduct(product) : undefined;
}

/* -------------------------------------------------------------------------- */
/* PRODUCT PREPARATION                                                        */
/* -------------------------------------------------------------------------- */

function optionalString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const result = String(value).trim();
  return result || null;
}

function prepareProductForDatabase(
  product: ProductWithStore,
): ProductWithStore {
  const price = Number(product.price ?? 0) || 0;

  const supplierCost = Math.max(
    0,
    Number(product.supplier_cost ?? 0) || 0,
  );

  const shippingCost = Math.max(
    0,
    Number(product.shipping_cost ?? 0) || 0,
  );

  const otherCost = Math.max(
    0,
    Number(product.other_cost ?? 0) || 0,
  );

  const profitPerUnit =
    price - supplierCost - shippingCost - otherCost;

  const profitMargin =
    price > 0 ? (profitPerUnit / price) * 100 : 0;

  return {
    ...product,

    store_id: optionalString(product.store_id),
    price,

    currency: String(product.currency || "USD").trim().toUpperCase() || "USD",
    sku: optionalString(product.sku),
    description: String(product.description || "").trim(),
    category: String(product.category || "Other").trim() || "Other",

    image_url: optionalString(product.image_url),
    images: parseJsonArray<string>(product.images, []).filter(Boolean),
    video_url: optionalString(product.video_url),

    supplier_name: optionalString(product.supplier_name),
    supplier_product_id: optionalString(product.supplier_product_id),
    warehouse_country: optionalString(product.warehouse_country)
      ?.toUpperCase() ?? null,

    processing_time: optionalString(product.processing_time),
    delivery_time: optionalString(product.delivery_time),

    supplier_cost: supplierCost,
    shipping_cost: shippingCost,
    other_cost: otherCost,
    profit_per_unit: profitPerUnit,
    profit_margin: profitMargin,

    stock: Math.max(0, Number(product.stock ?? 0) || 0),

    low_stock_threshold: Math.max(
      0,
      Number(product.low_stock_threshold ?? 0) || 0,
    ),

    variants: parseJsonArray<ProductVariant>(product.variants, []),

    active: Number(product.active ?? 1) === 1 ? 1 : 0,

    created_at: product.created_at || new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* PRODUCT INSERTION                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Products without store_id remain global products.
 * Products with store_id are assigned to that store.
 */
export function insertProduct(
  product: ProductWithStore,
): ProductWithStore {
  const prepared = prepareProductForDatabase(product);

  if (prepared.store_id) {
    const store = db
      .prepare("SELECT id FROM stores WHERE id = ?")
      .get(prepared.store_id);

    if (!store) {
      throw new Error("The selected store does not exist.");
    }
  }

  try {
    db.prepare(`
      INSERT INTO products (
        id,
        name,
        slug,
        sku,
        description,
        category,
        price,
        currency,
        image_url,
        images,
        video_url,
        supplier_name,
        supplier_product_id,
        warehouse_country,
        processing_time,
        delivery_time,
        supplier_cost,
        shipping_cost,
        other_cost,
        profit_per_unit,
        profit_margin,
        stock,
        low_stock_threshold,
        variants,
        active,
        created_at,
        store_id
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      prepared.id,
      prepared.name,
      prepared.slug,
      prepared.sku ?? null,
      prepared.description,
      prepared.category,
      prepared.price,
      prepared.currency,
      prepared.image_url ?? null,
      JSON.stringify(prepared.images ?? []),
      prepared.video_url ?? null,
      prepared.supplier_name ?? null,
      prepared.supplier_product_id ?? null,
      prepared.warehouse_country ?? null,
      prepared.processing_time ?? null,
      prepared.delivery_time ?? null,
      prepared.supplier_cost,
      prepared.shipping_cost,
      prepared.other_cost,
      prepared.profit_per_unit,
      prepared.profit_margin,
      prepared.stock ?? 0,
      prepared.low_stock_threshold ?? 0,
      JSON.stringify(prepared.variants ?? []),
      prepared.active,
      prepared.created_at,
      prepared.store_id ?? null,
    );
  } catch (error) {
    console.error("insertProduct SQLite error:", error);
    throw error;
  }

  return normalizeProduct(prepared);
}

/* -------------------------------------------------------------------------- */
/* PRODUCT UPDATE                                                             */
/* -------------------------------------------------------------------------- */

/**
 * An omitted store_id keeps the product's current assignment.
 * Pass store_id: null to move it back to the global catalogue.
 * Pass another valid store ID to assign it to a different store.
 */
export function updateProductRecord(
  id: string,
  updates: Partial<ProductWithStore>,
): ProductWithStore | undefined {
  const current = getProductById(id);

  if (!current) {
    return undefined;
  }

  const merged: ProductWithStore = {
    ...current,
    ...updates,
    store_id:
      updates.store_id === undefined
        ? current.store_id ?? null
        : updates.store_id,
  };

  const next = prepareProductForDatabase(merged);

  if (next.store_id) {
    const store = db
      .prepare("SELECT id FROM stores WHERE id = ?")
      .get(next.store_id);

    if (!store) {
      throw new Error("The selected store does not exist.");
    }
  }

  db.prepare(`
    UPDATE products SET
      name = ?,
      slug = ?,
      sku = ?,
      description = ?,
      category = ?,
      price = ?,
      currency = ?,
      image_url = ?,
      images = ?,
      video_url = ?,
      supplier_name = ?,
      supplier_product_id = ?,
      warehouse_country = ?,
      processing_time = ?,
      delivery_time = ?,
      supplier_cost = ?,
      shipping_cost = ?,
      other_cost = ?,
      profit_per_unit = ?,
      profit_margin = ?,
      stock = ?,
      low_stock_threshold = ?,
      variants = ?,
      active = ?,
      store_id = ?
    WHERE id = ?
  `).run(
    next.name,
    next.slug,
    next.sku ?? null,
    next.description,
    next.category,
    next.price,
    next.currency,
    next.image_url ?? null,
    JSON.stringify(next.images ?? []),
    next.video_url ?? null,
    next.supplier_name ?? null,
    next.supplier_product_id ?? null,
    next.warehouse_country ?? null,
    next.processing_time ?? null,
    next.delivery_time ?? null,
    next.supplier_cost,
    next.shipping_cost,
    next.other_cost,
    next.profit_per_unit,
    next.profit_margin,
    next.stock ?? 0,
    next.low_stock_threshold ?? 0,
    JSON.stringify(next.variants ?? []),
    next.active,
    next.store_id ?? null,
    id,
  );

  return getProductById(id);
}

/* -------------------------------------------------------------------------- */
/* PRODUCT DELETE                                                             */
/* -------------------------------------------------------------------------- */

export function deleteProductRecord(id: string): boolean {
  const result = db
    .prepare("DELETE FROM products WHERE id = ?")
    .run(id);

  return result.changes > 0;
}

/* -------------------------------------------------------------------------- */
/* ORDERS                                                                     */
/* -------------------------------------------------------------------------- */

export function getAllOrders(): OrderWithItems[] {
  const orders = db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC")
    .all() as Order[];

  return orders.map((order) => ({
    ...order,
    items: db
      .prepare("SELECT * FROM order_items WHERE order_id = ?")
      .all(order.id) as OrderItem[],
  }));
}

export function getOrderById(
  id: string,
): OrderWithItems | undefined {
  const order = db
    .prepare(`
      SELECT *
      FROM orders
      WHERE id = ?
      LIMIT 1
    `)
    .get(id) as Order | undefined;

  if (!order) {
    return undefined;
  }

  return {
    ...order,
    items: db
      .prepare("SELECT * FROM order_items WHERE order_id = ?")
      .all(order.id) as OrderItem[],
  };
}

export function insertOrder(order: Order): OrderWithItems {
  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO orders (
        id,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        city,
        state,
        postal_code,
        country,
        currency,
        subtotal,
        shipping_fee,
        total,
        payment_status,
        settlement_status,
        order_status,
        flutterwave_transaction_id,
        flutterwave_reference,
        supplier_name,
        supplier_order_reference,
        tracking_number,
        created_at,
        updated_at
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      order.id,
      order.customer_name,
      order.customer_email,
      order.customer_phone ?? null,
      order.shipping_address,
      order.city ?? null,
      order.state ?? null,
      order.postal_code ?? null,
      order.country,
      order.currency,
      order.subtotal,
      order.shipping_fee,
      order.total,
      order.payment_status,
      order.settlement_status,
      order.order_status,
      order.flutterwave_transaction_id ?? null,
      order.flutterwave_reference ?? null,
      order.supplier_name ?? null,
      order.supplier_order_reference ?? null,
      order.tracking_number ?? null,
      order.created_at,
      order.updated_at,
    );

    const insertItem = db.prepare(`
      INSERT INTO order_items (
        id,
        order_id,
        product_id,
        product_name,
        quantity,
        selling_price,
        supplier_cost,
        shipping_cost,
        other_cost,
        total,
        profit
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of order.items) {
      insertItem.run(
        item.id,
        order.id,
        item.product_id,
        item.product_name,
        item.quantity,
        item.selling_price,
        item.supplier_cost,
        item.shipping_cost,
        item.other_cost,
        item.total,
        item.profit,
      );
    }
  });

  transaction();

  return {
    ...order,
    items: order.items,
  };
}

/* -------------------------------------------------------------------------- */
/* ORDER UPDATE                                                               */
/* -------------------------------------------------------------------------- */

export function updateOrderRecord(
  id: string,
  updates: Partial<
    Pick<
      Order,
      | "payment_status"
      | "settlement_status"
      | "order_status"
      | "supplier_name"
      | "supplier_order_reference"
      | "tracking_number"
      | "flutterwave_transaction_id"
      | "flutterwave_reference"
    >
  >,
): OrderWithItems | undefined {
  const current = getOrderById(id);

  if (!current) {
    return undefined;
  }

  const next: Order = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE orders SET
      payment_status = ?,
      settlement_status = ?,
      order_status = ?,
      supplier_name = ?,
      supplier_order_reference = ?,
      tracking_number = ?,
      flutterwave_transaction_id = ?,
      flutterwave_reference = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    next.payment_status,
    next.settlement_status,
    next.order_status,
    next.supplier_name ?? null,
    next.supplier_order_reference ?? null,
    next.tracking_number ?? null,
    next.flutterwave_transaction_id ?? null,
    next.flutterwave_reference ?? null,
    next.updated_at,
    id,
  );

  return getOrderById(id);
}