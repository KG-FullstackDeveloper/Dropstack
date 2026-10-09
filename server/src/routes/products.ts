
import { Hono } from "hono";
import {
  deleteProductRecord,
  getActiveProducts,
  getAllProducts,
  getGlobalProducts,
  getProductById,
  getProductBySlug,
  insertProduct,
  updateProductRecord,
  type ProductWithStore,
} from "../data/store";
import { db } from "../database/db";
import { createId } from "../utils/id";
import type { Product, ProductVariant } from "../types/product";
import { authMiddleware } from "../middleware/auth";

const products = new Hono();

/* -------------------------------------------------------------------------- */
/* PUBLIC GLOBAL PRODUCT ROUTES                                               */
/* -------------------------------------------------------------------------- */

products.get("/", async (c) => {
  try {
    // Only products without a store assignment belong to the Global catalogue.
    const items = (await getGlobalProducts()).filter(
      (product) => Number(product.active) === 1,
    );

    return c.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Get active global products error:", error);

    return c.json(
      { success: false, error: "Unable to load products." },
      500,
    );
  }
});

products.get("/all", authMiddleware, async (c) => {
  try {
    // Keep the Global admin product list separate from individual storefronts.
    const items = await getGlobalProducts();

    return c.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Get all global products error:", error);

    return c.json(
      { success: false, error: "Unable to load products." },
      500,
    );
  }
});

/* -------------------------------------------------------------------------- */
/* PRODUCT LOOKUPS                                                            */
/* -------------------------------------------------------------------------- */

products.get("/id/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const product = await getProductById(id);

    // Store products must be accessed through their own storefront.
    if (!product || product.store_id) {
      return c.json(
        { success: false, error: "Product not found." },
        404,
      );
    }

    return c.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    return c.json(
      { success: false, error: "Unable to load product." },
      500,
    );
  }
});

products.get("/slug/:slug", async (c) => {
  const slug = c.req.param("slug");

  try {
    const product = await getProductBySlug(slug);

    if (!product || product.store_id) {
      return c.json(
        { success: false, error: "Product not found." },
        404,
      );
    }

    return c.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product by slug error:", error);

    return c.json(
      { success: false, error: "Unable to load product." },
      500,
    );
  }
});

/* -------------------------------------------------------------------------- */
/* NORMALIZATION HELPERS                                                      */
/* -------------------------------------------------------------------------- */

