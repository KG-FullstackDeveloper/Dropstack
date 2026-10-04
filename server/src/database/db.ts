import Database from "better-sqlite3";
import bcryptjs from "bcryptjs";
import path from "path";

const DB_PATH = path.resolve(
  process.cwd(),
  "dropstack.db"
);

export const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/*
|--------------------------------------------------------------------------
| CREATE CORE TABLES
|--------------------------------------------------------------------------
*/

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'Store Owner',
    phone TEXT,
    two_factor_enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    image_url TEXT,
    video_url TEXT,
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
`);

/*
|--------------------------------------------------------------------------
| SAFE ADMIN USER MIGRATION
|--------------------------------------------------------------------------
|
| The existing database was created with an older admin_users table.
| We add missing columns without deleting or replacing existing data.
|--------------------------------------------------------------------------
*/

const adminColumns = db
  .prepare("PRAGMA table_info(admin_users)")
  .all() as Array<{
    name: string;
  }>;

const adminColumnNames = new Set(
  adminColumns.map((column) => column.name)
);

if (!adminColumnNames.has("phone")) {
  db.exec(
    "ALTER TABLE admin_users ADD COLUMN phone TEXT"
  );
}

if (!adminColumnNames.has("two_factor_enabled")) {
  db.exec(
    "ALTER TABLE admin_users ADD COLUMN two_factor_enabled INTEGER NOT NULL DEFAULT 1"
  );
}

if (!adminColumnNames.has("created_at")) {
  db.exec(
    "ALTER TABLE admin_users ADD COLUMN created_at TEXT"
  );

  db.exec(`
    UPDATE admin_users
    SET created_at = datetime('now')
    WHERE created_at IS NULL
  `);
}

if (!adminColumnNames.has("updated_at")) {
  db.exec(
    "ALTER TABLE admin_users ADD COLUMN updated_at TEXT"
  );

  db.exec(`
    UPDATE admin_users
    SET updated_at = datetime('now')
    WHERE updated_at IS NULL
  `);
}

db.exec(`
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
|--------------------------------------------------------------------------
| AUTH INDEXES
|--------------------------------------------------------------------------
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
`);

/*
|--------------------------------------------------------------------------
| SEED PRODUCTS
|--------------------------------------------------------------------------
*/

const productCount = (
  db
    .prepare(
      "SELECT COUNT(*) as count FROM products"
    )
    .get() as { count: number }
).count;

if (productCount === 0) {
  const now = new Date().toISOString();

  const seedProducts = [
    {
      id: "PRD-" + Date.now() + "-1",
      name: "Wireless Smart Device",
      slug: "wireless-smart-device",
      description:
        "A cutting-edge wireless smart device designed for modern lifestyles. Features seamless connectivity, long battery life, and intuitive controls.",
      category: "Electronics",
      price: 79.99,
      currency: "USD",
      image_url: null,
      video_url: null,
      supplier_name: null,
      supplier_product_id: null,
      warehouse_country: null,
      processing_time: null,
      delivery_time: null,
      supplier_cost: 35,
      shipping_cost: 8,
      other_cost: 2,
      profit_per_unit: 79.99 - 35 - 8 - 2,
      profit_margin:
        ((79.99 - 35 - 8 - 2) / 79.99) * 100,
      active: 1,
      created_at: now,
    },
    {
      id: "PRD-" + (Date.now() + 1) + "-2",
      name: "Skincare Essentials",
      slug: "skincare-essentials",
      description:
        "Premium skincare essentials formulated with natural ingredients for radiant, healthy-looking skin. Suitable for all skin types.",
      category: "Beauty & Skincare",
      price: 49.99,
      currency: "USD",
      image_url: null,
      video_url: null,
      supplier_name: null,
      supplier_product_id: null,
      warehouse_country: null,
      processing_time: null,
      delivery_time: null,
      supplier_cost: 18,
      shipping_cost: 5,
      other_cost: 2,
      profit_per_unit: 49.99 - 18 - 5 - 2,
      profit_margin:
        ((49.99 - 18 - 5 - 2) / 49.99) * 100,
      active: 1,
      created_at: now,
    },
    {
      id: "PRD-" + (Date.now() + 2) + "-3",
      name: "Pet Care Accessory",
      slug: "pet-care-accessory",
      description:
        "High-quality pet care accessory designed for your furry friends' comfort and well-being. Durable, safe, and easy to use.",
      category: "Pet Products",
      price: 34.99,
      currency: "USD",
      image_url: null,
      video_url: null,
      supplier_name: null,
      supplier_product_id: null,
      warehouse_country: null,
      processing_time: null,
      delivery_time: null,
      supplier_cost: 12,
      shipping_cost: 4,
      other_cost: 1,
      profit_per_unit: 34.99 - 12 - 4 - 1,
      profit_margin:
        ((34.99 - 12 - 4 - 1) / 34.99) * 100,
      active: 1,
      created_at: now,
    },
    {
      id: "PRD-" + (Date.now() + 3) + "-4",
      name: "Comfort Shapewear",
      slug: "comfort-shapewear",
      description:
        "Luxurious comfort shapewear crafted from premium breathable fabric. Provides excellent support and a flattering silhouette for everyday wear.",
      category: "Shapewear",
      price: 44.99,
      currency: "USD",
      image_url: null,
      video_url: null,
      supplier_name: null,
      supplier_product_id: null,
      warehouse_country: null,
      processing_time: null,
      delivery_time: null,
      supplier_cost: 15,
      shipping_cost: 6,
      other_cost: 2,
      profit_per_unit: 44.99 - 15 - 6 - 2,
      profit_margin:
        ((44.99 - 15 - 6 - 2) / 44.99) * 100,
      active: 1,
      created_at: now,
    },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (
      id,
      name,
      slug,
      description,
      category,
      price,
      currency,
      image_url,
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
      active,
      created_at
    )
    VALUES (
      @id,
      @name,
      @slug,
      @description,
      @category,
      @price,
      @currency,
      @image_url,
      @video_url,
      @supplier_name,
      @supplier_product_id,
      @warehouse_country,
      @processing_time,
      @delivery_time,
      @supplier_cost,
      @shipping_cost,
      @other_cost,
      @profit_per_unit,
      @profit_margin,
      @active,
      @created_at
    )
  `);

  for (const product of seedProducts) {
    insertProduct.run(product);
  }

  console.log("Seeded 4 demo products.");
}

