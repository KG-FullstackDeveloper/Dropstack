import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../database/db";
import { authMiddleware } from "../middleware/auth";

const stores = new Hono();

type StoreRow = {
  id: string;
  name: string;
  slug: string;
  niche: string;
  domain: string | null;
  status: string;
  shipping_fee: number | null;
  delivery_estimate: string | null;
  created_at: string;
  updated_at: string;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  currency: string | null;
  image_url: string | null;
  images: string[];
  video_url: string | null;
  variants: unknown[];
  processing_time: string | null;
  delivery_time: string | null;
  price_override: number | null;
  stock: number | null;
  active: number;
};

type StoreStatus = "active" | "draft" | "archived";

const clean = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const getStore = (id: string): StoreRow | undefined =>
  db
    .prepare(
      `
        SELECT id, name, slug, niche, domain, status, shipping_fee,
          delivery_estimate, created_at, updated_at
    FROM stores
    WHERE id = ?
  `,
    )
    .get(id) as StoreRow | undefined;

/*
 * Archive metadata is stored separately because some existing databases
 * restrict stores.status to Active/Draft.
 *
 * This migration preserves existing stores and product assignments.
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS store_registry_metadata (
    store_id TEXT PRIMARY KEY,
    archived INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );
`);

function isArchived(storeId: string): boolean {
  const row = db
    .prepare(
      `
    SELECT archived
    FROM store_registry_metadata
    WHERE store_id = ?
  `,
    )
    .get(storeId) as { archived: number } | undefined;

  return row?.archived === 1;
}

function setArchived(storeId: string, archived: boolean, now: string): void {
  db.prepare(
    `
    INSERT INTO store_registry_metadata (store_id, archived, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(store_id) DO UPDATE SET
      archived = excluded.archived,
      updated_at = excluded.updated_at
  `,
  ).run(storeId, archived ? 1 : 0, now);
}

function getStoreStatus(row: StoreRow): StoreStatus {
  if (isArchived(row.id)) return "archived";

  return row.status.toLowerCase() === "active" ? "active" : "draft";
}

function isPubliclyAvailable(row: StoreRow): boolean {
  return getStoreStatus(row) === "active";
}

function serializeStore(row: StoreRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    niche: row.niche,
    domain: row.domain || `${row.slug}.localhost`,
    status: getStoreStatus(row),
    shippingFee: row.shipping_fee,
    deliveryEstimate: row.delivery_estimate,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseProductIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  if (!value.every((id) => typeof id === "string" && id.trim().length > 0)) {
    return null;
  }

  return [...new Set(value.map((id) => id.trim()))];
}

/*
 * Return only products assigned to this store.
 * Inactive products are not displayed in the public storefront.
 * Assignments themselves remain saved so products can be reactivated.
 */
function getAssignedProducts(storeId: string): ProductRow[] {
  const rows = db
    .prepare(
      `
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.category,
      p.price AS base_price,
      COALESCE(sp.price_override, p.price) AS price,
      sp.price_override,
      p.currency,
      p.image_url,
      p.images,
      p.video_url,
      p.variants,
      p.processing_time,
      p.delivery_time,
      p.stock,
      p.active
    FROM products p
    INNER JOIN store_products sp
      ON sp.product_id = p.id
    WHERE sp.store_id = ?
      AND p.active = 1
    ORDER BY p.created_at DESC
  `,
    )
    .all(storeId) as Array<
    Omit<ProductRow, "images" | "variants"> & {
      images: string | null;
      variants: string | null;
    }
  >;

  return rows.map((product) => ({
    ...product,
    images: parseJsonArray(product.images) as string[],
    variants: parseJsonArray(product.variants),
  }));
}

