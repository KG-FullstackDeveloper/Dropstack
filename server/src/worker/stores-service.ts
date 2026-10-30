import { Hono } from "hono";
import type {
  WorkerEnvironment,
  ProductRecord,
  StoreRecord,
} from "./types";
import { workerAuthMiddleware } from "./auth";
import { parseJson } from "./db";

const storesService = new Hono<WorkerEnvironment>();

function publicProduct(product: ProductRecord) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price_override ?? product.price,
    currency: product.currency,
    sku: product.sku,
    category: product.category,
    image: product.image,
    images: parseJson(product.images, []),
    variants: parseJson(product.variants, []),
    stock: product.stock,
    active: Boolean(product.active),
    store_id: product.store_id,
    created_at: product.created_at,
    updated_at: product.updated_at,
  };
}

// GET /api/stores/public/:slug
storesService.get("/public/:slug", async (c) => {
  try {
    const store = await c.env.DB
      .prepare(
        `SELECT s.*
         FROM stores s
         LEFT JOIN store_registry_metadata m ON m.store_id = s.id
         WHERE s.slug = ?
           AND LOWER(s.status) = 'active'
           AND COALESCE(m.archived, 0) = 0
         LIMIT 1`,
      )
      .bind(c.req.param("slug"))
      .first<StoreRecord>();

    if (!store) {
      return c.json(
        { success: false, error: "Store not found or unavailable." },
        404,
      );
    }

    return c.json({ success: true, data: store });
  } catch (error) {
    console.error("Worker public store lookup failed:", error);

    return c.json(
      { success: false, error: "Unable to load this store." },
      500,
    );
  }
});

// GET /api/stores/public/:slug/products
storesService.get("/public/:slug/products", async (c) => {
  try {
    const store = await c.env.DB
      .prepare(
        `SELECT s.id
         FROM stores s
         LEFT JOIN store_registry_metadata m ON m.store_id = s.id
         WHERE s.slug = ?
           AND LOWER(s.status) = 'active'
           AND COALESCE(m.archived, 0) = 0
         LIMIT 1`,
      )
      .bind(c.req.param("slug"))
      .first<{ id: string }>();

    if (!store) {
      return c.json(
        { success: false, error: "Store not found or unavailable." },
        404,
      );
    }

    const result = await c.env.DB
      .prepare(
        `SELECT p.*, sp.price_override
         FROM store_products sp
         INNER JOIN products p ON p.id = sp.product_id
         WHERE sp.store_id = ?
           AND p.active = 1
           AND (p.store_id IS NULL OR p.store_id = ?)
         ORDER BY p.created_at DESC`,
      )
      .bind(store.id, store.id)
      .all<ProductRecord>();

    if (!result.success) {
      throw new Error(result.error || "Store product query failed.");
    }

    return c.json({
      success: true,
      data: (result.results ?? []).map(publicProduct),
    });
  } catch (error) {
    console.error("Worker store products failed:", error);

    return c.json(
      { success: false, error: "Unable to load store products." },
      500,
    );
  }
});

// GET /api/stores — admin store list.
storesService.get("/", workerAuthMiddleware, async (c) => {
  try {
    const result = await c.env.DB
      .prepare(
        `SELECT s.*
         FROM stores s
         LEFT JOIN store_registry_metadata m ON m.store_id = s.id
         WHERE COALESCE(m.archived, 0) = 0
         ORDER BY s.created_at DESC`,
      )
      .all<StoreRecord>();

    if (!result.success) {
      throw new Error(result.error || "Store query failed.");
    }

    return c.json({
      success: true,
      data: result.results ?? [],
    });
  } catch (error) {
    console.error("Worker admin store list failed:", error);

    return c.json(
      { success: false, error: "Unable to load stores." },
      500,
    );
  }
});

export default storesService;