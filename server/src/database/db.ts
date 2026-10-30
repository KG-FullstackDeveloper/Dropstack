import Database from "better-sqlite3";
import bcryptjs from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : fileURLToPath(new URL("../../dropstack.db", import.meta.url));

export const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/*
CREATE CORE TABLES
--------------------------------------------------------------------------
*/

db.exec(`
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Store Owner',
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'store_owner',
  two_factor_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  images TEXT DEFAULT '[]',
  video_url TEXT,
  videos TEXT DEFAULT '[]',
  dimensions TEXT DEFAULT '{}',
  weight REAL,
  cj_metadata TEXT DEFAULT '{}',
  supplier_name TEXT,
  supplier_product_id TEXT,
  warehouse_country TEXT,
  processing_time TEXT,
  delivery_time TEXT,
  supplier_cost REAL DEFAULT 0,
  shipping_cost REAL DEFAULT 0,
  other_cost REAL DEFAULT 0,
  profit_per_unit REAL DEFAULT 0,
  profit_margin REAL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 0,
  variants TEXT DEFAULT '[]',
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
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
  subtotal REAL DEFAULT 0,
  shipping_fee REAL DEFAULT 0,
  total REAL NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  settlement_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'payment_pending',
  flutterwave_transaction_id TEXT,
  flutterwave_reference TEXT,
  supplier_name TEXT,
  supplier_order_reference TEXT,
  tracking_number TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  selling_price REAL NOT NULL,
  supplier_cost REAL DEFAULT 0,
  shipping_cost REAL DEFAULT 0,
  other_cost REAL DEFAULT 0,
  total REAL NOT NULL,
  profit REAL DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS store_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT DEFAULT 'MEO Store',
  description TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  theme_id TEXT DEFAULT 'meo-default',
  navigation TEXT DEFAULT '[]',
  settings TEXT DEFAULT '{}',
  primary_color TEXT DEFAULT '#0f172a',
  accent_color TEXT DEFAULT '#3b82f6',
  font_family TEXT DEFAULT 'Inter',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_codes (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  used_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  action TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL,
  locked_until TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_workspace_settings (
  workspace TEXT PRIMARY KEY,
  settings TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company TEXT,
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'active',
  subscription_expires_at TEXT,
  store_limit INTEGER NOT NULL DEFAULT 1,
  stores_used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_events (
  id TEXT PRIMARY KEY,
  admin_id TEXT,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  previous_stock INTEGER NOT NULL DEFAULT 0,
  change_amount INTEGER NOT NULL DEFAULT 0,
  new_stock INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT 'Correction',
  note TEXT,
  admin_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id
ON inventory_movements(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at
ON inventory_movements(created_at);
`);

/*
ORDER RESERVATION AND EMAIL MIGRATIONS
--------------------------------------------------------------------------
*/

const orderColumns = db.prepare("PRAGMA table_info(orders)").all() as Array<{
  name: string;
}>;

const orderColumnNames = new Set(orderColumns.map((column) => column.name));

if (!orderColumnNames.has("email_sent")) {
  db.exec(`
    ALTER TABLE orders
    ADD COLUMN email_sent INTEGER NOT NULL DEFAULT 0
  `);
}

if (!orderColumnNames.has("email_claimed")) {
  db.exec(`
    ALTER TABLE orders
    ADD COLUMN email_claimed INTEGER NOT NULL DEFAULT 0
  `);
}

if (!orderColumnNames.has("email_claimed_at")) {
  db.exec(`
    ALTER TABLE orders
    ADD COLUMN email_claimed_at TEXT
  `);
}

if (!orderColumnNames.has("reservation_expires_at")) {
  db.exec(`
    ALTER TABLE orders
    ADD COLUMN reservation_expires_at TEXT
  `);
}

if (!orderColumnNames.has("confirmation_token_hash")) {
  db.exec(`
    ALTER TABLE orders
    ADD COLUMN confirmation_token_hash TEXT
  `);
}

