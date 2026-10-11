import { Hono } from "hono";
import { db } from "../database/db";
import { authMiddleware } from "../middleware/auth";
import { createId } from "../utils/id";

const stores = new Hono();

type StoreStatus = "Active" | "Draft" | "Archived";
type StoreRow = {
  id: string;
  name: string;
  slug: string;
  niche: string;
  domain: string | null;
  status: StoreStatus;
  created_at: string;
  updated_at: string;
};

const validStatuses = new Set<StoreStatus>(["Active", "Draft", "Archived"]);

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeStatus(
  value: unknown,
  fallback: StoreStatus = "Draft",
): StoreStatus | null {
  if (value === undefined || value === null || value === "") return fallback;
  switch (String(value).trim().toLowerCase()) {
    case "active": return "Active";
    case "draft": return "Draft";
    case "archived": return "Archived";
    default: return null;
  }
}

function toStore(row: StoreRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    niche: row.niche,
    domain: row.domain || `${row.slug}.localhost`,
    status: row.status.toLowerCase() as "active" | "draft" | "archived",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function columns(table: string): Set<string> {
  return new Set(
    (
      db.prepare(`PRAGMA table_info("${table}")`).all() as Array<{
        name: string;
      }>
    ).map((row) => row.name),
  );
}

function storeById(id: string): StoreRow | undefined {
  return db.prepare(`
    SELECT id, name, slug, niche, domain, status, created_at, updated_at
    FROM stores WHERE id = ?
  `).get(id) as StoreRow | undefined;
}

/**
 * Keep product assignment in its own join table so the existing products
 * table and product records are not modified.
 */
function ensureStoreProductsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS store_registry_metadata (
      store_id TEXT PRIMARY KEY,
      archived INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS store_products (
      store_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (store_id, product_id)
    );
    CREATE INDEX IF NOT EXISTS idx_store_products_store_id
      ON store_products(store_id);
    CREATE INDEX IF NOT EXISTS idx_store_products_product_id
      ON store_products(product_id);
  `);
}

ensureStoreProductsTable();

function productIdsFromBody(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  if (!value.every((id) => typeof id === "string" && id.trim())) return null;
  return [...new Set(value.map((id) => String(id).trim()))];
}

function saveStoreProducts(storeId: string, productIds: string[], now: string) {
  const productColumns = columns("products");
  if (!productColumns.has("id")) {
    throw new Error("The products table does not contain an id column.");
  }

  const findProduct = db.prepare("SELECT id FROM products WHERE id = ?");
  const insertAssignment = db.prepare(`
    INSERT OR IGNORE INTO store_products (store_id, product_id, created_at)
    VALUES (?, ?, ?)
  `);

  for (const productId of productIds) {
    if (!findProduct.get(productId)) {
      throw new Error(`Product not found: ${productId}`);
    }
  }

  db.prepare("DELETE FROM store_products WHERE store_id = ?").run(storeId);
  for (const productId of productIds) {
    insertAssignment.run(storeId, productId, now);
  }
}

function getAssignedProducts(storeId: string) {
  const productColumns = columns("products");
  const selected = [
    "id",
    "name",
    "slug",
    "description",
    "category",
    "price",
    "currency",
    "image_url",
    "images",
    "sku",
    "stock",
    "active",
  ].filter((column) => productColumns.has(column));

  if (!selected.includes("id")) return [];

  return db.prepare(`
    SELECT ${selected.map((column) => `p."${column}"`).join(", ")}
    FROM products p
    INNER JOIN store_products sp ON sp.product_id = p.id
    WHERE sp.store_id = ?
    ORDER BY sp.created_at ASC
  `).all(storeId);
}

function isArchived(id: string): boolean {
  const row = db.prepare(
    "SELECT archived FROM store_registry_metadata WHERE store_id = ?",
  ).get(id) as { archived: number } | undefined;
  return row?.archived === 1;
}

function setArchived(id: string, archived: boolean, now: string) {
  db.prepare(`
    INSERT INTO store_registry_metadata (store_id, archived, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(store_id) DO UPDATE SET
      archived = excluded.archived,
      updated_at = excluded.updated_at
  `).run(id, archived ? 1 : 0, now);
}

function list(c: any) {
  try {
    const rows = db.prepare(`
      SELECT id, name, slug, niche, domain, status, created_at, updated_at
      FROM stores
      ORDER BY datetime(created_at) DESC, name COLLATE NOCASE ASC
    `).all() as StoreRow[];

    return c.json({ success: true, data: rows.filter((row) => !isArchived(row.id)).map(toStore) });
  } catch (error) {
    console.error("List stores error:", error);
    return c.json({ success: false, error: "Unable to load stores." }, 500);
  }
}

stores.use("*", authMiddleware);
stores.get("/", list);
stores.get("", list);

stores.post("/", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
    const name = clean(body.name);
    const niche = clean(body.niche) || "General";
    const slug = slugify(clean(body.slug) || name);
    const description = clean(body.description) || `${name} — ${niche} storefront`;
    const productIds = productIdsFromBody(body.productIds);

    if (!name) return c.json({ success: false, error: "Store name is required." }, 400);
    if (!slug) return c.json({ success: false, error: "Store name must contain letters or numbers." }, 400);
    if (!productIds) return c.json({ success: false, error: "productIds must be an array of product IDs." }, 400);

    if (db.prepare("SELECT id FROM stores WHERE slug = ? COLLATE NOCASE").get(slug)) {
      return c.json({ success: false, error: "A store with this URL slug already exists. Change the store name or slug." }, 409);
    }

    const inputDomain = clean(body.domain).replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    const domain = inputDomain || `${slug}.localhost`;
    if (db.prepare("SELECT id FROM stores WHERE domain = ? COLLATE NOCASE AND domain IS NOT NULL AND domain != ''").get(domain)) {
      return c.json({ success: false, error: "That domain is already assigned to another store." }, 409);
    }

    const id = createId("store");
    const now = new Date().toISOString();
    const configColumns = columns("store_config");

    const create = db.transaction(() => {
      // Use the legacy-compatible status casing expected by existing databases.
      db.prepare(`
        INSERT INTO stores (id, name, slug, niche, domain, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'Draft', ?, ?)
      `).run(id, name, slug, niche, domain, now, now);

      const fields = [
        "id", "name", "description", "logo_url", "favicon_url", "theme_id",
        "navigation", "settings", "primary_color", "accent_color", "font_family", "updated_at",
      ].filter((field) => configColumns.has(field));

      const configValues: Record<string, unknown> = {
        id,
        name,
        description,
        logo_url: null,
        favicon_url: null,
        theme_id: "meo-default",
        navigation: JSON.stringify([
          { label: "Home", page: "home", enabled: true },
          { label: "Products", page: "catalog", enabled: true },
          { label: "About", page: "about", enabled: true },
          { label: "Contact", page: "contact", enabled: true },
          { label: "Cart", page: "cart", enabled: true },
        ]),
        settings: JSON.stringify({
          showRelatedProducts: true, showContactPage: true, showCatalogPage: true,
          showCartPage: true, showSearch: true, showNewsletter: true,
          showTestimonials: true, showTrustBadges: true, showAnnouncementBar: true,
          stickyHeader: true, darkMode: false,
        }),
        primary_color: "#064e3b",
        accent_color: "#10b981",
        font_family: "Inter",
        updated_at: now,
      };

      if (!db.prepare("SELECT id FROM store_config WHERE id = ?").get(id)) {
        db.prepare(`
          INSERT INTO store_config (${fields.map((field) => `"${field}"`).join(", ")})
          VALUES (${fields.map(() => "?").join(", ")})
        `).run(...fields.map((field) => configValues[field]));
      }

      // Validate and save product assignments in the same transaction as creation.
      saveStoreProducts(id, productIds, now);
      setArchived(id, false, now);
    });

    create();

    const created = storeById(id);
    if (!created) throw new Error("Store was created but could not be loaded.");

    return c.json({
      success: true,
      data: { ...toStore(created), productIds },
      message: `Store created with ${productIds.length} assigned product(s).`,
    }, 201);
  } catch (error) {
    console.error("Create store error:", error);
    const message = error instanceof Error ? error.message : "Unable to create store.";
    const status = /UNIQUE/i.test(message) ? 409 : /Product not found/.test(message) ? 400 : 500;
    return c.json({ success: false, error: message }, status);
  }
});

stores.get("/:id/products", (c) => {
  try {
    const id = c.req.param("id");
    if (!storeById(id)) {
      return c.json({ success: false, error: "Store not found." }, 404);
    }

    const products = getAssignedProducts(id);
    const productIds = products.map((product: any) => String(product.id));

    return c.json({ success: true, data: products, productIds });
  } catch (error) {
    console.error("Get store products error:", error);
    return c.json({ success: false, error: "Unable to load products assigned to this store." }, 500);
  }
});

stores.put("/:id/products", async (c) => {
  try {
    const id = c.req.param("id");
    if (!storeById(id)) {
      return c.json({ success: false, error: "Store not found." }, 404);
    }

    const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
    const productIds = productIdsFromBody(body.productIds);

    if (!productIds) {
      return c.json({ success: false, error: "productIds must be an array of product IDs." }, 400);
    }

    const now = new Date().toISOString();
    db.transaction(() => saveStoreProducts(id, productIds, now))();

    return c.json({
      success: true,
      data: { storeId: id, productIds },
      message: `${productIds.length} product(s) assigned to the store.`,
    });
  } catch (error) {
    console.error("Save store products error:", error);
    const message = error instanceof Error ? error.message : "Unable to save store products.";
    const status = /Product not found/.test(message) ? 400 : 500;
    return c.json({ success: false, error: message }, status);
  }
});

stores.get("/:id", (c) => {
  try {
    const row = storeById(c.req.param("id"));
    if (!row) return c.json({ success: false, error: "Store not found." }, 404);

    return c.json({
      success: true,
      data: { ...toStore(row), productIds: getAssignedProducts(row.id).map((product: any) => String(product.id)) },
    });
  } catch (error) {
    console.error("Get store error:", error);
    return c.json({ success: false, error: "Unable to load store." }, 500);
  }
});

stores.patch("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
    const current = storeById(id);
    if (!current) return c.json({ success: false, error: "Store not found." }, 404);

    const name = body.name === undefined ? current.name : clean(body.name);
    const niche = body.niche === undefined ? current.niche : (clean(body.niche) || "General");
    const slug = body.slug === undefined ? current.slug : slugify(clean(body.slug) || name);
    const rawDomain = body.domain === undefined ? (current.domain || "") : clean(body.domain);
    const domain = rawDomain.replace(/^https?:\/\//i, "").replace(/\/+$/, "") || `${slug}.localhost`;
    const status = body.status === undefined ? current.status : normalizeStatus(body.status, current.status);
    const productIds = body.productIds === undefined ? null : productIdsFromBody(body.productIds);

    if (!name) return c.json({ success: false, error: "Store name is required." }, 400);
    if (!slug) return c.json({ success: false, error: "Store slug is invalid." }, 400);
    if (!status || !validStatuses.has(status)) return c.json({ success: false, error: "Status must be Active, Draft, or Archived." }, 400);
    if (productIds === null && body.productIds !== undefined) return c.json({ success: false, error: "productIds must be an array of product IDs." }, 400);
    if (id === "default" && status === "Archived") return c.json({ success: false, error: "The default store cannot be archived." }, 400);

    if (db.prepare("SELECT id FROM stores WHERE slug = ? COLLATE NOCASE AND id != ?").get(slug, id)) {
      return c.json({ success: false, error: "Another store already uses that slug." }, 409);
    }
    if (db.prepare("SELECT id FROM stores WHERE domain = ? COLLATE NOCASE AND id != ? AND domain IS NOT NULL AND domain != ''").get(domain, id)) {
      return c.json({ success: false, error: "Another store already uses that domain." }, 409);
    }

    const now = new Date().toISOString();
    const update = db.transaction(() => {
      // Some existing databases constrain stores.status to only Active/Draft.
      // Store archived state separately so archiving works without rebuilding user data.
      const databaseStatus = status === "Archived" ? "Draft" : status;
      db.prepare("UPDATE stores SET name = ?, slug = ?, niche = ?, domain = ?, status = ?, updated_at = ? WHERE id = ?")
        .run(name, slug, niche, domain, databaseStatus, now, id);
      setArchived(id, status === "Archived", now);

      if (columns("store_config").has("name") && db.prepare("SELECT id FROM store_config WHERE id = ?").get(id)) {
        const configCols = columns("store_config");
        if (configCols.has("description") && body.description !== undefined) {
          db.prepare("UPDATE store_config SET name = ?, description = ?, updated_at = ? WHERE id = ?")
            .run(name, clean(body.description), now, id);
        } else {
          db.prepare("UPDATE store_config SET name = ?, updated_at = ? WHERE id = ?").run(name, now, id);
        }
      }

      if (productIds !== null) saveStoreProducts(id, productIds, now);
    });
    update();

    const updated = storeById(id);
    if (!updated) throw new Error("Store was updated but could not be loaded.");

    return c.json({
      success: true,
      data: {
        ...toStore(updated),
        productIds: getAssignedProducts(id).map((product: any) => String(product.id)),
      },
      message: "Store updated successfully.",
    });
  } catch (error) {
    console.error("Update store error:", error);
    const message = error instanceof Error ? error.message : "Unable to update store.";
    const status = /UNIQUE/i.test(message) ? 409 : /Product not found/.test(message) ? 400 : 500;
    return c.json({ success: false, error: message }, status);
  }
});

stores.delete("/:id", (c) => {
  try {
    const id = c.req.param("id");
    if (id === "default") return c.json({ success: false, error: "The default store cannot be deleted." }, 400);

    if (!db.prepare("SELECT id FROM stores WHERE id = ?").get(id)) {
      return c.json({ success: false, error: "Store not found." }, 404);
    }

    const now = new Date().toISOString();
    db.transaction(() => {
      // Keep the legacy status constraint intact; archive state lives in metadata.
      db.prepare("UPDATE stores SET status = 'Draft', updated_at = ? WHERE id = ?")
        .run(now, id);
      setArchived(id, true, now);
    })();

    return c.json({ success: true, message: "Store archived successfully." });
  } catch (error) {
    console.error("Archive store error:", error);
    return c.json({ success: false, error: error instanceof Error ? error.message : "Unable to archive store." }, 500);
  }
});

export default stores;
