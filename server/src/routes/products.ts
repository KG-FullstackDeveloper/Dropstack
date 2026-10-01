import { Hono } from "hono";

import {
  deleteProductRecord,
  getActiveProducts,
  getAllProducts,
  getProductById,
  getProductBySlug,
  insertProduct,
  updateProductRecord,
} from "../data/store";
import { createId } from "../utils/id";
import type { CreateProductInput, Product } from "../types/product";

const productsRoute = new Hono();

function numberOrZero(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function stringOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const valueString = String(value).trim();
  return valueString ? valueString : null;
}

function buildProduct(input: CreateProductInput): Product {
  const price = numberOrZero(input.price);
  const supplierCost = numberOrZero(input.supplier_cost);
  const shippingCost = numberOrZero(input.shipping_cost);
  const otherCost = numberOrZero(input.other_cost);
  const profitPerUnit = price - supplierCost - shippingCost - otherCost;
  const profitMargin = price > 0 ? (profitPerUnit / price) * 100 : 0;
  const now = new Date().toISOString();

  return {
    id: createId("product"),
    name: String(input.name || "").trim(),
    slug: String(input.slug || input.name || "").trim(),
    description: String(input.description || "").trim(),
    category: String(input.category || "Other").trim(),
    price,
    currency: String(input.currency || "USD").trim().toUpperCase(),
    image_url: stringOrNull(input.image_url),
    video_url: stringOrNull(input.video_url),
    supplier_name: stringOrNull(input.supplier_name),
    supplier_product_id: stringOrNull(input.supplier_product_id),
    warehouse_country: input.warehouse_country
      ? String(input.warehouse_country).trim().toUpperCase()
      : null,
    processing_time: stringOrNull(input.processing_time),
    delivery_time: stringOrNull(input.delivery_time),
    supplier_cost: supplierCost,
    shipping_cost: shippingCost,
    other_cost: otherCost,
    profit_per_unit: profitPerUnit,
    profit_margin: profitMargin,
    active: 1,
    created_at: now,
  };
}

productsRoute.get("/", (c) => {
  return c.json({
    success: true,
    data: getActiveProducts(),
  });
});

productsRoute.get("/all", (c) => {
  return c.json({
    success: true,
    data: getAllProducts(),
  });
});

productsRoute.get("/slug/:slug", (c) => {
  const slug = c.req.param("slug");
  const product = getProductBySlug(slug);

  if (!product) {
    return c.json(
      {
        success: false,
        error: "Product not found.",
      },
      404,
    );
  }

  return c.json({
    success: true,
    data: product,
  });
});

productsRoute.get("/:id", (c) => {
  const id = c.req.param("id");
  const product = getProductById(id);

  if (!product) {
    return c.json(
      {
        success: false,
        error: "Product not found.",
      },
      404,
    );
  }

  return c.json({
    success: true,
    data: product,
  });
});

productsRoute.post("/", async (c) => {
  let body: CreateProductInput;

  try {
    body = await c.req.json<CreateProductInput>();
  } catch {
    return c.json(
      {
        success: false,
        error: "Invalid product data.",
      },
      400,
    );
  }

  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  const price = Number(body.price);

  if (!name) {
    return c.json(
      { success: false, error: "Product name is required." },
      400,
    );
  }

  if (!description) {
    return c.json(
      { success: false, error: "Product description is required." },
      400,
    );
  }

  if (!Number.isFinite(price) || price <= 0) {
    return c.json(
      { success: false, error: "Product price must be a valid positive number." },
      400,
    );
  }

  const slug = String(body.slug || name).trim();
  const existing = getProductBySlug(slug);

  if (existing) {
    return c.json(
      {
        success: false,
        error: "A product with this slug already exists.",
      },
      409,
    );
  }

  const product = buildProduct({
    ...body,
    name,
    slug,
    description,
    price,
  });

  try {
    insertProduct(product);
  } catch (error) {
    console.error("Product create error:", error);
    return c.json(
      {
        success: false,
        error: "Unable to create product.",
      },
      500,
    );
  }

  return c.json(
    {
      success: true,
      data: product,
    },
    201,
  );
});

