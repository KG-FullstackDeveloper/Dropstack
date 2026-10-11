
import { Hono } from "hono";
import { db } from "../db";
import { authMiddleware } from "../middleware/auth";

const stores = new Hono();

type StoreRow = {
  id: string;
  name: string;
  slug: string;
  niche: string;
  domain: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const clean = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const slugify = (value: string) =>
  value.toLowerCase().trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const getStore = (id: string) =>
  db.prepare(`
    SELECT id, name, slug, niche, domain, status, created_at, updated_at
    FROM stores WHERE id = ?
  `).get(id) as StoreRow | undefined;

const isActive = (status: string) =>
  status.toLowerCase() === "active";

const serializeStore = (row: StoreRow) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  niche: row.niche,
  domain: row.domain || `${row.slug}.localhost`,
  status: row.status.toLowerCase(),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

function getAssignedProducts(storeId: string) {
  return db.prepare(`
    SELECT p.id, p.name, p.slug, p.description, p.category,
           p.price, p.currency, p.image_url, p.images,
           p.sku, p.stock, p.active
    FROM products p
    INNER JOIN store_products sp ON sp.product_id = p.id
    WHERE sp.store_id = ?
      AND p.active = 1
    ORDER BY p.created_at DESC
  `).all(storeId);
}

function parseProductIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  if (!value.every(
    (id) => typeof id === "string" && id.trim().length > 0
  )) {
    return null;
  }

  return [...new Set(value.map((id) => id.trim()))];
}

function saveProducts(
  storeId: string,
  productIds: string[],
  now: string
) {
  const findProduct = db.prepare(
    "SELECT id FROM products WHERE id = ?"
  );

  for (const productId of productIds) {
    if (!findProduct.get(productId)) {
      throw new Error(`Product not found: ${productId}`);
    }
  }

  db.prepare(
    "DELETE FROM store_products WHERE store_id = ?"
  ).run(storeId);

  const insert = db.prepare(`
    INSERT INTO store_products (store_id, product_id, created_at)
    VALUES (?, ?, ?)
  `);

  for (const productId of productIds) {
    insert.run(storeId, productId, now);
  }
}

/*
PUBLIC STOREFRONT ROUTES
These routes must remain before the admin authentication middleware.
*/

// Public store lookup by slug. Draft and archived stores stay private.
stores.get("/public/:slug", (c) => {
  try {
    const row = db.prepare(`
      SELECT id, name, slug, niche, domain, status, created_at, updated_at
      FROM stores
      WHERE slug = ? COLLATE NOCASE
      LIMIT 1
    `).get(c.req.param("slug")) as StoreRow | undefined;

    if (!row || !isActive(row.status)) {
      return c.json({
        success: false,
        error: "Store not found."
      }, 404);
    }

    return c.json({
      success: true,
      data: serializeStore(row)
    });
  } catch (error) {
    console.error("Public store lookup failed:", error);
    return c.json({
      success: false,
      error: "Unable to load store."
    }, 500);
  }
});

// Public products are restricted to the requested active store.
stores.get("/public/:slug/products", (c) => {
  try {
    const row = db.prepare(`
      SELECT id, status
      FROM stores
      WHERE slug = ? COLLATE NOCASE
      LIMIT 1
    `).get(c.req.param("slug")) as
      | { id: string; status: string }
      | undefined;

    if (!row || !isActive(row.status)) {
      return c.json({
        success: false,
        error: "Store not found."
      }, 404);
    }

    return c.json({
      success: true,
      data: getAssignedProducts(row.id)
    });
  } catch (error) {
    console.error("Public store products failed:", error);
    return c.json({
      success: false,
      error: "Unable to load store products."
    }, 500);
  }
});

/*
PROTECTED ADMIN ROUTES
*/

stores.use("*", authMiddleware);

stores.get("/", (c) => {
  try {
    const rows = db.prepare(`
      SELECT id, name, slug, niche, domain, status, created_at, updated_at
      FROM stores
      ORDER BY datetime(created_at) DESC
    `).all() as StoreRow[];

    return c.json({
      success: true,
      data: rows.map(serializeStore)
    });
  } catch (error) {
    console.error("List stores failed:", error);
    return c.json({
      success: false,
      error: "Unable to load stores."
    }, 500);
  }
});

