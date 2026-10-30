import { db } from "../database/db";
import type { Product, ProductVariant } from "../types/product";
import type { Order, OrderItem } from "../types/order";

export type ProductWithStore = Product & {
  store_id?: string | null;
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};

export type ReservedOrderInput = Order & {
  confirmation_token_hash: string;
  reservation_expires_at: string;
};

function parseJsonArray<T>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value as T[];

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

function normalizeProduct(product: ProductWithStore): ProductWithStore {
  return {
    ...product,
    store_id: product.store_id ?? null,
    images: parseJsonArray<string>(product.images, []).filter(Boolean),
    variants: parseJsonArray<ProductVariant>(product.variants, []).filter(
      Boolean,
    ),
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

export function getAllProducts(): ProductWithStore[] {
  const products = db
    .prepare("SELECT * FROM products ORDER BY created_at DESC")
    .all() as ProductWithStore[];

  return products.map(normalizeProduct);
}

export function getActiveProducts(): ProductWithStore[] {
  const products = db
    .prepare(
      `
    SELECT *
    FROM products
    WHERE active = 1
    ORDER BY created_at DESC
  `,
    )
    .all() as ProductWithStore[];

  return products.map(normalizeProduct);
}

export function getActiveGlobalProducts(): ProductWithStore[] {
  const products = db
    .prepare(
      `
    SELECT *
    FROM products
    WHERE active = 1
      AND store_id IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM store_products
        WHERE store_products.product_id = products.id
      )
    ORDER BY created_at DESC
  `,
    )
    .all() as ProductWithStore[];

  return products.map(normalizeProduct);
}

export function getProductsByStoreId(
  storeId: string,
  activeOnly = false,
): ProductWithStore[] {
  const query = activeOnly
    ? `
      SELECT * FROM products
      WHERE store_id = ? AND active = 1
      ORDER BY created_at DESC
    `
    : `
      SELECT * FROM products
      WHERE store_id = ?
      ORDER BY created_at DESC
    `;

  const products = db.prepare(query).all(storeId) as ProductWithStore[];
  return products.map(normalizeProduct);
}

export function getGlobalProducts(): ProductWithStore[] {
  const products = db
    .prepare(
      `
    SELECT *
    FROM products
    WHERE store_id IS NULL
    ORDER BY created_at DESC
  `,
    )
    .all() as ProductWithStore[];

  return products.map(normalizeProduct);
}

export function getProductById(id: string): ProductWithStore | undefined {
  const product = db
    .prepare(
      `
    SELECT * FROM products
    WHERE id = ?
    LIMIT 1
  `,
    )
    .get(id) as ProductWithStore | undefined;

  return product ? normalizeProduct(product) : undefined;
}

export function getProductBySlug(slug: string): ProductWithStore | undefined {
  const product = db
    .prepare(
      `
    SELECT * FROM products
    WHERE slug = ? AND active = 1
    LIMIT 1
  `,
    )
    .get(slug) as ProductWithStore | undefined;

  return product ? normalizeProduct(product) : undefined;
}

/* -------------------------------------------------------------------------- */
/* PRODUCT PREPARATION                                                        */
/* -------------------------------------------------------------------------- */

function optionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const result = String(value).trim();
  return result || null;
}

function prepareProductForDatabase(
  product: ProductWithStore,
): ProductWithStore {
  const price = Number(product.price ?? 0) || 0;
  const supplierCost = Math.max(0, Number(product.supplier_cost ?? 0) || 0);
  const shippingCost = Math.max(0, Number(product.shipping_cost ?? 0) || 0);
  const otherCost = Math.max(0, Number(product.other_cost ?? 0) || 0);

  const profitPerUnit = price - supplierCost - shippingCost - otherCost;
  const profitMargin = price > 0 ? (profitPerUnit / price) * 100 : 0;

  return {
    ...product,
    store_id: optionalString(product.store_id),
    price,
    currency:
      String(product.currency || "USD")
        .trim()
        .toUpperCase() || "USD",
    sku: optionalString(product.sku),
    description: String(product.description || "").trim(),
    category: String(product.category || "Other").trim() || "Other",
    image_url: optionalString(product.image_url),
    images: parseJsonArray<string>(product.images, []).filter(Boolean),
    video_url: optionalString(product.video_url),
    supplier_name: optionalString(product.supplier_name),
    supplier_product_id: optionalString(product.supplier_product_id),
    warehouse_country:
      optionalString(product.warehouse_country)?.toUpperCase() ?? null,
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

export function insertProduct(product: ProductWithStore): ProductWithStore {
  const prepared = prepareProductForDatabase(product);

  if (prepared.store_id) {
    const store = db
      .prepare("SELECT id FROM stores WHERE id = ?")
      .get(prepared.store_id);

    if (!store) throw new Error("The selected store does not exist.");
  }

  try {
    db.prepare(
      `
      INSERT INTO products (
        id, name, slug, sku, description, category, price, currency,
        image_url, images, video_url, supplier_name, supplier_product_id,
        warehouse_country, processing_time, delivery_time, supplier_cost,
        shipping_cost, other_cost, profit_per_unit, profit_margin, stock,
        low_stock_threshold, variants, active, created_at, store_id
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `,
    ).run(
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

export function updateProductRecord(
  id: string,
  updates: Partial<ProductWithStore>,
): ProductWithStore | undefined {
  const current = getProductById(id);
  if (!current) return undefined;

  const merged: ProductWithStore = {
    ...current,
    ...updates,
    store_id:
      updates.store_id === undefined
        ? (current.store_id ?? null)
        : updates.store_id,
  };

  const next = prepareProductForDatabase(merged);

  if (next.store_id) {
    const store = db
      .prepare("SELECT id FROM stores WHERE id = ?")
      .get(next.store_id);

    if (!store) throw new Error("The selected store does not exist.");
  }

  db.prepare(
    `
    UPDATE products SET
      name = ?, slug = ?, sku = ?, description = ?, category = ?,
      price = ?, currency = ?, image_url = ?, images = ?, video_url = ?,
      supplier_name = ?, supplier_product_id = ?, warehouse_country = ?,
      processing_time = ?, delivery_time = ?, supplier_cost = ?,
      shipping_cost = ?, other_cost = ?, profit_per_unit = ?,
      profit_margin = ?, stock = ?, low_stock_threshold = ?, variants = ?,
      active = ?, store_id = ?
    WHERE id = ?
  `,
  ).run(
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
  const result = db.prepare("DELETE FROM products WHERE id = ?").run(id);
  return result.changes > 0;
}

/* -------------------------------------------------------------------------- */
/* ORDER QUERIES                                                              */
/* -------------------------------------------------------------------------- */

function getOrderItems(orderId: string): OrderItem[] {
  const rows = db
    .prepare(
      `SELECT
         oi.*,
         p.supplier_product_id,
         p.sku AS product_sku,
         p.variants AS product_variants
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
    )
    .all(orderId) as Array<
    OrderItem & {
      product_sku: string | null;
      product_variants: string | null;
    }
  >;

  return rows.map((item) => {
    const variants = parseJsonArray<ProductVariant>(item.product_variants, []);
    const variant = variants.find(
      (candidate) => String(candidate.id) === String(item.variant_id),
    );

    return {
      ...item,
      supplier_sku:
        variant?.sku || item.product_sku || item.supplier_product_id || null,
    };
  });
}

export function getAllOrders(): OrderWithItems[] {
  const orders = db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC")
    .all() as Order[];

  return orders.map((order) => ({
    ...order,
    items: getOrderItems(order.id),
  }));
}

export function getOrderById(id: string): OrderWithItems | undefined {
  const order = db
    .prepare(
      `
    SELECT * FROM orders
    WHERE id = ?
    LIMIT 1
  `,
    )
    .get(id) as Order | undefined;

  if (!order) return undefined;

  return {
    ...order,
    items: getOrderItems(order.id),
  };
}

/* -------------------------------------------------------------------------- */
/* STOCK RESERVATION AND ORDER CREATION                                       */
/* -------------------------------------------------------------------------- */

export function insertOrder(order: ReservedOrderInput): OrderWithItems {
  const orderItems = order.items ?? [];
  const transaction = db.transaction(() => {
    // Recheck stock inside the transaction to avoid overselling.
    for (const item of orderItems) {
      const product = db
        .prepare(
          `
        SELECT id, stock, variants, active
        FROM products
        WHERE id = ?
        LIMIT 1
      `,
        )
        .get(item.product_id) as
        | {
            id: string;
            stock: number;
            variants: string | ProductVariant[] | null;
            active: number;
          }
        | undefined;

      if (!product || Number(product.active) !== 1) {
        throw new Error(
          `Product "${item.product_name}" is no longer available.`,
        );
      }

      const variants = parseJsonArray<ProductVariant>(product.variants, []);
      let variantIndex = -1;

      if (item.variant_id) {
        variantIndex = variants.findIndex(
          (variant) => String(variant.id) === String(item.variant_id),
        );

        if (variantIndex === -1) {
          throw new Error(
            `The selected variant for "${item.product_name}" no longer exists.`,
          );
        }
      }

      const selectedVariant =
        variantIndex >= 0 ? variants[variantIndex] : undefined;

      const variantHasOwnStock =
        selectedVariant?.stock !== null &&
        selectedVariant?.stock !== undefined &&
        Number.isFinite(Number(selectedVariant?.stock));

      if (variantHasOwnStock && selectedVariant) {
        const available = Number(selectedVariant.stock);

        if (available < item.quantity) {
          throw new Error(`Insufficient stock for "${item.product_name}".`);
        }

        variants[variantIndex] = {
          ...selectedVariant,
          stock: String(available - item.quantity),
        } as ProductVariant;

        db.prepare("UPDATE products SET variants = ? WHERE id = ?").run(
          JSON.stringify(variants),
          product.id,
        );
      } else {
        const available = Number(product.stock ?? 0);

        if (available < item.quantity) {
          throw new Error(`Insufficient stock for "${item.product_name}".`);
        }

        const deduction = db
          .prepare(
            `
          UPDATE products
          SET stock = stock - ?
          WHERE id = ? AND stock >= ?
        `,
          )
          .run(item.quantity, product.id, item.quantity);

        if (deduction.changes !== 1) {
          throw new Error(`Insufficient stock for "${item.product_name}".`);
        }
      }
    }

    /*
     * Keep this insertion in the same transaction as stock reservation.
     * Shipping values are snapshots, so later admin setting changes do not
     * alter existing orders.
     */
    db.prepare(
      `
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
        updated_at,
        confirmation_token_hash,
        reservation_expires_at,
        confirmed_at,
        reservation_released_at,
        email_sent,
        email_claimed,
        workspace,
        store_id,
        order_reference,
        shipping_method_id,
        shipping_method_name,
        shipping_method_code,
        shipping_price_snapshot,
        shipping_min_days,
        shipping_max_days,
        shipping_delivery_estimate,
        shipping_policy_accepted,
        shipping_policy_text_snapshot,
        shipping_policy_accepted_at
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 0, 0,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `,
    ).run(
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
      order.confirmation_token_hash,
      order.reservation_expires_at,
      order.workspace ?? "global",
      order.store_id ?? null,
      order.order_reference ?? null,
      order.shipping_method_id ?? null,
      order.shipping_method_name ?? null,
      order.shipping_method_code ?? null,
      order.shipping_price_snapshot ?? order.shipping_fee,
      order.shipping_min_days ?? null,
      order.shipping_max_days ?? null,
      order.shipping_delivery_estimate ?? null,
      order.shipping_policy_accepted ? 1 : 0,
      order.shipping_policy_text_snapshot ?? null,
      order.shipping_policy_accepted_at ?? null,
    );

    const insertItem = db.prepare(`
      INSERT INTO order_items (
        id,
        order_id,
        product_id,
        product_name,
        variant_id,
        variant_name,
        quantity,
        selling_price,
        supplier_cost,
        shipping_cost,
        other_cost,
        total,
        profit
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of orderItems) {
      insertItem.run(
        item.id,
        order.id,
        item.product_id,
        item.product_name,
        item.variant_id ?? null,
        item.variant_name ?? null,
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

  return { ...order, items: orderItems };
}

/* -------------------------------------------------------------------------- */
/* EXPIRED STOCK RESERVATIONS                                                 */
/* -------------------------------------------------------------------------- */

export function expirePendingReservations(): number {
  const transaction = db.transaction(() => {
    const now = new Date().toISOString();

    const expiredOrders = db
      .prepare(
        `
      SELECT id
      FROM orders
      WHERE reservation_expires_at IS NOT NULL
        AND reservation_expires_at <= ?
        AND confirmed_at IS NULL
        AND reservation_released_at IS NULL
        AND order_status = 'payment_pending'
    `,
      )
      .all(now) as Array<{ id: string }>;

    let releasedCount = 0;

    for (const { id } of expiredOrders) {
      const claim = db
        .prepare(
          `
        UPDATE orders
        SET reservation_released_at = ?,
            order_status = 'cancelled',
            updated_at = ?
        WHERE id = ?
          AND confirmed_at IS NULL
          AND reservation_released_at IS NULL
          AND order_status = 'payment_pending'
      `,
        )
        .run(now, now, id);

      if (claim.changes !== 1) continue;

      const items = db
        .prepare(
          `
        SELECT product_id, variant_id, quantity
        FROM order_items
        WHERE order_id = ?
      `,
        )
        .all(id) as Array<{
        product_id: string;
        variant_id: string | null;
        quantity: number;
      }>;

      for (const item of items) {
        const product = db
          .prepare(
            `
          SELECT id, stock, variants
          FROM products
          WHERE id = ?
        `,
          )
          .get(item.product_id) as
          | {
              id: string;
              stock: number;
              variants: string | ProductVariant[] | null;
            }
          | undefined;

        if (!product) {
          console.error(
            `Cannot restore expired order ${id}: product ${item.product_id} was not found.`,
          );
          continue;
        }

        const variants = parseJsonArray<ProductVariant>(product.variants, []);
        const variantIndex = item.variant_id
          ? variants.findIndex(
              (variant) => String(variant.id) === String(item.variant_id),
            )
          : -1;

        const selectedVariant =
          variantIndex >= 0 ? variants[variantIndex] : undefined;

        const variantHasOwnStock =
          selectedVariant?.stock !== null &&
          selectedVariant?.stock !== undefined &&
          Number.isFinite(Number(selectedVariant?.stock));

        if (variantHasOwnStock && selectedVariant) {
          variants[variantIndex] = {
            ...selectedVariant,
            stock: String(
              Number(selectedVariant.stock) + Number(item.quantity),
            ),
          } as ProductVariant;

          db.prepare("UPDATE products SET variants = ? WHERE id = ?").run(
            JSON.stringify(variants),
            product.id,
          );
        } else {
          db.prepare(
            `
            UPDATE products
            SET stock = COALESCE(stock, 0) + ?
            WHERE id = ?
          `,
          ).run(item.quantity, product.id);
        }
      }

      releasedCount += 1;
    }

    return releasedCount;
  });

  return transaction();
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
  if (!current) return undefined;

  const next: Order = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  db.prepare(
    `
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
  `,
  ).run(
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