function cleanString(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function nullableString(value: unknown): string | null {
  const result = cleanString(value);
  return result.length > 0 ? result : null;
}

function numberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const text = cleanString(value);

  if (!text) {
    return fallback;
  }

  const cleaned = text.replace(/,/g, "").replace(/[^\d.-]/g, "");
  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function integerValue(value: unknown, fallback = 0): number {
  return Math.max(0, Math.round(numberValue(value, fallback)));
}

function booleanValue(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  const text = cleanString(value).toLowerCase();

  if (!text) {
    return fallback;
  }

  if (
    [
      "false",
      "0",
      "no",
      "off",
      "inactive",
      "disabled",
      "draft",
      "archived",
    ].includes(text)
  ) {
    return false;
  }

  if (
    [
      "true",
      "1",
      "yes",
      "on",
      "active",
      "enabled",
      "published",
    ].includes(text)
  ) {
    return true;
  }

  return fallback;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

async function createUniqueSlug(
  name: string,
  requestedSlug?: string | null,
  ignoreId?: string,
): Promise<string> {
  const base =
    slugify(requestedSlug || name) || `product-${Date.now()}`;

  let slug = base;
  let counter = 2;

  while (true) {
    const existing = await getProductBySlug(slug);

    if (!existing || existing.id === ignoreId) {
      // Also check inactive products and store products, since slugs
      // must remain unique across the shared products table.
      const anyExisting = db
        .prepare("SELECT id FROM products WHERE slug = ? LIMIT 1")
        .get(slug) as { id: string } | undefined;

      if (!anyExisting || anyExisting.id === ignoreId) {
        return slug;
      }
    }

    slug = `${base}-${counter}`;
    counter += 1;
  }
}

function calculateFinancials(
  price: number,
  supplierCost: number,
  shippingCost: number,
  otherCost: number,
) {
  const totalCost = supplierCost + shippingCost + otherCost;
  const profit = price - totalCost;
  const margin = price > 0 ? (profit / price) * 100 : 0;

  return { profit, margin };
}

/* -------------------------------------------------------------------------- */
/* IMAGE NORMALIZATION                                                        */
/* -------------------------------------------------------------------------- */

function normalizeImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(cleanString).filter(Boolean);
  }

  const text = cleanString(value);

  if (!text) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(text);

    if (Array.isArray(parsed)) {
      return parsed.map(cleanString).filter(Boolean);
    }

    if (typeof parsed === "string" && parsed.trim()) {
      return [parsed.trim()];
    }
  } catch {
    // Continue with delimiter parsing.
  }

  return text
    .split(/[|;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/* VARIANT NORMALIZATION                                                      */
/* -------------------------------------------------------------------------- */

function normalizeVariants(value: unknown): ProductVariant[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): ProductVariant | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const variant = item as Record<string, unknown>;

      return {
        id:
          typeof variant.id === "string" && variant.id.trim()
            ? variant.id.trim()
            : createId("variant"),

        name:
          typeof variant.name === "string"
            ? variant.name.trim()
            : "",

        value:
          typeof variant.value === "string"
            ? variant.value.trim()
            : "",

        price:
          variant.price === undefined ||
          variant.price === null ||
          variant.price === ""
            ? ""
            : String(variant.price),

        sku:
          variant.sku === undefined || variant.sku === null
            ? ""
            : String(variant.sku).trim(),

        stock:
          variant.stock === undefined ||
          variant.stock === null ||
          variant.stock === ""
            ? "0"
            : String(variant.stock),
      };
    })
    .filter(
      (variant): variant is ProductVariant => variant !== null,
    );
}

/* -------------------------------------------------------------------------- */
/* PRODUCT BUILDER                                                            */
/* -------------------------------------------------------------------------- */