stores.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const name = clean(body.name);
    const niche = clean(body.niche) || "General";
    const slug = slugify(clean(body.slug) || name);
    const productIds = body.productIds === undefined
      ? []
      : parseProductIds(body.productIds);

    if (!name || !slug) {
      return c.json({
        success: false,
        error: "A valid store name is required."
      }, 400);
    }

    if (productIds === null) {
      return c.json({
        success: false,
        error: "productIds must be an array of product IDs."
      }, 400);
    }

    if (db.prepare(
      "SELECT id FROM stores WHERE slug = ? COLLATE NOCASE"
    ).get(slug)) {
      return c.json({
        success: false,
        error: "That store slug already exists."
      }, 409);
    }

    const id = `store_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const domain = clean(body.domain) || `${slug}.localhost`;

    db.transaction(() => {
      db.prepare(`
        INSERT INTO stores
          (id, name, slug, niche, domain, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'Draft', ?, ?)
      `).run(id, name, slug, niche, domain, now, now);

      db.prepare(`
        INSERT OR IGNORE INTO store_config
          (id, name, description, theme_id, navigation, settings,
           primary_color, accent_color, font_family, updated_at)
        VALUES (?, ?, ?, 'meo-default', '[]', '{}',
                '#0f172a', '#3b82f6', 'Inter', ?)
      `).run(id, name, `${name} storefront`, now);

      saveProducts(id, productIds, now);
    })();

    const created = getStore(id)!;

    return c.json({
      success: true,
      data: {
        ...serializeStore(created),
        productIds
      }
    }, 201);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Unable to create store.";

    return c.json({
      success: false,
      error: message
    }, /Product not found/.test(message) ? 400 : 500);
  }
});

stores.get("/:id/products", (c) => {
  try {
    const id = c.req.param("id");

    if (!getStore(id)) {
      return c.json({
        success: false,
        error: "Store not found."
      }, 404);
    }

    const products = db.prepare(`
      SELECT product_id FROM store_products
      WHERE store_id = ?
    `).all(id) as Array<{ product_id: string }>;

    return c.json({
      success: true,
      data: getAssignedProducts(id),
      productIds: products.map((p) => p.product_id)
    });
  } catch (error) {
    console.error("Load assigned products failed:", error);
    return c.json({
      success: false,
      error: "Unable to load assigned products."
    }, 500);
  }
});

stores.put("/:id/products", async (c) => {
  try {
    const id = c.req.param("id");

    if (!getStore(id)) {
      return c.json({
        success: false,
        error: "Store not found."
      }, 404);
    }

    const body = await c.req.json();
    const productIds = parseProductIds(body.productIds);

    if (productIds === null) {
      return c.json({
        success: false,
        error: "productIds must be an array of product IDs."
      }, 400);
    }

    db.transaction(() => {
      saveProducts(id, productIds, new Date().toISOString());
    })();

    return c.json({
      success: true,
      data: { storeId: id, productIds }
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Unable to save product assignments.";

    return c.json({
      success: false,
      error: message
    }, /Product not found/.test(message) ? 400 : 500);
  }
});

stores.get("/:id", (c) => {
  const row = getStore(c.req.param("id"));

  if (!row) {
    return c.json({
      success: false,
      error: "Store not found."
    }, 404);
  }

  const products = db.prepare(`
    SELECT product_id FROM store_products WHERE store_id = ?
  `).all(row.id) as Array<{ product_id: string }>;

  return c.json({
    success: true,
    data: {
      ...serializeStore(row),
      productIds: products.map((p) => p.product_id)
    }
  });
});

stores.patch("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const current = getStore(id);

    if (!current) {
      return c.json({
        success: false,
        error: "Store not found."
      }, 404);
    }

    const body = await c.req.json();
    const name = body.name === undefined
      ? current.name
      : clean(body.name);
    const niche = body.niche === undefined
      ? current.niche
      : clean(body.niche) || "General";
    const slug = body.slug === undefined
      ? current.slug
      : slugify(clean(body.slug) || name);
    const status = body.status === undefined
      ? current.status
      : clean(body.status);

    if (!name || !slug) {
      return c.json({
        success: false,
        error: "A valid store name and slug are required."
      }, 400);
    }

    if (!["Active", "Draft", "Archived"].includes(status)) {
      return c.json({
        success: false,
        error: "Invalid store status."
      }, 400);
    }

    if (id === "default" && status === "Archived") {
      return c.json({
        success: false,
        error: "The default store cannot be archived."
      }, 400);
    }

    const duplicate = db.prepare(`
      SELECT id FROM stores
      WHERE slug = ? COLLATE NOCASE AND id != ?
    `).get(slug, id);

    if (duplicate) {
      return c.json({
        success: false,
        error: "That store slug is already in use."
      }, 409);
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE stores
      SET name = ?, slug = ?, niche = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(name, slug, niche, status, now, id);

    const updated = getStore(id)!;

    return c.json({
      success: true,
      data: serializeStore(updated)
    });
  } catch (error) {
    console.error("Update store failed:", error);
    return c.json({
      success: false,
      error: "Unable to update store."
    }, 500);
  }
});

stores.delete("/:id", (c) => {
  const id = c.req.param("id");

  if (id === "default") {
    return c.json({
      success: false,
      error: "The default store cannot be archived."
    }, 400);
  }

  const row = getStore(id);

  if (!row) {
    return c.json({
      success: false,
      error: "Store not found."
    }, 404);
  }

  db.prepare(`
    UPDATE stores SET status = 'Archived', updated_at = ?
    WHERE id = ?
  `).run(new Date().toISOString(), id);

  return c.json({
    success: true,
    message: "Store archived."
  });
});

export default stores;
