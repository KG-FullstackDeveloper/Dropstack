import { randomUUID } from "crypto";
import { db } from "./db";

/*
|--------------------------------------------------------------------------
| Nigeria Ecommerce Database
|--------------------------------------------------------------------------
|
| IMPORTANT:
| These tables are intentionally separate from the existing Global
| Ecommerce tables.
|
| Global:
|   products
|   orders
|   order_items
|
| Nigeria:
|   nigeria_products
|   nigeria_orders
|   nigeria_order_items
|   nigeria_customers
|   nigeria_inventory
|   nigeria_settings
|
| This prevents Nigeria records from appearing inside Global Ecommerce.
|--------------------------------------------------------------------------
*/

db.exec(`
  CREATE TABLE IF NOT EXISTS nigeria_products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'NGN',

    image_url TEXT,
    video_url TEXT,

    supplier_name TEXT,
    supplier_product_id TEXT,

    supplier_cost REAL NOT NULL DEFAULT 0,
    shipping_cost REAL NOT NULL DEFAULT 0,
    other_cost REAL NOT NULL DEFAULT 0,

    inventory INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,

    profit_per_unit REAL NOT NULL DEFAULT 0,
    profit_margin REAL NOT NULL DEFAULT 0,

    active INTEGER NOT NULL DEFAULT 1,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS nigeria_customers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT NOT NULL DEFAULT 'Nigeria',

    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent REAL NOT NULL DEFAULT 0,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS nigeria_orders (
    id TEXT PRIMARY KEY,

    customer_id TEXT,

    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,

    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT,

    country TEXT NOT NULL DEFAULT 'Nigeria',
    currency TEXT NOT NULL DEFAULT 'NGN',

    subtotal REAL NOT NULL DEFAULT 0,
    shipping_fee REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,

    supplier_cost_total REAL NOT NULL DEFAULT 0,
    shipping_cost_total REAL NOT NULL DEFAULT 0,
    other_cost_total REAL NOT NULL DEFAULT 0,
    profit REAL NOT NULL DEFAULT 0,
    profit_margin REAL NOT NULL DEFAULT 0,

    payment_status TEXT NOT NULL DEFAULT 'pending',
    settlement_status TEXT NOT NULL DEFAULT 'pending',

    order_status TEXT NOT NULL DEFAULT 'payment_pending',

    payment_provider TEXT DEFAULT 'flutterwave',
    flutterwave_transaction_id TEXT,
    flutterwave_reference TEXT,

    supplier_name TEXT,
    supplier_order_reference TEXT,
    tracking_number TEXT,

    estimated_delivery TEXT,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (customer_id)
      REFERENCES nigeria_customers(id)
  );

  CREATE TABLE IF NOT EXISTS nigeria_order_items (
    id TEXT PRIMARY KEY,

    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,

    product_name TEXT NOT NULL,

    quantity INTEGER NOT NULL,

    selling_price REAL NOT NULL DEFAULT 0,

    supplier_cost REAL NOT NULL DEFAULT 0,
    shipping_cost REAL NOT NULL DEFAULT 0,
    other_cost REAL NOT NULL DEFAULT 0,

    subtotal REAL NOT NULL DEFAULT 0,
    profit REAL NOT NULL DEFAULT 0,

    FOREIGN KEY (order_id)
      REFERENCES nigeria_orders(id)
      ON DELETE CASCADE,

    FOREIGN KEY (product_id)
      REFERENCES nigeria_products(id)
  );

  CREATE TABLE IF NOT EXISTS nigeria_inventory (
    id TEXT PRIMARY KEY,

    product_id TEXT NOT NULL UNIQUE,

    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,

    low_stock_threshold INTEGER NOT NULL DEFAULT 5,

    updated_at TEXT NOT NULL,

    FOREIGN KEY (product_id)
      REFERENCES nigeria_products(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS nigeria_settings (
    id TEXT PRIMARY KEY DEFAULT 'nigeria',

    store_name TEXT NOT NULL DEFAULT 'Nigeria Ecommerce',

    supplier_name TEXT,

    payment_method TEXT NOT NULL DEFAULT 'flutterwave',

    default_shipping_fee REAL NOT NULL DEFAULT 0,

    delivery_estimate TEXT NOT NULL DEFAULT '2–7 business days',

    currency TEXT NOT NULL DEFAULT 'NGN',

    country TEXT NOT NULL DEFAULT 'Nigeria',

    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_nigeria_products_active
    ON nigeria_products(active);

  CREATE INDEX IF NOT EXISTS idx_nigeria_products_category
    ON nigeria_products(category);

  CREATE INDEX IF NOT EXISTS idx_nigeria_orders_status
    ON nigeria_orders(order_status);

  CREATE INDEX IF NOT EXISTS idx_nigeria_orders_payment_status
    ON nigeria_orders(payment_status);

  CREATE INDEX IF NOT EXISTS idx_nigeria_orders_created_at
    ON nigeria_orders(created_at);

  CREATE INDEX IF NOT EXISTS idx_nigeria_order_items_order
    ON nigeria_order_items(order_id);

  CREATE INDEX IF NOT EXISTS idx_nigeria_customers_email
    ON nigeria_customers(email);
`);

/*
|--------------------------------------------------------------------------
| Default Nigeria Settings
|--------------------------------------------------------------------------
*/

const settingsExists = db
  .prepare(
    `
      SELECT id
      FROM nigeria_settings
      WHERE id = 'nigeria'
      LIMIT 1
    `
  )
  .get();

if (!settingsExists) {
  const now =
    new Date().toISOString();

  db.prepare(
    `
      INSERT INTO nigeria_settings (
        id,
        store_name,
        supplier_name,
        payment_method,
        default_shipping_fee,
        delivery_estimate,
        currency,
        country,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    "nigeria",
    "Nigeria Ecommerce",
    "",
    "flutterwave",
    0,
    "2–7 business days",
    "NGN",
    "Nigeria",
    now
  );

  console.log(
    "Created Nigeria ecommerce settings."
  );
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

export function createNigeriaId(
  prefix: string
): string {
  return `${prefix}-${Date.now()}-${randomUUID().slice(
    0,
    8
  )}`;
}

export function nigeriaNow(): string {
  return new Date().toISOString();
}