productsRoute.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const current = getProductById(id);

  if (!current) {
    return c.json(
      {
        success: false,
        error: "Product not found.",
      },
      404,
    );
  }

  let body: Partial<CreateProductInput> & { active?: number };

  try {
    body = await c.req.json<Partial<CreateProductInput> & { active?: number }>();
  } catch {
    return c.json(
      {
        success: false,
        error: "Invalid product update data.",
      },
      400,
    );
  }

  const updates: Partial<Product> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return c.json(
        { success: false, error: "Product name cannot be empty." },
        400,
      );
    }
    updates.name = name;
  }

  if (body.slug !== undefined) {
    const slug = String(body.slug).trim();
    if (!slug) {
      return c.json(
        { success: false, error: "Product slug cannot be empty." },
        400,
      );
    }

    const existing = getProductBySlug(slug);
    if (existing && existing.id !== id) {
      return c.json(
        {
          success: false,
          error: "A product with this slug already exists.",
        },
        409,
      );
    }

    updates.slug = slug;
  }

  if (body.description !== undefined) updates.description = String(body.description).trim();
  if (body.category !== undefined) updates.category = String(body.category).trim();
  if (body.currency !== undefined) updates.currency = String(body.currency).trim().toUpperCase();
  if (body.image_url !== undefined) updates.image_url = stringOrNull(body.image_url);
  if (body.video_url !== undefined) updates.video_url = stringOrNull(body.video_url);
  if (body.supplier_name !== undefined) updates.supplier_name = stringOrNull(body.supplier_name);
  if (body.supplier_product_id !== undefined) updates.supplier_product_id = stringOrNull(body.supplier_product_id);
  if (body.warehouse_country !== undefined) {
    updates.warehouse_country = stringOrNull(body.warehouse_country)?.toUpperCase() ?? null;
  }
  if (body.processing_time !== undefined) updates.processing_time = stringOrNull(body.processing_time);
  if (body.delivery_time !== undefined) updates.delivery_time = stringOrNull(body.delivery_time);

  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) {
      return c.json(
        { success: false, error: "Product price must be a valid positive number." },
        400,
      );
    }
    updates.price = price;
  }

  if (body.supplier_cost !== undefined) updates.supplier_cost = Math.max(0, numberOrZero(body.supplier_cost));
  if (body.shipping_cost !== undefined) updates.shipping_cost = Math.max(0, numberOrZero(body.shipping_cost));
  if (body.other_cost !== undefined) updates.other_cost = Math.max(0, numberOrZero(body.other_cost));
  if (body.active !== undefined) updates.active = Number(body.active) === 1 ? 1 : 0;

  const nextPrice = updates.price ?? current.price;
  const nextSupplierCost = updates.supplier_cost ?? current.supplier_cost;
  const nextShippingCost = updates.shipping_cost ?? current.shipping_cost;
  const nextOtherCost = updates.other_cost ?? current.other_cost;
  const nextProfit = nextPrice - nextSupplierCost - nextShippingCost - nextOtherCost;

  updates.profit_per_unit = nextProfit;
  updates.profit_margin = nextPrice > 0 ? (nextProfit / nextPrice) * 100 : 0;

  try {
    const product = updateProductRecord(id, updates);

    return c.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Product update error:", error);
    return c.json(
      {
        success: false,
        error: "Unable to update product.",
      },
      500,
    );
  }
});

productsRoute.delete("/:id", (c) => {
  const id = c.req.param("id");
  const exists = getProductById(id);

  if (!exists) {
    return c.json(
      {
        success: false,
        error: "Product not found.",
      },
      404,
    );
  }

  try {
    deleteProductRecord(id);
  } catch (error) {
    console.error("Product delete error:", error);
    return c.json(
      {
        success: false,
        error: "Unable to delete product.",
      },
      500,
    );
  }

  return c.json({
    success: true,
    data: {
      message: "Product deleted successfully.",
    },
  });
});

export default productsRoute;