if (!orderColumnNames.has("confirmed_at")) {
  db.exec(`
    ALTER TABLE orders
    ADD COLUMN confirmed_at TEXT
  `);
}

if (!orderColumnNames.has("reservation_released_at")) {
  db.exec(`
    ALTER TABLE orders
    ADD COLUMN reservation_released_at TEXT
  `);
}

/*
SAFE COLUMN MIGRATION HELPER
--------------------------------------------------------------------------
*/

function ensureColumn(
  tableName: string,
  columnName: string,
  definition: string,
): void {
  const columns = db
    .prepare(`PRAGMA table_info("${tableName}")`)
    .all() as Array<{ name: string }>;

  if (!columns.some((column) => column.name === columnName)) {
    db.exec(
      `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${definition}`,
    );
  }
}

/*
ORDER ITEM VARIANT MIGRATIONS
--------------------------------------------------------------------------
*/

ensureColumn("order_items", "variant_id", "TEXT");
ensureColumn("order_items", "variant_name", "TEXT");
ensureColumn("orders", "store_id", "TEXT");

/*
SAFE ADMIN USER MIGRATION
--------------------------------------------------------------------------
*/

ensureColumn("admin_users", "phone", "TEXT");
ensureColumn("admin_users", "role", "TEXT NOT NULL DEFAULT 'store_owner'");
ensureColumn("admin_users", "two_factor_enabled", "INTEGER NOT NULL DEFAULT 1");

ensureColumn("admin_users", "created_at", "TEXT");
ensureColumn("admin_users", "updated_at", "TEXT");

db.exec(`
UPDATE admin_users
SET role = 'store_owner'
WHERE role IS NULL OR TRIM(role) = '';

UPDATE admin_users
SET two_factor_enabled = 1
WHERE two_factor_enabled IS NULL;

UPDATE admin_users
SET created_at = datetime('now')
WHERE created_at IS NULL;

UPDATE admin_users
SET updated_at = datetime('now')
WHERE updated_at IS NULL;
`);

/*
SAFE PRODUCT MIGRATIONS
--------------------------------------------------------------------------
Add new columns individually so existing product records remain intact.
*/

ensureColumn("products", "sku", "TEXT");
ensureColumn("products", "images", "TEXT DEFAULT '[]'");
ensureColumn("products", "video_url", "TEXT");
ensureColumn("products", "videos", "TEXT DEFAULT '[]'");
ensureColumn("products", "dimensions", "TEXT DEFAULT '{}'");
ensureColumn("products", "weight", "REAL");
ensureColumn("products", "cj_metadata", "TEXT DEFAULT '{}'");
ensureColumn("products", "supplier_name", "TEXT");
ensureColumn("products", "supplier_product_id", "TEXT");
ensureColumn("products", "warehouse_country", "TEXT");
ensureColumn("products", "processing_time", "TEXT");
ensureColumn("products", "delivery_time", "TEXT");
ensureColumn("products", "supplier_cost", "REAL DEFAULT 0");
ensureColumn("products", "shipping_cost", "REAL DEFAULT 0");
ensureColumn("products", "other_cost", "REAL DEFAULT 0");
ensureColumn("products", "profit_per_unit", "REAL DEFAULT 0");
ensureColumn("products", "profit_margin", "REAL DEFAULT 0");
ensureColumn("products", "stock", "INTEGER DEFAULT 0");
ensureColumn("products", "low_stock_threshold", "INTEGER DEFAULT 0");
ensureColumn("products", "variants", "TEXT DEFAULT '[]'");
ensureColumn("products", "active", "INTEGER DEFAULT 1");
ensureColumn("products", "created_at", "TEXT");
ensureColumn("products", "store_id", "TEXT");

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_store_active
  ON products(store_id, active);