function buildProduct(
  input: Record<string, unknown>,
  existing?: ProductWithStore,
): ProductWithStore {
  const name =
    cleanString(input.name) ||
    cleanString(input.title) ||
    existing?.name ||
    "";

  const description =
    cleanString(input.description) ||
    cleanString(input.bodyHtml) ||
    cleanString(input.body) ||
    existing?.description ||
    "";

  const category =
    cleanString(input.category) ||
    cleanString(input.type) ||
    existing?.category ||
    "General";

  const price =
    input.price !== undefined
      ? numberValue(input.price)
      : input.retail_price !== undefined
        ? numberValue(input.retail_price)
        : existing?.price ?? 0;

  const supplierCost =
    input.supplier_cost !== undefined
      ? numberValue(input.supplier_cost)
      : input.wholesale_cost !== undefined
        ? numberValue(input.wholesale_cost)
        : existing?.supplier_cost ?? 0;

  const shippingCost =
    input.shipping_cost !== undefined
      ? numberValue(input.shipping_cost)
      : existing?.shipping_cost ?? 0;

  const otherCost =
    input.other_cost !== undefined
      ? numberValue(input.other_cost)
      : existing?.other_cost ?? 0;

  const financials = calculateFinancials(
    price,
    supplierCost,
    shippingCost,
    otherCost,
  );

  const images =
    input.images !== undefined
      ? normalizeImages(input.images)
      : input.image_url !== undefined
        ? normalizeImages(input.image_url)
        : input.imageUrl !== undefined
          ? normalizeImages(input.imageUrl)
          : existing?.images ?? [];

  const imageUrl =
    cleanString(input.image_url) ||
    cleanString(input.imageUrl) ||
    images[0] ||
    existing?.image_url ||
    null;

  const variants =
    input.variants !== undefined
      ? normalizeVariants(input.variants)
      : existing?.variants ?? [];

  const stock =
    input.stock !== undefined
      ? integerValue(input.stock)
      : input.inventory_quantity !== undefined
        ? integerValue(input.inventory_quantity)
        : existing?.stock ?? 0;

  const lowStockThreshold =
    input.low_stock_threshold !== undefined
      ? integerValue(input.low_stock_threshold)
      : existing?.low_stock_threshold ?? 0;

  const activeValue =
    input.active !== undefined
      ? booleanValue(input.active, true)
      : input.status !== undefined
        ? booleanValue(input.status, true)
        : existing
          ? Number(existing.active) === 1
          : true;

  /*
   * On creation, omitted store_id means a Global product.
   * On update, omitted store_id preserves the existing assignment.
   * Explicit null or an empty string moves the product to Global.
   */
  const storeId =
    Object.prototype.hasOwnProperty.call(input, "store_id")
      ? nullableString(input.store_id)
      : existing?.store_id ?? null;

  return {
    id:
      existing?.id ||
      cleanString(input.id) ||
      createId("product"),

    name,

    slug:
      cleanString(input.slug) ||
      cleanString(input.handle) ||
      existing?.slug ||
      slugify(name),

    sku:
      nullableString(input.sku) ||
      nullableString(input.variant_sku) ||
      existing?.sku ||
      null,

    description,
    category,
    price,

    currency:
      cleanString(input.currency) ||
      existing?.currency ||
      "USD",

    image_url: imageUrl,
    images,

    video_url:
      nullableString(input.video_url) ||
      nullableString(input.videoUrl) ||
      existing?.video_url ||
      null,

    supplier_name:
      nullableString(input.supplier_name) ||
      nullableString(input.vendor) ||
      existing?.supplier_name ||
      null,

    supplier_product_id:
      nullableString(input.supplier_product_id) ||
      existing?.supplier_product_id ||
      null,

    warehouse_country:
      nullableString(input.warehouse_country) ||
      existing?.warehouse_country ||
      null,

    processing_time:
      nullableString(input.processing_time) ||
      existing?.processing_time ||
      null,

    delivery_time:
      nullableString(input.delivery_time) ||
      existing?.delivery_time ||
      null,

    supplier_cost: supplierCost,
    shipping_cost: shippingCost,
    other_cost: otherCost,
    profit_per_unit: financials.profit,
    profit_margin: financials.margin,
    stock,
    low_stock_threshold: lowStockThreshold,
    variants,
    active: activeValue ? 1 : 0,
    created_at:
      existing?.created_at ||
      cleanString(input.created_at) ||
      new Date().toISOString(),

    store_id: storeId,
  };
}

/* -------------------------------------------------------------------------- */
/* DATABASE ERROR                                                             */
/* -------------------------------------------------------------------------- */

function getDatabaseErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return String(error);
}

/* -------------------------------------------------------------------------- */
/* CREATE PRODUCT                                                             */
/* -------------------------------------------------------------------------- */

products.post("/", authMiddleware, async (c) => {
  try {
    const body = (await c.req.json()) as Record<string, unknown>;

    const name =
      cleanString(body.name) || cleanString(body.title);

    const description =
      cleanString(body.description) ||
      cleanString(body.bodyHtml) ||
      cleanString(body.body);

    const price = numberValue(
      body.price ?? body.retail_price ?? body.variant_price,
    );

    if (!name) {
      return c.json(
        { success: false, error: "Product name/title is required." },
        400,
      );
    }

    if (!description) {
      return c.json(
        { success: false, error: "Product description is required." },
        400,
      );
    }

    if (price <= 0) {
      return c.json(
        { success: false, error: "Product price must be greater than 0." },
        400,
      );
    }

    const sku =
      nullableString(body.sku) ||
      nullableString(body.variant_sku);

    if (sku) {
      const duplicate = db
        .prepare("SELECT id FROM products WHERE sku = ? LIMIT 1")
        .get(sku) as { id: string } | undefined;

      if (duplicate) {
        return c.json(
          {
            success: false,
            error: "A product with this SKU already exists.",
            details: `SKU "${sku}" already belongs to product ${duplicate.id}.`,
          },
          409,
        );
      }
    }

    const slug = await createUniqueSlug(
      name,
      nullableString(body.slug) || nullableString(body.handle),
    );

    const product = buildProduct({
      ...body,
      name,
      description,
      price,
      slug,
    });

    const saved = await insertProduct(product);

    return c.json(
      {
        success: true,
        data: saved,
        message: "Product created successfully.",
      },
      201,
    );
  } catch (error) {
    console.error("Product create error:", error);

    const message = getDatabaseErrorMessage(error);

    return c.json(
      {
        success: false,
        error: message.includes("selected store does not exist")
          ? message
          : "Unable to create product.",
        details: message,
      },
      message.includes("selected store does not exist") ? 400 : 500,
    );
  }
});

