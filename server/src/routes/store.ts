
import { Hono } from "hono";
import { db } from "../database/db";
import { authMiddleware } from "../middleware/auth";

const stores = new Hono();

type StoreStatus = "Active" | "Draft";

interface StoreRow {
  id: string;
  name: string;
  slug: string;
  niche: string;
  status: StoreStatus;
  description: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ProductRow extends Record<string, unknown> {
  id: string;
  store_id?: string | null;
  active?: number | boolean;
  price?: number | string | null;
  stock?: number | string | null;
  images?: string | string[] | null;
  variants?: string | unknown[] | null;
}

function makeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function getStore(id: string): StoreRow | undefined {
  return db
    .prepare("SELECT * FROM stores WHERE id = ?")
    .get(id) as StoreRow | undefined;
}

function getStoreBySlug(slug: string): StoreRow | undefined {
  return db
    .prepare("SELECT * FROM stores WHERE slug = ?")
    .get(slug) as StoreRow | undefined;
}

function getStoreResponse(store: StoreRow) {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    niche: store.niche,
    status: store.status,
    description: store.description,
    logo_url: store.logo_url,
    created_at: store.created_at,
    updated_at: store.updated_at,
  };
}

function parseJson(value: unknown, fallback: unknown): unknown {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseStoreStatus(value: unknown): StoreStatus | null {
  if (value === "Active" || value === "Draft") {
    return value;
  }

  return null;
}

/**
 * ADMIN: LIST STORES
 * GET /api/store
 */
stores.get("/", authMiddleware, (c) => {
  const rows = db
    .prepare("SELECT * FROM stores ORDER BY created_at DESC")
    .all() as StoreRow[];

  const result = rows.map((store) => {
    const productCount = db
      .prepare("SELECT COUNT(*) AS count FROM products WHERE store_id = ?")
      .get(store.id) as { count: number };

    return {
      ...getStoreResponse(store),
      products: productCount.count,
    };
  });

  return c.json({
    success: true,
    data: result,
  });
});

/**
 * ADMIN: CREATE STORE
 * POST /api/store
 */
stores.post("/", authMiddleware, async (c) => {
  let body: Record<string, unknown>;

  try {
    body = await c.req.json<Record<string, unknown>>();
  } catch {
    return c.json(
      { success: false, error: "A valid JSON request body is required." },
      400,
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const niche =
    typeof body.niche === "string" && body.niche.trim()
      ? body.niche.trim()
      : "Other";
  const description =
    typeof body.description === "string" ? body.description.trim() : null;
  const logoUrl =
    typeof body.logo_url === "string" ? body.logo_url.trim() : null;

  if (!name) {
    return c.json(
      { success: false, error: "Store name is required." },
      400,
    );
  }

  const requestedSlug =
    typeof body.slug === "string" && body.slug.trim()
      ? makeSlug(body.slug)
      : makeSlug(name);

  if (!requestedSlug) {
    return c.json(
      { success: false, error: "A valid store name or slug is required." },
      400,
    );
  }

  const existing = getStoreBySlug(requestedSlug);

  if (existing) {
    return c.json(
      {
        success: false,
        error: "That store URL is already in use. Choose another name.",
      },
      409,
    );
  }

  const timestamp = now();
  const store: StoreRow = {
    id: createId(),
    name,
    slug: requestedSlug,
    niche,
    status: "Draft",
    description,
    logo_url: logoUrl,
    created_at: timestamp,
    updated_at: timestamp,
  };

  try {
    db.prepare(`
      INSERT INTO stores (
        id,
        name,
        slug,
        niche,
        status,
        description,
        logo_url,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      store.id,
      store.name,
      store.slug,
      store.niche,
      store.status,
      store.description,
      store.logo_url,
      store.created_at,
      store.updated_at,
    );

    return c.json(
      {
        success: true,
        data: getStoreResponse(store),
      },
      201,
    );
  } catch (error) {
    console.error("Failed to create store:", error);

    return c.json(
      { success: false, error: "Unable to create the store." },
      500,
    );
  }
});

/**
 * ADMIN: UPDATE STORE
 * PATCH /api/store/:id
 */
stores.patch("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const current = getStore(id);

  if (!current) {
    return c.json(
      { success: false, error: "Store not found." },
      404,
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await c.req.json<Record<string, unknown>>();
  } catch {
    return c.json(
      { success: false, error: "A valid JSON request body is required." },
      400,
    );
  }

  const name =
    typeof body.name === "string" ? body.name.trim() : current.name;
  const niche =
    typeof body.niche === "string" ? body.niche.trim() : current.niche;
  const description =
    typeof body.description === "string"
      ? body.description.trim() || null
      : current.description;
  const logoUrl =
    typeof body.logo_url === "string"
      ? body.logo_url.trim() || null
      : current.logo_url;

  const requestedSlug =
    typeof body.slug === "string" && body.slug.trim()
      ? makeSlug(body.slug)
      : current.slug;

  const status =
    body.status === undefined
      ? current.status
      : parseStoreStatus(body.status);

  if (!name) {
    return c.json(
      { success: false, error: "Store name cannot be empty." },
      400,
    );
  }

  if (!requestedSlug) {
    return c.json(
      { success: false, error: "A valid store URL slug is required." },
      400,
    );
  }

  if (!status) {
    return c.json(
      { success: false, error: "Store status must be Active or Draft." },
      400,
    );
  }

  const slugOwner = getStoreBySlug(requestedSlug);

  if (slugOwner && slugOwner.id !== id) {
    return c.json(
      {
        success: false,
        error: "That store URL is already in use. Choose another slug.",
      },
      409,
    );
  }

  const updatedAt = now();

  try {
    db.prepare(`
      UPDATE stores
      SET
        name = ?,
        slug = ?,
        niche = ?,
        status = ?,
        description = ?,
        logo_url = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      name,
      requestedSlug,
      niche || "Other",
      status,
      description,
      logoUrl,
      updatedAt,
      id,
    );

    const updated = getStore(id);

    if (!updated) {
      return c.json(
        { success: false, error: "Unable to load the updated store." },
        500,
      );
    }

    return c.json({
      success: true,
      data: getStoreResponse(updated),
    });
  } catch (error) {
    console.error("Failed to update store:", error);

    return c.json(
      { success: false, error: "Unable to update the store." },
      500,
    );
  }
});

/**
 * ADMIN: DELETE AN EMPTY STORE
 * DELETE /api/store/:id
 *
 * A store containing products cannot be deleted.
 */
stores.delete("/:id", authMiddleware, (c) => {
  const id = c.req.param("id");
  const store = getStore(id);

  if (!store) {
    return c.json(
      { success: false, error: "Store not found." },
      404,
    );
  }

  const productCount = db
    .prepare("SELECT COUNT(*) AS count FROM products WHERE store_id = ?")
    .get(id) as { count: number };

  if (productCount.count > 0) {
    return c.json(
      {
        success: false,
        error: "This store still has products. Remove or reassign them before deleting the store.",
      },
      409,
    );
  }

  db.prepare("DELETE FROM stores WHERE id = ?").run(id);

  return c.json({
    success: true,
    message: "Store deleted successfully.",
  });
});

/**
 * PUBLIC: GET AN ACTIVE STORE
 * GET /api/store/public/:slug
 *
 * This route is public; customers do not need an admin token.
 */
stores.get("/public/:slug", (c) => {
  const slug = c.req.param("slug");
  const store = getStoreBySlug(slug);

  if (!store || store.status !== "Active") {
    return c.json(
      { success: false, error: "Store not found." },
      404,
    );
  }

  return c.json({
    success: true,
    data: {
      id: store.id,
      name: store.name,
      slug: store.slug,
      niche: store.niche,
      description: store.description,
      logo_url: store.logo_url,
    },
  });
});

/**
 * PUBLIC: GET ACTIVE PRODUCTS BELONGING TO ONE STORE
 * GET /api/store/public/:slug/products
 *
 * Only products assigned to this exact store are returned.
 * Global products and products belonging to other stores are excluded.
 */
stores.get("/public/:slug/products", (c) => {
  const slug = c.req.param("slug");
  const store = getStoreBySlug(slug);

  if (!store || store.status !== "Active") {
    return c.json(
      { success: false, error: "Store not found." },
      404,
    );
  }

  const rows = db.prepare(`
    SELECT *
    FROM products
    WHERE store_id = ? AND active = 1
    ORDER BY created_at DESC
  `).all(store.id) as ProductRow[];

  const products = rows.map((row) => ({
    ...row,
    price: Number(row.price ?? 0),
    stock: Number(row.stock ?? 0),
    inventory: Number(row.stock ?? 0),
    active: Number(row.active ?? 0),
    images: parseJson(row.images, []),
    variants: parseJson(row.variants, []),
  }));

  return c.json({
    success: true,
    data: products,
  });
});

export default stores;