`);

db.exec(`
UPDATE products SET images = '[]' WHERE images IS NULL;
UPDATE products SET videos = '[]' WHERE videos IS NULL;
UPDATE products SET dimensions = '{}' WHERE dimensions IS NULL;
UPDATE products SET cj_metadata = '{}' WHERE cj_metadata IS NULL;
UPDATE products SET variants = '[]' WHERE variants IS NULL;
UPDATE products SET supplier_cost = 0 WHERE supplier_cost IS NULL;
UPDATE products SET shipping_cost = 0 WHERE shipping_cost IS NULL;
UPDATE products SET other_cost = 0 WHERE other_cost IS NULL;
UPDATE products SET profit_per_unit = 0 WHERE profit_per_unit IS NULL;
UPDATE products SET profit_margin = 0 WHERE profit_margin IS NULL;
UPDATE products SET stock = 0 WHERE stock IS NULL;
UPDATE products SET low_stock_threshold = 0 WHERE low_stock_threshold IS NULL;
UPDATE products SET active = 1 WHERE active IS NULL;
UPDATE products SET created_at = datetime('now') WHERE created_at IS NULL;
`);

/*
REMOVE OLD HARDCODED DEMO PRODUCTS
--------------------------------------------------------------------------
Only known demo SKUs are removed. Other products are preserved.
*/

db.prepare(
  `
  DELETE FROM products
  WHERE sku IN (
    'MEO-ELEC-001',
    'MEO-BEAU-001',
    'MEO-PET-001',
    'MEO-SHAP-001'
  )
`,
).run();

/*
AUTH AND PRODUCT INDEXES
--------------------------------------------------------------------------
*/

db.exec(`
CREATE INDEX IF NOT EXISTS idx_auth_codes_admin_id
ON auth_codes(admin_id);

CREATE INDEX IF NOT EXISTS idx_auth_codes_purpose
ON auth_codes(purpose);

CREATE INDEX IF NOT EXISTS idx_auth_codes_expires_at
ON auth_codes(expires_at);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_key_action
ON auth_rate_limits(key, action);

CREATE INDEX IF NOT EXISTS idx_login_events_admin_id
ON login_events(admin_id);

CREATE INDEX IF NOT EXISTS idx_login_events_created_at
ON login_events(created_at);

CREATE INDEX IF NOT EXISTS idx_products_sku
ON products(sku);

CREATE INDEX IF NOT EXISTS idx_products_category
ON products(category);

CREATE INDEX IF NOT EXISTS idx_products_active
ON products(active);

CREATE INDEX IF NOT EXISTS idx_products_supplier_product_id
ON products(supplier_product_id);
`);

/*
SEED SINGLE OWNER ADMIN
--------------------------------------------------------------------------
*/

const adminCount = (
  db.prepare("SELECT COUNT(*) as count FROM admin_users").get() as {
    count: number;
  }
).count;

if (adminCount === 0) {
  const bootstrapEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();

  const bootstrapPassword = process.env.OWNER_PASSWORD;

  if (!bootstrapEmail || !bootstrapPassword) {
    throw new Error(
      "No admin exists. Set OWNER_EMAIL and OWNER_PASSWORD in the server .env file before starting the API.",
    );
  }

  if (bootstrapPassword.length < 8) {
    throw new Error("OWNER_PASSWORD must be at least 8 characters long.");
  }

  const now = new Date().toISOString();

  db.prepare(
    `
    INSERT INTO admin_users (
      id,
      email,
      password_hash,
      name,
      phone,
      role,
      two_factor_enabled,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    "admin-1",
    bootstrapEmail,
    bcryptjs.hashSync(bootstrapPassword, 12),
    "Store Owner",
    null,
    "platform_owner",
    1,
    now,
    now,
  );

  console.log(`Created initial owner account for ${bootstrapEmail}.`);
}

/*
SEED STORE CONFIG
--------------------------------------------------------------------------
*/

const storeConfigCount = (
  db.prepare("SELECT COUNT(*) as count FROM store_config").get() as {
    count: number;
  }
).count;

