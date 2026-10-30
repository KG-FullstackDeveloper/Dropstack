import { Hono } from "hono";
import type { WorkerEnv } from "../types";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number | string;
  currency: string | null;
  image_url: string | null;
  images: string | string[] | null;
  video_url: string | null;
  processing_time: string | null;
  delivery_time: string | null;
  stock: number | string | null;
  variants: string | unknown[] | null;
  active: number | string;
  store_id?: string | null;
};

const products = new Hono<{ Bindings: WorkerEnv }>();

function parseArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializePublicProduct(row: ProductRow) {
  const variants = parseArray(row.variants) as Array<Record<string, unknown>>;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    price: Number(row.price ?? 0),
    currency: row.currency || "USD",
    image_url: row.image_url,
    images: parseArray(row.images).filter(Boolean),
    video_url: row.video_url,
    processing_time: row.processing_time,
    delivery_time: row.delivery_time,
    stock: Number(row.stock ?? 0),
    variants: variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      value: variant.value,
      price: variant.price,
      stock: variant.stock,
    })),
    active: Number(row.active) === 1 ? 1 : 0,
  };
}

async function findPublicGlobalProduct(
  db: WorkerEnv["DB"],
  whereSql: string,
  value: string,
): Promise<ProductRow | null> {
  return db
    .prepare(
      `SELECT p.*
       FROM products p
       WHERE p.active = 1
         AND p.store_id IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM store_products sp WHERE sp.product_id = p.id
         )
         AND ${whereSql}
       LIMIT 1`,
    )
    .bind(value)
    .first<ProductRow>();
}

// Public Global catalogue only. Store-assigned products remain on their own
// storefront routes and are deliberately excluded from this endpoint.
products.get("/", async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT p.*
     FROM products p
     WHERE p.active = 1
       AND p.store_id IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM store_products sp WHERE sp.product_id = p.id
       )
     ORDER BY p.created_at DESC`,
  ).all<ProductRow>();

  return c.json({
    success: true,
    data: (result.results ?? []).map(serializePublicProduct),
  });
});

products.get("/id/:id", async (c) => {
  const row = await findPublicGlobalProduct(
    c.env.DB,
    "p.id = ?",
    c.req.param("id"),
  );
  if (!row) return c.json({ success: false, error: "Product not found." }, 404);
  return c.json({ success: true, data: serializePublicProduct(row) });
});

products.get("/slug/:slug", async (c) => {
  const row = await findPublicGlobalProduct(
    c.env.DB,
    "p.slug = ?",
    c.req.param("slug"),
  );
  if (!row) return c.json({ success: false, error: "Product not found." }, 404);
  return c.json({ success: true, data: serializePublicProduct(row) });
});

products.get("/:id", async (c) => {
  const row = await findPublicGlobalProduct(
    c.env.DB,
    "p.id = ?",
    c.req.param("id"),
  );
  if (!row) return c.json({ success: false, error: "Product not found." }, 404);
  return c.json({ success: true, data: serializePublicProduct(row) });
});

export default products;
