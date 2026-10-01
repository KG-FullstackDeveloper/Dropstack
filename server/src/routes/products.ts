import { Hono } from "hono";

import { db } from "../database/db";
import {
  getAllProducts,
  getActiveProducts,
  getProductById,
  getProductBySlug,
} from "../data/store";
import { authMiddleware } from "../middleware/auth";
import type { CreateProductInput, Product } from "../types/product";

const productsRoute = new Hono();

/*
|--------------------------------------------------------------------------
| GET / — public active products
|--------------------------------------------------------------------------
*/

productsRoute.get("/", (c) => {
  const activeProducts = getActiveProducts();

  return c.json({
    success: true,
    data: activeProducts,
  });
});

/*
|--------------------------------------------------------------------------
| GET /admin/all — all products including inactive (protected)
|--------------------------------------------------------------------------
*/

productsRoute.get("/admin/all", authMiddleware, (c) => {
  const allProducts = getAllProducts();

  return c.json({
    success: true,
    data: allProducts,
  });
});

/*
|--------------------------------------------------------------------------
| GET /slug/:slug — public product by slug
|--------------------------------------------------------------------------
*/

productsRoute.get("/slug/:slug", (c) => {
  const slug = c.req.param("slug");
  const product = getProductBySlug(slug);

  if (!product) {
    return c.json(
      {
        success: false,
        error: "Product not found.",
      },
      404
    );
  }

  return c.json({
    success: true,
    data: product,
  });
});

/*
|--------------------------------------------------------------------------
| GET /:id — public product by id
|--------------------------------------------------------------------------
*/

productsRoute.get("/:id", (c) => {
  const id = c.req.param("id");

  const product = db
    .prepare("SELECT * FROM products WHERE id = ? AND active = 1")
    .get(id) as Product | undefined;

  if (!product) {
    return c.json(
      {
        success: false,
        error: "Product not found.",
      },
      404
    );
  }

  return c.json({
    success: true,
    data: product,
  });
});

/*
|--------------------------------------------------------------------------
| POST / — create product (protected)
|--------------------------------------------------------------------------
*/