if (storeConfigCount === 0) {
  const now = new Date().toISOString();

  const defaultNavigation = JSON.stringify([
    { label: "Home", page: "home", enabled: true },
    { label: "Catalog", page: "catalog", enabled: true },
    { label: "Contact", page: "contact", enabled: true },
    { label: "Cart", page: "cart", enabled: true },
  ]);

  const defaultSettings = JSON.stringify({
    showRelatedProducts: true,
    showContactPage: true,
    showCatalogPage: true,
    showCartPage: true,
    showSearch: true,
    showNewsletter: true,
    showTestimonials: true,
    showTrustBadges: true,
    showAnnouncementBar: false,
    stickyHeader: true,
    darkMode: true,
  });

  db.prepare(
    `
    INSERT INTO store_config (
      id,
      name,
      description,
      logo_url,
      favicon_url,
      theme_id,
      navigation,
      settings,
      primary_color,
      accent_color,
      font_family,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    "default",
    "MEO Store",
    "A professional ecommerce store.",
    null,
    null,
    "meo-default",
    defaultNavigation,
    defaultSettings,
    "#0f172a",
    "#3b82f6",
    "Inter",
    now,
  );

  console.log("Created default store configuration.");
}

/*
MULTI-STORE REGISTRY MIGRATION
--------------------------------------------------------------------------
*/

db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'MEO Store',
    slug TEXT NOT NULL DEFAULT 'meo-store',
    niche TEXT NOT NULL DEFAULT 'General',
    domain TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    shipping_fee REAL,
    delivery_estimate TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

/*
STORE PRODUCT ASSIGNMENTS
*/

db.exec(`
  CREATE TABLE IF NOT EXISTS store_products (
    store_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    price_override REAL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (store_id, product_id),
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_store_products_store_id
    ON store_products(store_id);

  CREATE INDEX IF NOT EXISTS idx_store_products_product_id
    ON store_products(product_id);
`);

ensureColumn("stores", "name", "TEXT NOT NULL DEFAULT 'MEO Store'");
ensureColumn("stores", "slug", "TEXT NOT NULL DEFAULT 'meo-store'");
ensureColumn("stores", "niche", "TEXT NOT NULL DEFAULT 'General'");
ensureColumn("stores", "domain", "TEXT");
ensureColumn("stores", "status", "TEXT NOT NULL DEFAULT 'draft'");
ensureColumn("stores", "created_at", "TEXT");
ensureColumn("stores", "updated_at", "TEXT");
ensureColumn("stores", "shipping_fee", "REAL");
ensureColumn("stores", "delivery_estimate", "TEXT");
ensureColumn("store_products", "price_override", "REAL");

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_stores_status
  ON stores(status);
`);

db.exec(`
  UPDATE stores
  SET created_at = COALESCE(created_at, datetime('now'))
  WHERE created_at IS NULL;

  UPDATE stores
  SET updated_at = COALESCE(updated_at, datetime('now'))
  WHERE updated_at IS NULL;
`);

/*
CUSTOMER SUPPORT MESSAGES
--------------------------------------------------------------------------
Persist public contact-form submissions so the UI only reports success
when the backend has actually saved the message.
*/
db.exec(`
  CREATE TABLE IF NOT EXISTS support_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_support_messages_created_at
    ON support_messages(created_at);
`);

/*
REGISTER DEFAULT STOREFRONT
--------------------------------------------------------------------------
INSERT OR IGNORE avoids duplicate registration on later server starts.
*/

const defaultStoreConfig = db
  .prepare(
    `
    SELECT id, name, updated_at
    FROM store_config
    WHERE id = 'default'
  `,
  )
  .get() as { id: string; name: string; updated_at: string } | undefined;

if (defaultStoreConfig) {
  const existingDefaultStore = db
    .prepare(
      `
      SELECT id
      FROM stores
      WHERE id = 'default' OR slug = 'meo-store'
      LIMIT 1
    `,
    )
    .get();

  if (!existingDefaultStore) {
    const timestamp = defaultStoreConfig.updated_at || new Date().toISOString();

    db.prepare(
      `
      INSERT INTO stores (
        id,
        name,
        slug,
        niche,
        domain,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      "default",
      defaultStoreConfig.name || "MEO Store",
      "meo-store",
      "General",
      null,
      "Active",
      timestamp,
      timestamp,
    );
  }
}