function parseJsonArray(value: string | null): unknown[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getAssignedProductIds(storeId: string): string[] {
  const rows = db
    .prepare(
      `
    SELECT product_id
    FROM store_products
    WHERE store_id = ?
    ORDER BY created_at ASC
  `,
    )
    .all(storeId) as Array<{ product_id: string }>;

  return rows.map((row) => row.product_id);
}

function parsePriceOverrides(
  value: unknown,
): Record<string, number | null> | null {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const overrides: Record<string, number | null> = {};

  for (const [productId, rawPrice] of Object.entries(value)) {
    if (!productId.trim()) return null;
    if (rawPrice === null || rawPrice === "") {
      overrides[productId] = null;
      continue;
    }

    const price = Number(rawPrice);
    if (!Number.isFinite(price) || price <= 0) return null;
    overrides[productId] = Math.round(price * 100) / 100;
  }

  return overrides;
}

function getAssignedPriceOverrides(
  storeId: string,
): Record<string, number | null> {
  const rows = db
    .prepare(
      `SELECT product_id, price_override
       FROM store_products
       WHERE store_id = ?`,
    )
    .all(storeId) as Array<{
    product_id: string;
    price_override: number | null;
  }>;

  return Object.fromEntries(
    rows.map((row) => [row.product_id, row.price_override]),
  );
}

/*
 * Validate every product before changing assignments.
 * The caller wraps this function in a transaction.
 */
function saveProducts(
  storeId: string,
  productIds: string[],
  now: string,
  priceOverrides: Record<string, number | null> = {},
): void {
  const findProduct = db.prepare(`
    SELECT id
    FROM products
    WHERE id = ?
  `);

  for (const productId of productIds) {
    if (!findProduct.get(productId)) {
      throw new Error(`Product not found: ${productId}`);
    }
  }

  db.prepare(
    `
    DELETE FROM store_products
    WHERE store_id = ?
  `,
  ).run(storeId);

  const insert = db.prepare(`
    INSERT INTO store_products (store_id, product_id, price_override, created_at)
    VALUES (?, ?, ?, ?)
  `);

  for (const productId of productIds) {
    insert.run(storeId, productId, priceOverrides[productId] ?? null, now);
  }
}

function parseStatus(value: unknown): StoreStatus | null {
  if (typeof value !== "string") return null;

  switch (value.trim().toLowerCase()) {
    case "active":
      return "active";
    case "draft":
      return "draft";
    case "archived":
      return "archived";
    default:
      return null;
  }
}

function updateStoreConfig(
  id: string,
  name: string,
  description: string | undefined,
  now: string,
): void {
  const config = db
    .prepare(
      `
    SELECT id
    FROM store_config
    WHERE id = ?
  `,
    )
    .get(id);

  // Do not modify the default store's configuration when editing another store.
  if (!config) return;

  const configColumns = new Set(
    (
      db.prepare("PRAGMA table_info(store_config)").all() as Array<{
        name: string;
      }>
    ).map((column) => column.name),
  );

  if (!configColumns.has("name")) return;

  if (description !== undefined && configColumns.has("description")) {
    db.prepare(
      `
      UPDATE store_config
      SET name = ?, description = ?, updated_at = ?
      WHERE id = ?
    `,
    ).run(name, description, now, id);
  } else {
    db.prepare(
      `
      UPDATE store_config
      SET name = ?, updated_at = ?
      WHERE id = ?
    `,
    ).run(name, now, id);
  }
}

/*
 * PUBLIC STOREFRONT ROUTES
 *
 * These must stay before stores.use("*", authMiddleware).
 * Store.ts calls these endpoints without admin authentication.
 */

// GET /api/stores/public/:slug
stores.get("/public/:slug", (c) => {
  try {
    const row = db
      .prepare(
        `
            SELECT id, name, slug, niche, domain, status, shipping_fee,
              delivery_estimate, created_at, updated_at
      FROM stores
      WHERE slug = ? COLLATE NOCASE
      LIMIT 1
    `,
      )
      .get(c.req.param("slug")) as StoreRow | undefined;

    if (!row || !isPubliclyAvailable(row)) {
      return c.json(
        {
          success: false,
          error: "Store not found.",
        },
        404,
      );
    }

    const config = db
      .prepare(
        `
      SELECT name, description, logo_url
      FROM store_config
      WHERE id = ?
    `,
      )
      .get(row.id) as
      | {
          name: string | null;
          description: string | null;
          logo_url: string | null;
        }
      | undefined;

    return c.json({
      success: true,
      data: {
        ...serializeStore(row),
        name: config?.name || row.name,
        description: config?.description || "",
        logo_url: config?.logo_url || null,
      },
    });
  } catch (error) {
    console.error("Public store lookup failed:", error);

    return c.json(
      {
        success: false,
        error: "Unable to load store.",
      },
      500,
    );
  }
});

// GET /api/stores/public/:slug/products
stores.get("/public/:slug/products", (c) => {
  try {
    const row = db
      .prepare(
        `
            SELECT id, name, slug, niche, domain, status, shipping_fee,
              delivery_estimate, created_at, updated_at
      FROM stores
      WHERE slug = ? COLLATE NOCASE
      LIMIT 1
    `,
      )
      .get(c.req.param("slug")) as StoreRow | undefined;

    if (!row || !isPubliclyAvailable(row)) {
      return c.json(
        {
          success: false,
          error: "Store not found.",
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: getAssignedProducts(row.id),
    });
  } catch (error) {
    console.error("Public store products failed:", error);

    return c.json(
      {
        success: false,
        error: "Unable to load store products.",
      },
      500,
    );
  }
});

/*
 * PROTECTED ADMIN ROUTES
 */

stores.use("*", authMiddleware);

// GET /api/stores
stores.get("/", (c) => {
  try {
    const rows = db
      .prepare(
        `
            SELECT id, name, slug, niche, domain, status, shipping_fee,
              delivery_estimate, created_at, updated_at
      FROM stores
      ORDER BY datetime(created_at) DESC
    `,
      )
      .all() as StoreRow[];

    return c.json({
      success: true,
      data: rows.filter((row) => !isArchived(row.id)).map(serializeStore),
    });
  } catch (error) {
    console.error("List stores failed:", error);

    return c.json(
      {
        success: false,
        error: "Unable to load stores.",
      },
      500,
    );
  }
});

// POST /api/stores
// Retained for API compatibility; the Stores page no longer creates stores.
stores.post("/", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const name = clean(body.name);
    const niche = clean(body.niche) || "General";
    const slug = slugify(clean(body.slug) || name);
    const productIds =
      body.productIds === undefined ? [] : parseProductIds(body.productIds);
    const priceOverrides = parsePriceOverrides(body.priceOverrides);

    if (!name || !slug) {
      return c.json(
        {
          success: false,
          error: "A valid store name is required.",
        },
        400,
      );
    }

    if (productIds === null || priceOverrides === null) {
      return c.json(
        {
          success: false,
          error: "Product assignments or price overrides are invalid.",
        },
        400,
      );
    }

    if (
      db
        .prepare(
          `
      SELECT id FROM stores WHERE slug = ? COLLATE NOCASE
    `,
        )
        .get(slug)
    ) {
      return c.json(
        {
          success: false,
          error: "That store slug already exists.",
        },
        409,
      );
    }

    const id = `store_${randomUUID()}`;
    const now = new Date().toISOString();
    const inputDomain = clean(body.domain)
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");
    const domain = inputDomain || `${slug}.localhost`;

    if (
      db
        .prepare(
          `
      SELECT id FROM stores
      WHERE domain = ? COLLATE NOCASE
        AND domain IS NOT NULL
        AND domain != ''
    `,
        )
        .get(domain)
    ) {
      return c.json(
        {
          success: false,
          error: "That domain is already assigned to another store.",
        },
        409,
      );
    }

    db.transaction(() => {
      db.prepare(
        `
        INSERT INTO stores
          (id, name, slug, niche, domain, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'Draft', ?, ?)
      `,
      ).run(id, name, slug, niche, domain, now, now);

      db.prepare(
        `
        INSERT OR IGNORE INTO store_config
          (id, name, description, theme_id, navigation, settings,
           primary_color, accent_color, font_family, updated_at)
        VALUES (?, ?, ?, 'meo-default', '[]', '{}',
                '#0f172a', '#3b82f6', 'Inter', ?)
      `,
      ).run(id, name, `${name} storefront`, now);

      saveProducts(id, productIds, now, priceOverrides);
      setArchived(id, false, now);
    })();

    const created = getStore(id);

    if (!created) {
      throw new Error("Store was created but could not be loaded.");
    }

    return c.json(
      {
        success: true,
        data: {
          ...serializeStore(created),
          productIds,
        },
      },
      201,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create store.";

    const status = /Product not found/.test(message)
      ? 400
      : /UNIQUE|already exists/i.test(message)
        ? 409
        : 500;

    console.error("Create store failed:", error);

    return c.json(
      {
        success: false,
        error: message,
      },
      status,
    );
  }
});

// GET /api/stores/:id/products
stores.get("/:id/products", (c) => {
  try {
    const id = c.req.param("id");
    const row = getStore(id);

    if (!row || isArchived(id)) {
      return c.json(
        {
          success: false,
          error: "Store not found.",
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: getAssignedProducts(id),
      productIds: getAssignedProductIds(id),
      priceOverrides: getAssignedPriceOverrides(id),
    });
  } catch (error) {
    console.error("Load assigned products failed:", error);

    return c.json(
      {
        success: false,
        error: "Unable to load assigned products.",
      },
      500,
    );
  }
});

// PUT /api/stores/:id/products
stores.put("/:id/products", async (c) => {
  try {
    const id = c.req.param("id");

    if (!getStore(id) || isArchived(id)) {
      return c.json(
        {
          success: false,
          error: "Store not found.",
        },
        404,
      );
    }

    const body = (await c.req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const productIds = parseProductIds(body.productIds);
    const priceOverrides = parsePriceOverrides(body.priceOverrides);

    if (productIds === null || priceOverrides === null) {
      return c.json(
        {
          success: false,
          error: "Product assignments or price overrides are invalid.",
        },
        400,
      );
    }

    const now = new Date().toISOString();

    db.transaction(() => {
      saveProducts(id, productIds, now, priceOverrides);
    })();

    return c.json({
      success: true,
      data: {
        storeId: id,
        productIds,
        priceOverrides: getAssignedPriceOverrides(id),
      },
      message: `${productIds.length} product(s) assigned successfully.`,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save product assignments.";

    console.error("Save product assignments failed:", error);

    return c.json(
      {
        success: false,
        error: message,
      },
      /Product not found/.test(message) ? 400 : 500,
    );
  }
});

// GET /api/stores/:id
stores.get("/:id", (c) => {
  try {
    const row = getStore(c.req.param("id"));

    if (!row || isArchived(row.id)) {
      return c.json(
        {
          success: false,
          error: "Store not found.",
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: {
        ...serializeStore(row),
        productIds: getAssignedProductIds(row.id),
      },
    });
  } catch (error) {
    console.error("Get store failed:", error);

    return c.json(
      {
        success: false,
        error: "Unable to load store.",
      },
      500,
    );
  }
});

// PATCH /api/stores/:id
stores.patch("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const current = getStore(id);

    if (!current || isArchived(id)) {
      return c.json(
        {
          success: false,
          error: "Store not found.",
        },
        404,
      );
    }

    const body = (await c.req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const name = body.name === undefined ? current.name : clean(body.name);

    const niche =
      body.niche === undefined ? current.niche : clean(body.niche) || "General";

    const slug =
      body.slug === undefined
        ? current.slug
        : slugify(clean(body.slug) || name);

    const rawDomain =
      body.domain === undefined ? current.domain || "" : clean(body.domain);

    const domain =
      rawDomain.replace(/^https?:\/\//i, "").replace(/\/+$/, "") ||
      `${slug}.localhost`;

    const status =
      body.status === undefined
        ? getStoreStatus(current)
        : parseStatus(body.status);

    const shippingFee =
      body.shippingFee === undefined
        ? current.shipping_fee
        : body.shippingFee === null || body.shippingFee === ""
          ? null
          : Number(body.shippingFee);
    const deliveryEstimate =
      body.deliveryEstimate === undefined
        ? current.delivery_estimate
        : clean(body.deliveryEstimate) || null;

    const description =
      body.description === undefined ? undefined : clean(body.description);

    const productIds =
      body.productIds === undefined
        ? undefined
        : parseProductIds(body.productIds);
    const priceOverrides =
      body.priceOverrides === undefined
        ? undefined
        : parsePriceOverrides(body.priceOverrides);

    if (!name || !slug) {
      return c.json(
        {
          success: false,
          error: "A valid store name and slug are required.",
        },
        400,
      );
    }

    if (!status) {
      return c.json(
        {
          success: false,
          error: "Status must be Active, Draft, or Archived.",
        },
        400,
      );
    }

    if (
      shippingFee !== null &&
      (!Number.isFinite(shippingFee) ||
        shippingFee < 0 ||
        shippingFee > 1000000)
    ) {
      return c.json(
        { success: false, error: "Enter a valid store shipping fee." },
        400,
      );
    }

    if (deliveryEstimate && deliveryEstimate.length > 120) {
      return c.json(
        {
          success: false,
          error: "Delivery estimate must be 120 characters or fewer.",
        },
        400,
      );
    }

    if (productIds === null || priceOverrides === null) {
      return c.json(
        {
          success: false,
          error: "Product assignments or price overrides are invalid.",
        },
        400,
      );
    }

    if (id === "default" && status === "archived") {
      return c.json(
        {
          success: false,
          error: "The default store cannot be archived.",
        },
        400,
      );
    }

    const duplicateSlug = db
      .prepare(
        `
      SELECT id FROM stores
      WHERE slug = ? COLLATE NOCASE AND id != ?
    `,
      )
      .get(slug, id);

    if (duplicateSlug) {
      return c.json(
        {
          success: false,
          error: "That store slug is already in use.",
        },
        409,
      );
    }

    const duplicateDomain = db
      .prepare(
        `
      SELECT id FROM stores
      WHERE domain = ? COLLATE NOCASE
        AND id != ?
        AND domain IS NOT NULL
        AND domain != ''
    `,
      )
      .get(domain, id);

    if (duplicateDomain) {
      return c.json(
        {
          success: false,
          error: "That domain is already assigned to another store.",
        },
        409,
      );
    }

    const now = new Date().toISOString();

    db.transaction(() => {
      /*
       * Store archived state in metadata. The stores.status column remains
       * Draft for archived stores to preserve older database constraints.
       */
      const databaseStatus =
        status === "archived"
          ? "Draft"
          : status === "active"
            ? "Active"
            : "Draft";

      db.prepare(
        `
        UPDATE stores
        SET name = ?, slug = ?, niche = ?, domain = ?,
            status = ?, shipping_fee = ?, delivery_estimate = ?, updated_at = ?
        WHERE id = ?
      `,
      ).run(
        name,
        slug,
        niche,
        domain,
        databaseStatus,
        shippingFee,
        deliveryEstimate,
        now,
        id,
      );

      setArchived(id, status === "archived", now);

      updateStoreConfig(id, name, description, now);

      if (productIds !== undefined) {
        saveProducts(
          id,
          productIds,
          now,
          priceOverrides ?? getAssignedPriceOverrides(id),
        );
      } else if (priceOverrides !== undefined) {
        saveProducts(id, getAssignedProductIds(id), now, priceOverrides);
      }
    })();

    const updated = getStore(id);

    if (!updated) {
      throw new Error("Store was updated but could not be loaded.");
    }

    return c.json({
      success: true,
      data: {
        ...serializeStore(updated),
        productIds: getAssignedProductIds(id),
        priceOverrides: getAssignedPriceOverrides(id),
      },
      message: "Store updated successfully.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update store.";

    console.error("Update store failed:", error);

    const status = /Product not found/.test(message)
      ? 400
      : /UNIQUE|already exists/i.test(message)
        ? 409
        : 500;

    return c.json(
      {
        success: false,
        error: message,
      },
      status,
    );
  }
});

// DELETE /api/stores/:id
// This is a soft archive; the store and its product assignments are preserved.
stores.delete("/:id", (c) => {
  try {
    const id = c.req.param("id");
    const row = getStore(id);

    if (!row) {
      return c.json(
        {
          success: false,
          error: "Store not found.",
        },
        404,
      );
    }

    if (id === "default") {
      return c.json(
        {
          success: false,
          error: "The default store cannot be archived.",
        },
        400,
      );
    }

    const now = new Date().toISOString();

    db.transaction(() => {
      db.prepare(
        `
        UPDATE stores
        SET status = 'Draft', updated_at = ?
        WHERE id = ?
      `,
      ).run(now, id);

      setArchived(id, true, now);
    })();

    return c.json({
      success: true,
      message: "Store archived successfully.",
    });
  } catch (error) {
    console.error("Archive store failed:", error);

    return c.json(
      {
        success: false,
        error: "Unable to archive store.",
      },
      500,
    );
  }
});

export default stores;