productsRoute.post("/", authMiddleware, async (c) => {
  try {
    const body = await c.req.json<CreateProductInput>();

    if (!body.name?.trim()) {
      return c.json(
        { success: false, error: "Product name is required." },
        400
      );
    }

    if (!body.slug?.trim()) {
      return c.json(
        { success: false, error: "Product slug is required." },
        400
      );
    }

    if (!body.description?.trim()) {
      return c.json(
        { success: false, error: "Product description is required." },
        400
      );
    }

    if (!body.category?.trim()) {
      return c.json(
        { success: false, error: "Product category is required." },
        400
      );
    }

    if (typeof body.price !== "number" || body.price < 0) {
      return c.json(
        { success: false, error: "Valid product price is required." },
        400
      );
    }

    // Check slug uniqueness
    const existing = db
      .prepare("SELECT id FROM products WHERE slug = ?")
      .get(body.slug.trim()) as { id: string } | undefined;

    if (existing) {
      return c.json(
        { success: false, error: "A product with that slug already exists." },
        409
      );
    }

    const supplierCost = Number(body.supplier_cost) || 0;
    const shippingCost = Number(body.shipping_cost) || 0;
    const otherCost = Number(body.other_cost) || 0;
    const profitPerUnit =
      body.price - supplierCost - shippingCost - otherCost;
    const profitMargin =
      body.price > 0 ? (profitPerUnit / body.price) * 100 : 0;

    const id = "PRD-" + Date.now();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO products (
        id, name, slug, description, category, price, currency,
        image_url, video_url, supplier_name, supplier_product_id,
        warehouse_country, processing_time, delivery_time,
        supplier_cost, shipping_cost, other_cost,
        profit_per_unit, profit_margin, active, created_at
      ) VALUES (
        @id, @name, @slug, @description, @category, @price, @currency,
        @image_url, @video_url, @supplier_name, @supplier_product_id,
        @warehouse_country, @processing_time, @delivery_time,
        @supplier_cost, @shipping_cost, @other_cost,
        @profit_per_unit, @profit_margin, 1, @created_at
      )
    `).run({
      id,
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: body.description.trim(),
      category: body.category.trim(),
      price: body.price,
      currency: body.currency || "USD",
      image_url: body.image_url || null,
      video_url: body.video_url || null,
      supplier_name: body.supplier_name || null,
      supplier_product_id: body.supplier_product_id || null,
      warehouse_country: body.warehouse_country || null,
      processing_time: body.processing_time || null,
      delivery_time: body.delivery_time || null,
      supplier_cost: supplierCost,
      shipping_cost: shippingCost,
      other_cost: otherCost,
      profit_per_unit: profitPerUnit,
      profit_margin: profitMargin,
      created_at: now,
    });

    const product = getProductById(id);

    return c.json(
      {
        success: true,
        data: product,
      },
      201
    );
  } catch (error) {
    console.error("Create product error:", error);
    return c.json(
      { success: false, error: "Unable to create product." },
      500
    );
  }
});

/*
|--------------------------------------------------------------------------
| PUT /:id — update product (protected)
|--------------------------------------------------------------------------
*/

productsRoute.put("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<Partial<CreateProductInput> & { active?: number }>();

    const product = getProductById(id);

    if (!product) {
      return c.json(
        { success: false, error: "Product not found." },
        404
      );
    }

    // Check slug uniqueness if slug is being updated
    if (body.slug && body.slug.trim() !== product.slug) {
      const existing = db
        .prepare("SELECT id FROM products WHERE slug = ? AND id != ?")
        .get(body.slug.trim(), id) as { id: string } | undefined;

      if (existing) {
        return c.json(
          {
            success: false,
            error: "A product with that slug already exists.",
          },
          409
        );
      }
    }

    const name = body.name?.trim() ?? product.name;
    const slug = body.slug?.trim() ?? product.slug;
    const description = body.description?.trim() ?? product.description;
    const category = body.category?.trim() ?? product.category;
    const price =
      typeof body.price === "number" ? body.price : product.price;
    const currency = body.currency ?? product.currency;
    const image_url =
      body.image_url !== undefined ? body.image_url || null : product.image_url;
    const video_url =
      body.video_url !== undefined ? body.video_url || null : product.video_url;
    const supplier_name =
      body.supplier_name !== undefined
        ? body.supplier_name || null
        : product.supplier_name;
    const supplier_product_id =
      body.supplier_product_id !== undefined
        ? body.supplier_product_id || null
        : product.supplier_product_id;
    const warehouse_country =
      body.warehouse_country !== undefined
        ? body.warehouse_country || null
        : product.warehouse_country;
    const processing_time =
      body.processing_time !== undefined
        ? body.processing_time || null
        : product.processing_time;
    const delivery_time =
      body.delivery_time !== undefined
        ? body.delivery_time || null
        : product.delivery_time;
    const supplier_cost =
      typeof body.supplier_cost === "number"
        ? body.supplier_cost
        : product.supplier_cost;
    const shipping_cost =
      typeof body.shipping_cost === "number"
        ? body.shipping_cost
        : product.shipping_cost;
    const other_cost =
      typeof body.other_cost === "number"
        ? body.other_cost
        : product.other_cost;
    const active =
      typeof body.active === "number" ? body.active : product.active;

    const profit_per_unit = price - supplier_cost - shipping_cost - other_cost;
    const profit_margin = price > 0 ? (profit_per_unit / price) * 100 : 0;

    db.prepare(`
      UPDATE products SET
        name = @name,
        slug = @slug,
        description = @description,
        category = @category,
        price = @price,
        currency = @currency,
        image_url = @image_url,
        video_url = @video_url,
        supplier_name = @supplier_name,
        supplier_product_id = @supplier_product_id,
        warehouse_country = @warehouse_country,
        processing_time = @processing_time,
        delivery_time = @delivery_time,
        supplier_cost = @supplier_cost,
        shipping_cost = @shipping_cost,
        other_cost = @other_cost,
        profit_per_unit = @profit_per_unit,
        profit_margin = @profit_margin,
        active = @active
      WHERE id = @id
    `).run({
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
    });

    const updated = getProductById(id);

    return c.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Update product error:", error);
    return c.json(
      { success: false, error: "Unable to update product." },
      500
    );
  }
});

/*
|--------------------------------------------------------------------------
| DELETE /:id — soft-delete product (sets active=0) (protected)
|--------------------------------------------------------------------------
*/

productsRoute.delete("/:id", authMiddleware, (c) => {
  try {
    const id = c.req.param("id");

    const product = getProductById(id);

    if (!product) {
      return c.json(
        { success: false, error: "Product not found." },
        404
      );
    }

    db.prepare("UPDATE products SET active = 0 WHERE id = ?").run(id);

    return c.json({
      success: true,
      message: "Product deactivated successfully.",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return c.json(
      { success: false, error: "Unable to delete product." },
      500
    );
  }
});

export default productsRoute;