/*
|--------------------------------------------------------------------------
| SEED SINGLE OWNER ADMIN
|--------------------------------------------------------------------------
*/

const adminCount = (
  db
    .prepare(
      "SELECT COUNT(*) as count FROM admin_users"
    )
    .get() as { count: number }
).count;

if (adminCount === 0) {
  const bootstrapEmail =
    process.env.OWNER_EMAIL?.trim().toLowerCase();

  const bootstrapPassword =
    process.env.OWNER_PASSWORD;

  if (!bootstrapEmail || !bootstrapPassword) {
    throw new Error(
      "No admin exists. Set OWNER_EMAIL and OWNER_PASSWORD in the server .env file before starting the API."
    );
  }

  if (bootstrapPassword.length < 12) {
    throw new Error(
      "OWNER_PASSWORD must be at least 12 characters long."
    );
  }

  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO admin_users (
      id,
      email,
      password_hash,
      name,
      phone,
      two_factor_enabled,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "admin-1",
    bootstrapEmail,
    bcryptjs.hashSync(
      bootstrapPassword,
      12
    ),
    "Store Owner",
    null,
    1,
    now,
    now
  );

  console.log(
    `Created initial owner account for ${bootstrapEmail}.`
  );
}

/*
|--------------------------------------------------------------------------
| SEED STORE CONFIG
|--------------------------------------------------------------------------
*/

const storeConfigCount = (
  db
    .prepare(
      "SELECT COUNT(*) as count FROM store_config"
    )
    .get() as { count: number }
).count;

if (storeConfigCount === 0) {
  const now = new Date().toISOString();

  const defaultNavigation = JSON.stringify([
    {
      label: "Home",
      page: "home",
      enabled: true,
    },
    {
      label: "Catalog",
      page: "catalog",
      enabled: true,
    },
    {
      label: "Contact",
      page: "contact",
      enabled: true,
    },
    {
      label: "Cart",
      page: "cart",
      enabled: true,
    },
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

  db.prepare(`
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
  `).run(
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
    now
  );

  console.log(
    "Created default store configuration."
  );
}