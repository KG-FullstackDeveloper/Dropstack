PRAGMA foreign_keys = ON;

-- =========================================
-- STORE CONFIGURATION
-- =========================================

CREATE TABLE IF NOT EXISTS store_config (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'MEO Store',
  description TEXT,
  logo_url TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  niche TEXT,
  domain TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  shipping_fee REAL,
  delivery_estimate TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS store_registry_metadata (
  store_id TEXT PRIMARY KEY,
  archived INTEGER NOT NULL DEFAULT 0
);

-- =========================================
-- ADMIN AUTHENTICATION
-- =========================================

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS auth_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT,
  purpose TEXT,
  expires_at TEXT,
  used_at TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT,
  blocked_until TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS login_events (
  id TEXT PRIMARY KEY,
  admin_id TEXT,
  email TEXT,
  success INTEGER NOT NULL DEFAULT 0,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT
);

-- =========================================
-- PRODUCTS AND INVENTORY
-- =========================================

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  price REAL NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  sku TEXT,
  category TEXT,
  image TEXT,
  images TEXT,
  variants TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  store_id TEXT,
  supplier_cost REAL DEFAULT 0,
  shipping_cost REAL DEFAULT 0,
  other_cost REAL DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS store_products (
  store_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  price_override REAL,
  created_at TEXT,
  PRIMARY KEY (store_id, product_id)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER,
  new_stock INTEGER,
  reference_id TEXT,
  note TEXT,
  created_by TEXT,
  created_at TEXT
);

-- =========================================
-- ORDERS
-- =========================================

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  workspace TEXT,
  store_id TEXT,
  order_reference TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal REAL NOT NULL DEFAULT 0,
  shipping_fee REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  shipping_method_id TEXT,
  shipping_method_name TEXT,
  shipping_method_code TEXT,
  shipping_price_snapshot REAL,
  shipping_min_days INTEGER,
  shipping_max_days INTEGER,
  shipping_delivery_estimate TEXT,
  shipping_policy_accepted INTEGER DEFAULT 0,
  shipping_policy_text_snapshot TEXT,
  shipping_policy_accepted_at TEXT,
  payment_status TEXT DEFAULT 'pending',
  settlement_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'payment_pending',
  fulfillment_mode TEXT,
  payment_method TEXT,
  confirmation_token_hash TEXT,
  reservation_expires_at TEXT,
  reservation_released_at TEXT,
  confirmed_at TEXT,
  email_sent INTEGER DEFAULT 0,
  email_claimed INTEGER DEFAULT 0,
  email_claimed_at TEXT,
  tracking_number TEXT,
  supplier_name TEXT,
  supplier_order_reference TEXT,
  flutterwave_transaction_id TEXT,
  flutterwave_reference TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  variant_id TEXT,
  variant_name TEXT,
  quantity INTEGER NOT NULL,
  selling_price REAL NOT NULL DEFAULT 0,
  supplier_cost REAL DEFAULT 0,
  shipping_cost REAL DEFAULT 0,
  other_cost REAL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  profit REAL DEFAULT 0
);

-- =========================================
-- CUSTOMERS
-- =========================================

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- =========================================
-- DISCOUNTS
-- =========================================

CREATE TABLE IF NOT EXISTS store_discounts (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  value REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  usage_count INTEGER NOT NULL DEFAULT 0,
  usage_limit INTEGER,
  per_customer_limit INTEGER,
  minimum_order_amount REAL,
  minimum_quantity INTEGER,
  product_ids TEXT DEFAULT '[]',
  buy_quantity INTEGER,
  get_quantity INTEGER,
  get_discount_percent REAL DEFAULT 100,
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT,
  updated_at TEXT,
  UNIQUE(store_id, code)
);

CREATE TABLE IF NOT EXISTS store_discount_redemptions (
  id TEXT PRIMARY KEY,
  discount_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  redeemed_at TEXT NOT NULL,
  UNIQUE(discount_id, order_id)
);

-- =========================================
-- ADMIN WORKSPACE AND CUSTOMER CONTACT
-- =========================================

CREATE TABLE IF NOT EXISTS admin_workspace_settings (
  id TEXT PRIMARY KEY,
  workspace TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  updated_at TEXT,
  UNIQUE(workspace, setting_key)
);

CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  store_id TEXT,
  session_id TEXT,
  page TEXT,
  referrer TEXT,
  country TEXT,
  created_at TEXT
);

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_products_store_id
  ON products(store_id);

CREATE INDEX IF NOT EXISTS idx_products_active
  ON products(active);

CREATE INDEX IF NOT EXISTS idx_products_slug
  ON products(slug);

CREATE INDEX IF NOT EXISTS idx_store_products_product
  ON store_products(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_store_id
  ON orders(store_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_email
  ON orders(customer_email);

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders(order_status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_inventory_product
  ON inventory_movements(product_id);

CREATE INDEX IF NOT EXISTS idx_auth_rate_identifier
  ON auth_rate_limits(identifier);

CREATE INDEX IF NOT EXISTS idx_login_events_created
  ON login_events(created_at);

CREATE INDEX IF NOT EXISTS idx_discount_redemptions_customer
  ON store_discount_redemptions(discount_id, customer_email);

CREATE INDEX IF NOT EXISTS idx_visitors_store
  ON visitors(store_id, created_at);