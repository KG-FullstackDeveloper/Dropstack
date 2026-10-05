import { db } from "../database/db";

import type { Product, ProductVariant } from "../types/product";
import type {
  Order,
  OrderItem,
} from "../types/order";

export type OrderWithItems = Order & {
  items: OrderItem[];
};

function parseJsonArray<T>(
  value: unknown,
  fallback: T[] = [],
): T[] {
  if (Array.isArray(value)) return value;

  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? (parsed as T[])
      : fallback;
  } catch {
    return fallback;
  }
}

function normalizeProduct(
  product: Product,
): Product {
  return {
    ...product,

    images: parseJsonArray<string>(
      product.images,
      [],
    ),

    variants: parseJsonArray<ProductVariant>(
      product.variants,
      [],
    ),

    stock: Number(product.stock ?? 0),

    low_stock_threshold: Number(
      product.low_stock_threshold ?? 0,
    ),
  };
}

export function getAllProducts(): Product[] {
  const products = db
    .prepare(
      "SELECT * FROM products ORDER BY created_at DESC",
    )
    .all() as Product[];

  return products.map(normalizeProduct);
}

export function getActiveProducts(): Product[] {
  const products = db
    .prepare(
      "SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC",
    )
    .all() as Product[];

  return products.map(normalizeProduct);
}

export function getProductById(
  id: string,
): Product | undefined {
  const product = db
    .prepare(
      "SELECT * FROM products WHERE id = ?",
    )
    .get(id) as Product | undefined;

  return product
    ? normalizeProduct(product)
    : undefined;
}

export function getProductBySlug(
  slug: string,
): Product | undefined {
  const product = db
    .prepare(
      "SELECT * FROM products WHERE slug = ? AND active = 1",
    )
    .get(slug) as Product | undefined;

  return product
    ? normalizeProduct(product)
    : undefined;
}

export function insertProduct(
  product: Product,
): Product {
  db.prepare(
    `INSERT INTO products (
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
      created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )`,
  ).run(
    product.id,
    product.name,
    product.slug,
    product.sku ?? null,
    product.description,
    product.category,
    product.price,
    product.currency,
    product.image_url ?? null,
    JSON.stringify(product.images ?? []),
    product.video_url ?? null,
    product.supplier_name ?? null,
    product.supplier_product_id ?? null,
    product.warehouse_country ?? null,
    product.processing_time ?? null,
    product.delivery_time ?? null,
    product.supplier_cost,
    product.shipping_cost,
    product.other_cost,
    product.profit_per_unit,
    product.profit_margin,
    product.stock ?? 0,
    product.low_stock_threshold ?? 0,
    JSON.stringify(product.variants ?? []),
    product.active,
    product.created_at,
  );

  return normalizeProduct(product);
}

export function updateProductRecord(
  id: string,
  updates: Partial<Product>,
): Product | undefined {
  const current = getProductById(id);

  if (!current) return undefined;

  const next: Product = normalizeProduct({
    ...current,
    ...updates,
  });

  db.prepare(
    `UPDATE products SET
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
      active = ?
    WHERE id = ?`,
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
    id,
  );

  return getProductById(id);
}

export function deleteProductRecord(
  id: string,
): boolean {
  const result = db
    .prepare(
      "DELETE FROM products WHERE id = ?",
    )
    .run(id);

  return result.changes > 0;
}

export function getAllOrders(): OrderWithItems[] {
  const orders = db
    .prepare(
      "SELECT * FROM orders ORDER BY created_at DESC",
    )
    .all() as Order[];

  return orders.map((order) => ({
    ...order,
    items: db
      .prepare(
        "SELECT * FROM order_items WHERE order_id = ?",
      )
      .all(order.id) as OrderItem[],
  }));
}

export function getOrderById(
  id: string,
): OrderWithItems | undefined {
  const order = db
    .prepare(
      "SELECT * FROM orders WHERE id = ?",
    )
    .get(id) as Order | undefined;

  if (!order) return undefined;

  return {
    ...order,
    items: db
      .prepare(
        "SELECT * FROM order_items WHERE order_id = ?",
      )
      .all(order.id) as OrderItem[],
  };
}

export function insertOrder(
  order: Order,
): OrderWithItems {
  const transaction = db.transaction(() => {
    db.prepare(
      `INSERT INTO orders (
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    );

    const insertItem = db.prepare(
      `INSERT INTO order_items (
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

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
    `UPDATE orders SET
      payment_status = ?,
      settlement_status = ?,
      order_status = ?,
      supplier_name = ?,
      supplier_order_reference = ?,
      tracking_number = ?,
      flutterwave_transaction_id = ?,
      flutterwave_reference = ?,
      updated_at = ?
    WHERE id = ?`,
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