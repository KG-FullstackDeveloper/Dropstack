import { Hono } from "hono";
import type { WorkerEnvironment, ProductRecord } from "./types";
import { workerAuthMiddleware } from "./auth";
import { parseJson } from "./db";

const productsService = new Hono<WorkerEnvironment>();

function publicProduct(product: ProductRecord) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
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

const globalProductsQuery = `
  SELECT p.*
  FROM products p
  WHERE p.active = 1
    AND p.store_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM store_products sp
      WHERE sp.product_id = p.id
    )
`;

// GET /api/products — public global catalogue.
productsService.get("/", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `${globalProductsQuery}
         ORDER BY p.created_at DESC`,
    ).all<ProductRecord>();

    if (!result.success) {
      throw new Error(result.error || "Product query failed.");
    }

    const rows = (result.results ?? []) as ProductRecord[];

    return c.json({
      success: true,
      data: rows.map(publicProduct),
    });
  } catch (error) {
    console.error("Worker product list failed:", error);

    return c.json({ success: false, error: "Unable to load products." }, 500);
  }
});

// GET /api/products/slug/:slug
productsService.get("/slug/:slug", async (c) => {
  try {
    const product = await c.env.DB.prepare(
      `${globalProductsQuery}
         AND p.slug = ?
         LIMIT 1`,
    )
      .bind(c.req.param("slug"))
      .first<ProductRecord>();

    if (!product) {
      return c.json({ success: false, error: "Product not found." }, 404);
    }

    return c.json({ success: true, data: publicProduct(product) });
  } catch (error) {
    console.error("Worker product lookup failed:", error);

    return c.json(
      { success: false, error: "Unable to load this product." },
      500,
    );
  }
});

// GET /api/products/admin/all — admin catalogue.
productsService.get("/admin/all", workerAuthMiddleware, async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT * FROM products ORDER BY created_at DESC",
    ).all<ProductRecord>();

    if (!result.success) {
      throw new Error(result.error || "Admin product query failed.");
    }

    const rows = (result.results ?? []) as ProductRecord[];

    return c.json({
      success: true,
      data: rows.map((product) => ({
        ...publicProduct(product),
        supplier_cost: product.supplier_cost ?? 0,
        shipping_cost: product.shipping_cost ?? 0,
        other_cost: product.other_cost ?? 0,
      })),
    });
  } catch (error) {
    console.error("Worker admin product list failed:", error);

    return c.json(
      { success: false, error: "Unable to load admin products." },
      500,
    );
  }
});

// GET /api/products/:id — public global product details.
productsService.get("/:id", async (c) => {
  try {
    const product = await c.env.DB.prepare(
      `${globalProductsQuery}
         AND p.id = ?
         LIMIT 1`,
    )
      .bind(c.req.param("id"))
      .first<ProductRecord>();

    if (!product) {
      return c.json({ success: false, error: "Product not found." }, 404);
    }

    return c.json({ success: true, data: publicProduct(product) });
  } catch (error) {
    console.error("Worker product lookup failed:", error);

    return c.json(
      { success: false, error: "Unable to load this product." },
      500,
    );
  }
});

export default productsService;
