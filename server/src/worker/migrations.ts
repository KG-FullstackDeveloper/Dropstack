import type { D1Database } from "./types";

const MIGRATIONS = [
  {
    version: "0001_core",
    statements: [
      `CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS admin_users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, name TEXT, phone TEXT, role TEXT NOT NULL DEFAULT 'store_owner', two_factor_enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT, updated_at TEXT)`,
      `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT, description TEXT, price REAL NOT NULL DEFAULT 0, currency TEXT DEFAULT 'USD', sku TEXT, category TEXT, image TEXT, images TEXT DEFAULT '[]', video_url TEXT, videos TEXT DEFAULT '[]', dimensions TEXT DEFAULT '{}', weight REAL, cj_metadata TEXT DEFAULT '{}', supplier_name TEXT, supplier_product_id TEXT, warehouse_country TEXT, processing_time TEXT, delivery_time TEXT, supplier_cost REAL DEFAULT 0, shipping_cost REAL DEFAULT 0, other_cost REAL DEFAULT 0, profit_per_unit REAL DEFAULT 0, profit_margin REAL DEFAULT 0, stock INTEGER DEFAULT 0, low_stock_threshold INTEGER DEFAULT 0, variants TEXT DEFAULT '[]', active INTEGER DEFAULT 1, store_id TEXT, created_at TEXT, updated_at TEXT)`,
      `CREATE TABLE IF NOT EXISTS stores (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, niche TEXT, domain TEXT, status TEXT NOT NULL DEFAULT 'Active', shipping_fee REAL, delivery_estimate TEXT, created_at TEXT, updated_at TEXT)`,
      `CREATE TABLE IF NOT EXISTS store_registry_metadata (store_id TEXT PRIMARY KEY, archived INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS store_config (id TEXT PRIMARY KEY DEFAULT 'default', name TEXT DEFAULT 'MEO Store', description TEXT, logo_url TEXT, favicon_url TEXT, theme_id TEXT DEFAULT 'meo-default', navigation TEXT DEFAULT '[]', settings TEXT DEFAULT '{}', primary_color TEXT DEFAULT '#0f172a', accent_color TEXT DEFAULT '#3b82f6', font_family TEXT DEFAULT 'Inter', updated_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS store_products (store_id TEXT NOT NULL, product_id TEXT NOT NULL, price_override REAL, created_at TEXT, PRIMARY KEY (store_id, product_id))`,
      `CREATE TABLE IF NOT EXISTS inventory_movements (id TEXT PRIMARY KEY, product_id TEXT NOT NULL, previous_stock INTEGER NOT NULL DEFAULT 0, change_amount INTEGER NOT NULL DEFAULT 0, new_stock INTEGER NOT NULL DEFAULT 0, reason TEXT NOT NULL DEFAULT 'Correction', note TEXT, admin_id TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, workspace TEXT, store_id TEXT, customer_name TEXT NOT NULL, customer_email TEXT NOT NULL, customer_phone TEXT, shipping_address TEXT NOT NULL, city TEXT, state TEXT, postal_code TEXT, country TEXT, currency TEXT NOT NULL DEFAULT 'USD', subtotal REAL NOT NULL DEFAULT 0, shipping_fee REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0, shipping_method_id TEXT, shipping_method_name TEXT, shipping_method_code TEXT, shipping_price_snapshot REAL, shipping_min_days INTEGER, shipping_max_days INTEGER, shipping_delivery_estimate TEXT, shipping_policy_accepted INTEGER DEFAULT 0, shipping_policy_text_snapshot TEXT, payment_status TEXT DEFAULT 'pending', settlement_status TEXT DEFAULT 'pending', order_status TEXT DEFAULT 'payment_pending', tracking_number TEXT, supplier_name TEXT, supplier_order_reference TEXT, created_at TEXT, updated_at TEXT)`,
      `CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, product_id TEXT, product_name TEXT NOT NULL, variant_id TEXT, variant_name TEXT, quantity INTEGER NOT NULL, selling_price REAL NOT NULL DEFAULT 0, supplier_cost REAL DEFAULT 0, shipping_cost REAL DEFAULT 0, other_cost REAL DEFAULT 0, total REAL NOT NULL DEFAULT 0, profit REAL DEFAULT 0)`,
      `CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT, email TEXT, phone TEXT, created_at TEXT, updated_at TEXT)`,
      `CREATE TABLE IF NOT EXISTS admin_workspace_settings (workspace TEXT PRIMARY KEY, settings TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS platform_customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, company TEXT, plan TEXT NOT NULL DEFAULT 'starter', status TEXT NOT NULL DEFAULT 'active', subscription_expires_at TEXT, store_limit INTEGER NOT NULL DEFAULT 1, stores_used INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS support_messages (id TEXT PRIMARY KEY, name TEXT, email TEXT, subject TEXT, message TEXT, status TEXT DEFAULT 'new', created_at TEXT, updated_at TEXT)`,
      `CREATE TABLE IF NOT EXISTS visitors (id TEXT PRIMARY KEY, store_id TEXT, session_id TEXT, page TEXT, referrer TEXT, country TEXT, created_at TEXT)`,
      `CREATE TABLE IF NOT EXISTS auth_codes (id TEXT PRIMARY KEY, email TEXT NOT NULL, code_hash TEXT, purpose TEXT, expires_at TEXT, used_at TEXT, created_at TEXT)`,
      `CREATE TABLE IF NOT EXISTS auth_rate_limits (id TEXT PRIMARY KEY, identifier TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, window_started_at TEXT, blocked_until TEXT, created_at TEXT, updated_at TEXT)`,
      `CREATE TABLE IF NOT EXISTS login_events (id TEXT PRIMARY KEY, admin_id TEXT, email TEXT, success INTEGER NOT NULL DEFAULT 0, ip_address TEXT, user_agent TEXT, created_at TEXT)`,
      `CREATE TABLE IF NOT EXISTS store_discounts (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, code TEXT NOT NULL, type TEXT NOT NULL, value REAL NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, usage_count INTEGER NOT NULL DEFAULT 0, usage_limit INTEGER, per_customer_limit INTEGER, minimum_order_amount REAL, minimum_quantity INTEGER, product_ids TEXT DEFAULT '[]', buy_quantity INTEGER, get_quantity INTEGER, get_discount_percent REAL DEFAULT 100, starts_at TEXT, ends_at TEXT, created_at TEXT, updated_at TEXT, UNIQUE(store_id, code))`,
      `CREATE TABLE IF NOT EXISTS store_discount_redemptions (id TEXT PRIMARY KEY, discount_id TEXT NOT NULL, store_id TEXT NOT NULL, order_id TEXT NOT NULL, customer_email TEXT NOT NULL, redeemed_at TEXT NOT NULL, UNIQUE(discount_id, order_id))`,
      `CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id)`,
      `CREATE INDEX IF NOT EXISTS idx_products_active ON products(active)`,
      `CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)`,
      `CREATE INDEX IF NOT EXISTS idx_store_products_product ON store_products(product_id)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status)`,
      `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`,
      `CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_movements(product_id)`,
      `CREATE INDEX IF NOT EXISTS idx_auth_rate_identifier ON auth_rate_limits(identifier)`,
      `CREATE INDEX IF NOT EXISTS idx_login_events_created ON login_events(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_discount_redemptions_customer ON store_discount_redemptions(discount_id, customer_email)`,
      `CREATE INDEX IF NOT EXISTS idx_visitors_store ON visitors(store_id, created_at)`,
    ],
  },
];

export async function ensureD1Schema(database: D1Database): Promise<void> {
  const migrationTable = await database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations' LIMIT 1",
    )
    .first<{ name: string }>();

  if (!migrationTable) {
    await database
      .prepare(
        `CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`,
      )
      .run();
  }

  for (const migration of MIGRATIONS) {
    const existing = await database
      .prepare("SELECT 1 FROM schema_migrations WHERE version = ? LIMIT 1")
      .bind(migration.version)
      .first<{ 1: number }>();

    if (!existing) {
      for (const statement of migration.statements) {
        await database.prepare(statement).run();
      }

      await database
        .prepare(
          "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
        )
        .bind(migration.version, new Date().toISOString())
        .run();
    }
  }
}