/* -------------------------------------------------------------------------- */
/* UPDATE PRODUCT                                                             */
/* -------------------------------------------------------------------------- */

products.patch("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  try {
    const existing = await getProductById(id);

    if (!existing) {
      return c.json(
        { success: false, error: "Product not found." },
        404,
      );
    }

    const body = (await c.req.json()) as Record<string, unknown>;

    const merged = {
      ...existing,
      ...body,
    };

    const name =
      cleanString(body.name) ||
      cleanString(body.title) ||
      existing.name;

    const description =
      cleanString(body.description) ||
      cleanString(body.bodyHtml) ||
      cleanString(body.body) ||
      existing.description;

    if (!name) {
      return c.json(
        { success: false, error: "Product name/title is required." },
        400,
      );
    }

    if (!description) {
      return c.json(
        { success: false, error: "Product description is required." },
        400,
      );
    }

    const price =
      body.price !== undefined
        ? numberValue(body.price)
        : existing.price;

    if (price <= 0) {
      return c.json(
        { success: false, error: "Product price must be greater than 0." },
        400,
      );
    }

    const sku =
      nullableString(body.sku) ||
      nullableString(body.variant_sku) ||
      existing.sku;

    if (sku) {
      const duplicate = db
        .prepare(`
          SELECT id
          FROM products
          WHERE sku = ? AND id != ?
          LIMIT 1
        `)
        .get(sku, id) as { id: string } | undefined;

      if (duplicate) {
        return c.json(
          {
            success: false,
            error: "Another product already uses this SKU.",
            details: `SKU "${sku}" belongs to product ${duplicate.id}.`,
          },
          409,
        );
      }
    }

    let slug =
      cleanString(body.slug) ||
      cleanString(body.handle) ||
      existing.slug;

    if (
      cleanString(body.name) ||
      cleanString(body.title) ||
      cleanString(body.handle) ||
      cleanString(body.slug)
    ) {
      slug = await createUniqueSlug(name, slug, id);
    }

    const product = buildProduct(
      {
        ...merged,
        id,
        name,
        description,
        price,
        slug,
      },
      existing,
    );

    const saved = await updateProductRecord(id, product);

    if (!saved) {
      return c.json(
        { success: false, error: "Product not found." },
        404,
      );
    }

    return c.json({
      success: true,
      data: saved,
      message: "Product updated successfully.",
    });
  } catch (error) {
    console.error("Product update error:", error);

    const message = getDatabaseErrorMessage(error);

    return c.json(
      {
        success: false,
        error: message.includes("selected store does not exist")
          ? message
          : "Unable to update product.",
        details: message,
      },
      message.includes("selected store does not exist") ? 400 : 500,
    );
  }
});

/* -------------------------------------------------------------------------- */
/* DELETE PRODUCT                                                             */
/* -------------------------------------------------------------------------- */

products.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  try {
    const existing = await getProductById(id);

    if (!existing) {
      return c.json(
        { success: false, error: "Product not found." },
        404,
      );
    }

    await deleteProductRecord(id);

    return c.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Product delete error:", error);

    return c.json(
      {
        success: false,
        error: "Unable to delete product.",
        details: getDatabaseErrorMessage(error),
      },
      500,
    );
  }
});

export default products;