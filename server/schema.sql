DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  image_url TEXT,
  supplier_name TEXT,
  warehouse_country TEXT,
  processing_time TEXT,
  delivery_time TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  subtotal REAL NOT NULL,
  shipping_fee REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,

  payment_status TEXT NOT NULL DEFAULT 'pending',
  settlement_status TEXT NOT NULL DEFAULT 'pending',
  order_status TEXT NOT NULL DEFAULT 'payment_pending',

  flutterwave_transaction_id TEXT,
  flutterwave_reference TEXT,

  supplier_name TEXT,
  supplier_order_reference TEXT,
  tracking_number TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_products_category
ON products(category);

CREATE INDEX idx_products_active
ON products(active);

CREATE INDEX idx_orders_payment_status
ON orders(payment_status);

CREATE INDEX idx_orders_settlement_status
ON orders(settlement_status);

CREATE INDEX idx_orders_order_status
ON orders(order_status);

CREATE INDEX idx_orders_created_at
ON orders(created_at);
