import { Hono } from "hono";

import {
  authMiddleware,
  type AuthVariables,
} from "../middleware/auth";

import { db } from "../database/db";

import {
  createNigeriaId,
  nigeriaNow,
} from "../database/nigeriaDb";

const nigeria = new Hono<{
  Variables: AuthVariables;
}>();

nigeria.use("*", authMiddleware);

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

nigeria.get("/dashboard", (c) => {
  const productStats = db
    .prepare(
      `
        SELECT
          COUNT(*) AS total_products,
          SUM(
            CASE
              WHEN active = 1 THEN 1
              ELSE 0
            END
          ) AS active_products,
          COALESCE(SUM(inventory), 0) AS total_inventory
        FROM nigeria_products
      `,
    )
    .get() as {
    total_products: number;
    active_products: number;
    total_inventory: number;
  };

  const orderStats = db
    .prepare(
      `
        SELECT
          COUNT(*) AS total_orders,
          COALESCE(
            SUM(
              CASE
                WHEN payment_status = 'confirmed'
                THEN total
                ELSE 0
              END
            ),
            0
          ) AS revenue,
          COALESCE(
            SUM(
              CASE
                WHEN payment_status = 'confirmed'
                THEN profit
                ELSE 0
              END
            ),
            0
          ) AS profit,
          COALESCE(
            SUM(
              CASE
                WHEN payment_status = 'confirmed'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS paid_orders
        FROM nigeria_orders
      `,
    )
    .get() as {
    total_orders: number;
    revenue: number;
    profit: number;
    paid_orders: number;
  };

  const customers = db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM nigeria_customers
      `,
    )
    .get() as {
    count: number;
  };

  const pendingOrders = db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM nigeria_orders
        WHERE payment_status = 'confirmed'
          AND order_status NOT IN (
            'delivered',
            'cancelled'
          )
      `,
    )
    .get() as {
    count: number;
  };

  return c.json({
    success: true,
    data: {
      products: productStats,
      orders: orderStats,
      customers: customers.count,
      pendingFulfillment: pendingOrders.count,
      currency: "NGN",
      workspace: "nigeria",
    },
  });
});

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

nigeria.get("/settings", (c) => {
  const settings = db
    .prepare(
      `
        SELECT *
        FROM nigeria_settings
        WHERE id = 'nigeria'
        LIMIT 1
      `,
    )
    .get();

  return c.json({
    success: true,
    data: settings,
  });
});

nigeria.patch("/settings", async (c) => {
  const body =
    await c.req.json<{
      storeName?: string;
      supplierName?: string;
      paymentMethod?: string;
      shippingFee?: number;
      deliveryEstimate?: string;
    }>();

  const current = db
    .prepare(
      `
        SELECT *
        FROM nigeria_settings
        WHERE id = 'nigeria'
        LIMIT 1
      `,
    )
    .get() as Record<string, unknown>;

  const storeName =
    body.storeName?.trim() ||
    String(current.store_name);

  const supplierName =
    body.supplierName !== undefined
      ? body.supplierName.trim()
      : String(current.supplier_name || "");

  const paymentMethod =
    body.paymentMethod?.trim() ||
    String(current.payment_method);

  const shippingFee =
    typeof body.shippingFee === "number" &&
    Number.isFinite(body.shippingFee)
      ? Math.max(0, body.shippingFee)
      : Number(current.default_shipping_fee);

  const deliveryEstimate =
    body.deliveryEstimate?.trim() ||
    String(current.delivery_estimate);

  db.prepare(
    `
      UPDATE nigeria_settings
      SET
        store_name = ?,
        supplier_name = ?,
        payment_method = ?,
        default_shipping_fee = ?,
        delivery_estimate = ?,
        updated_at = ?
      WHERE id = 'nigeria'
    `,
  ).run(
    storeName,
    supplierName,
    paymentMethod,
    shippingFee,
    deliveryEstimate,
    nigeriaNow(),
  );

  return c.json({
    success: true,
    data: db
      .prepare(
        `
          SELECT *
          FROM nigeria_settings
          WHERE id = 'nigeria'
        `,
      )
      .get(),
  });
});

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

nigeria.get("/products", (c) => {
  const products = db
    .prepare(
      `
        SELECT
          p.*,
          COALESCE(
            i.quantity,
            p.inventory
          ) AS inventory
        FROM nigeria_products p
        LEFT JOIN nigeria_inventory i
          ON i.product_id = p.id
        ORDER BY p.created_at DESC
      `,
    )
    .all();

  return c.json({
    success: true,
    data: products,
  });
});

nigeria.post("/products", async (c) => {
  const body =
    await c.req.json<{
      name?: string;
      description?: string;
      category?: string;
      price?: number;
      supplierCost?: number;
      shippingCost?: number;
      otherCost?: number;
      inventory?: number;
      lowStockThreshold?: number;
      imageUrl?: string;
      videoUrl?: string;
      supplierName?: string;
      supplierProductId?: string;
      active?: boolean;
    }>();

  const name = body.name?.trim();

  if (!name) {
    return c.json(
      {
        success: false,
        error: "Product name is required.",
      },
      400,
    );
  }

  const price = Number(body.price ?? 0);

  if (!Number.isFinite(price) || price < 0) {
    return c.json(
      {
        success: false,
        error:
          "Product price must be a valid non-negative number.",
      },
      400,
    );
  }

  const supplierCost = Math.max(
    0,
    Number(body.supplierCost ?? 0),
  );

  const shippingCost = Math.max(
    0,
    Number(body.shippingCost ?? 0),
  );

  const otherCost = Math.max(
    0,
    Number(body.otherCost ?? 0),
  );

  const inventory = Math.max(
    0,
    Math.floor(Number(body.inventory ?? 0)),
  );

  const lowStockThreshold = Math.max(
    0,
    Math.floor(Number(body.lowStockThreshold ?? 5)),
  );

  const profitPerUnit =
    price -
    supplierCost -
    shippingCost -
    otherCost;

  const profitMargin =
    price > 0
      ? (profitPerUnit / price) * 100
      : 0;

  const id = createNigeriaId("NGP");
  const now = nigeriaNow();

  const baseSlug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    id.toLowerCase();

  let slug = baseSlug;

  const existingSlug = db.prepare(
    `
      SELECT id
      FROM nigeria_products
      WHERE slug = ?
      LIMIT 1
    `,
  );

  let counter = 2;

  while (existingSlug.get(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  const transaction = db.transaction(() => {
    db.prepare(
      `
        INSERT INTO nigeria_products (
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
          supplier_cost,
          shipping_cost,
          other_cost,
          inventory,
          low_stock_threshold,
          profit_per_unit,
          profit_margin,
          active,
          created_at,
          updated_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, 'NGN',
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?
        )
      `,
    ).run(
      id,
      name,
      slug,
      body.description?.trim() || "",
      body.category?.trim() || "",
      price,
      body.imageUrl?.trim() || null,
      body.videoUrl?.trim() || null,
      body.supplierName?.trim() || null,
      body.supplierProductId?.trim() || null,
      supplierCost,
      shippingCost,
      otherCost,
      inventory,
      lowStockThreshold,
      profitPerUnit,
      profitMargin,
      body.active === false ? 0 : 1,
      now,
      now,
    );

    db.prepare(
      `
        INSERT INTO nigeria_inventory (
          id,
          product_id,
          quantity,
          reserved_quantity,
          low_stock_threshold,
          updated_at
        )
        VALUES (?, ?, ?, 0, ?, ?)
      `,
    ).run(
      createNigeriaId("NGI"),
      id,
      inventory,
      lowStockThreshold,
      now,
    );
  });

  transaction();

  return c.json(
    {
      success: true,
      data: db
        .prepare(
          `
            SELECT *
            FROM nigeria_products
            WHERE id = ?
          `,
        )
        .get(id),
    },
    201,
  );
});

/* -------------------------------------------------------------------------- */
/* Edit Product                                                               */
/* -------------------------------------------------------------------------- */

nigeria.patch("/products/:id", async (c) => {
  const productId = c.req.param("id");

  const existing = db
    .prepare(
      `
        SELECT *
        FROM nigeria_products
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(productId) as
    | {
        id: string;
        name: string;
        slug: string;
        description: string;
        category: string;
        price: number;
        image_url: string | null;
        video_url: string | null;
        supplier_name: string | null;
        supplier_product_id: string | null;
        supplier_cost: number;
        shipping_cost: number;
        other_cost: number;
        inventory: number;
        low_stock_threshold: number;
        active: number;
      }
    | undefined;

  if (!existing) {
    return c.json(
      {
        success: false,
        error: "Nigeria product not found.",
      },
      404,
    );
  }

  const body =
    await c.req.json<{
      name?: string;
      description?: string;
      category?: string;
      price?: number;
      supplierCost?: number;
      shippingCost?: number;
      otherCost?: number;
      inventory?: number;
      lowStockThreshold?: number;
      imageUrl?: string | null;
      videoUrl?: string | null;
      supplierName?: string | null;
      supplierProductId?: string | null;
      active?: boolean;
    }>();

  const name =
    body.name !== undefined
      ? body.name.trim()
      : existing.name;

  if (!name) {
    return c.json(
      {
        success: false,
        error: "Product name is required.",
      },
      400,
    );
  }

  const price =
    body.price !== undefined
      ? Number(body.price)
      : Number(existing.price);

  if (!Number.isFinite(price) || price < 0) {
    return c.json(
      {
        success: false,
        error:
          "Product price must be a valid non-negative number.",
      },
      400,
    );
  }

  const supplierCost =
    body.supplierCost !== undefined
      ? Math.max(0, Number(body.supplierCost))
      : Number(existing.supplier_cost);

  const shippingCost =
    body.shippingCost !== undefined
      ? Math.max(0, Number(body.shippingCost))
      : Number(existing.shipping_cost);

  const otherCost =
    body.otherCost !== undefined
      ? Math.max(0, Number(body.otherCost))
      : Number(existing.other_cost);

  const inventory =
    body.inventory !== undefined
      ? Math.max(
          0,
          Math.floor(Number(body.inventory)),
        )
      : Number(existing.inventory);

  const lowStockThreshold =
    body.lowStockThreshold !== undefined
      ? Math.max(
          0,
          Math.floor(
            Number(body.lowStockThreshold),
          ),
        )
      : Number(existing.low_stock_threshold);

  if (
    !Number.isFinite(supplierCost) ||
    !Number.isFinite(shippingCost) ||
    !Number.isFinite(otherCost) ||
    !Number.isFinite(inventory) ||
    !Number.isFinite(lowStockThreshold)
  ) {
    return c.json(
      {
        success: false,
        error: "Product numeric values are invalid.",
      },
      400,
    );
  }

  const profitPerUnit =
    price -
    supplierCost -
    shippingCost -
    otherCost;

  const profitMargin =
    price > 0
      ? (profitPerUnit / price) * 100
      : 0;

  const description =
    body.description !== undefined
      ? body.description.trim()
      : existing.description || "";

  const category =
    body.category !== undefined
      ? body.category.trim()
      : existing.category || "";

  const imageUrl =
    body.imageUrl !== undefined
      ? body.imageUrl?.trim() || null
      : existing.image_url;

  const videoUrl =
    body.videoUrl !== undefined
      ? body.videoUrl?.trim() || null
      : existing.video_url;

  const supplierName =
    body.supplierName !== undefined
      ? body.supplierName?.trim() || null
      : existing.supplier_name;

  const supplierProductId =
    body.supplierProductId !== undefined
      ? body.supplierProductId?.trim() || null
      : existing.supplier_product_id;

  let slug = existing.slug;

  if (body.name !== undefined && name !== existing.name) {
    const baseSlug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      productId.toLowerCase();

    slug = baseSlug;

    const existingSlug = db.prepare(
      `
        SELECT id
        FROM nigeria_products
        WHERE slug = ?
          AND id != ?
        LIMIT 1
      `,
    );

    let counter = 2;

    while (existingSlug.get(slug, productId)) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }
  }

  const active =
    body.active !== undefined
      ? body.active
        ? 1
        : 0
      : existing.active;

  const now = nigeriaNow();

  const transaction = db.transaction(() => {
    db.prepare(
      `
        UPDATE nigeria_products
        SET
          name = ?,
          slug = ?,
          description = ?,
          category = ?,
          price = ?,
          image_url = ?,
          video_url = ?,
          supplier_name = ?,
          supplier_product_id = ?,
          supplier_cost = ?,
          shipping_cost = ?,
          other_cost = ?,
          inventory = ?,
          low_stock_threshold = ?,
          profit_per_unit = ?,
          profit_margin = ?,
          active = ?,
          updated_at = ?
        WHERE id = ?
      `,
    ).run(
      name,
      slug,
      description,
      category,
      price,
      imageUrl,
      videoUrl,
      supplierName,
      supplierProductId,
      supplierCost,
      shippingCost,
      otherCost,
      inventory,
      lowStockThreshold,
      profitPerUnit,
      profitMargin,
      active,
      now,
      productId,
    );

    const inventoryRow = db
      .prepare(
        `
          SELECT id
          FROM nigeria_inventory
          WHERE product_id = ?
          LIMIT 1
        `,
      )
      .get(productId) as
      | {
          id: string;
        }
      | undefined;

    if (inventoryRow) {
      db.prepare(
        `
          UPDATE nigeria_inventory
          SET
            quantity = ?,
            low_stock_threshold = ?,
            updated_at = ?
          WHERE product_id = ?
        `,
      ).run(
        inventory,
        lowStockThreshold,
        now,
        productId,
      );
    } else {
      db.prepare(
        `
          INSERT INTO nigeria_inventory (
            id,
            product_id,
            quantity,
            reserved_quantity,
            low_stock_threshold,
            updated_at
          )
          VALUES (?, ?, ?, 0, ?, ?)
        `,
      ).run(
        createNigeriaId("NGI"),
        productId,
        inventory,
        lowStockThreshold,
        now,
      );
    }
  });

  transaction();

  return c.json({
    success: true,
    data: db
      .prepare(
        `
          SELECT
            p.*,
            COALESCE(
              i.quantity,
              p.inventory
            ) AS inventory
          FROM nigeria_products p
          LEFT JOIN nigeria_inventory i
            ON i.product_id = p.id
          WHERE p.id = ?
          LIMIT 1
        `,
      )
      .get(productId),
  });
});

/* -------------------------------------------------------------------------- */
/* Delete Product                                                             */
/* -------------------------------------------------------------------------- */

nigeria.delete("/products/:id", (c) => {
  const productId = c.req.param("id");

  const existing = db
    .prepare(
      `
        SELECT id
        FROM nigeria_products
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(productId);

  if (!existing) {
    return c.json(
      {
        success: false,
        error: "Nigeria product not found.",
      },
      404,
    );
  }

  const orderItem = db
    .prepare(
      `
        SELECT id
        FROM nigeria_order_items
        WHERE product_id = ?
        LIMIT 1
      `,
    )
    .get(productId);

  if (orderItem) {
    return c.json(
      {
        success: false,
        error:
          "This product cannot be deleted because it is already connected to an order. Deactivate it instead.",
      },
      409,
    );
  }

  const transaction = db.transaction(() => {
    db.prepare(
      `
        DELETE FROM nigeria_inventory
        WHERE product_id = ?
      `,
    ).run(productId);

    db.prepare(
      `
        DELETE FROM nigeria_products
        WHERE id = ?
      `,
    ).run(productId);
  });

  transaction();

  return c.json({
    success: true,
    data: {
      id: productId,
      deleted: true,
    },
  });
});

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

nigeria.get("/orders", (c) => {
  const orders = db
    .prepare(
      `
        SELECT *
        FROM nigeria_orders
        ORDER BY created_at DESC
      `,
    )
    .all();

  return c.json({
    success: true,
    data: orders,
  });
});

nigeria.post("/orders", async (c) => {
  const body =
    await c.req.json<{
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      shippingAddress?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      items?: Array<{
        productId?: string;
        quantity?: number;
      }>;
    }>();

  const customerName =
    body.customerName?.trim() || "";

  const customerEmail =
    body.customerEmail?.trim().toLowerCase() || "";

  const customerPhone =
    body.customerPhone?.trim() || "";

  const shippingAddress =
    body.shippingAddress?.trim() || "";

  const city =
    body.city?.trim() || "";

  const state =
    body.state?.trim() || "";

  const postalCode =
    body.postalCode?.trim() || null;

  if (
    !customerName ||
    !customerEmail ||
    !customerPhone ||
    !shippingAddress ||
    !city ||
    !state
  ) {
    return c.json(
      {
        success: false,
        error:
          "Complete customer and delivery details are required.",
      },
      400,
    );
  }

  if (!body.items || body.items.length === 0) {
    return c.json(
      {
        success: false,
        error: "At least one product is required.",
      },
      400,
    );
  }

  const settings = db
    .prepare(
      `
        SELECT *
        FROM nigeria_settings
        WHERE id = 'nigeria'
        LIMIT 1
      `,
    )
    .get() as {
    supplier_name: string | null;
    default_shipping_fee: number;
    delivery_estimate: string;
  };

  const requestedItems = body.items.map((item) => ({
    productId: item.productId?.trim() || "",
    quantity: Math.max(
      0,
      Math.floor(Number(item.quantity ?? 0)),
    ),
  }));

  if (
    requestedItems.some(
      (item) =>
        !item.productId ||
        item.quantity < 1,
    )
  ) {
    return c.json(
      {
        success: false,
        error:
          "Each order item must contain a valid product and quantity.",
      },
      400,
    );
  }

  const getProduct = db.prepare(
    `
      SELECT
        p.*,
        COALESCE(
          i.quantity,
          p.inventory
        ) AS current_inventory
      FROM nigeria_products p
      LEFT JOIN nigeria_inventory i
        ON i.product_id = p.id
      WHERE p.id = ?
      LIMIT 1
    `,
  );

  const orderItems = requestedItems.map(
    (requestedItem) => {
      const product = getProduct.get(
        requestedItem.productId,
      ) as
        | {
            id: string;
            name: string;
            price: number;
            supplier_cost: number;
            shipping_cost: number;
            other_cost: number;
            active: number;
            current_inventory: number;
          }
        | undefined;

      if (!product) {
        throw new Error(
          `Product ${requestedItem.productId} was not found.`,
        );
      }

      if (!product.active) {
        throw new Error(
          `${product.name} is no longer available.`,
        );
      }

      if (
        requestedItem.quantity >
        Number(product.current_inventory)
      ) {
        throw new Error(
          `Insufficient inventory for ${product.name}.`,
        );
      }

      const subtotal =
        Number(product.price) *
        requestedItem.quantity;

      const supplierCost =
        Number(product.supplier_cost) *
        requestedItem.quantity;

      const shippingCost =
        Number(product.shipping_cost) *
        requestedItem.quantity;

      const otherCost =
        Number(product.other_cost) *
        requestedItem.quantity;

      const profit =
        subtotal -
        supplierCost -
        shippingCost -
        otherCost;

      return {
        product,
        quantity: requestedItem.quantity,
        subtotal,
        supplierCost,
        shippingCost,
        otherCost,
        profit,
      };
    },
  );

  const subtotal = orderItems.reduce(
    (sum, item) =>
      sum + item.subtotal,
    0,
  );

  const shippingFee = Math.max(
    0,
    Number(settings.default_shipping_fee) || 0,
  );

  const discount = 0;

  const total =
    subtotal +
    shippingFee -
    discount;

  const supplierCostTotal =
    orderItems.reduce(
      (sum, item) =>
        sum + item.supplierCost,
      0,
    );

  const shippingCostTotal =
    orderItems.reduce(
      (sum, item) =>
        sum + item.shippingCost,
      0,
    );

  const otherCostTotal =
    orderItems.reduce(
      (sum, item) =>
        sum + item.otherCost,
      0,
    );

  const profit =
    total -
    supplierCostTotal -
    shippingCostTotal -
    otherCostTotal;

  const profitMargin =
    total > 0
      ? (profit / total) * 100
      : 0;

  const orderId =
    createNigeriaId("NGO");

  const now = nigeriaNow();

  try {
    const transaction = db.transaction(() => {
      let customer = db
        .prepare(
          `
            SELECT *
            FROM nigeria_customers
            WHERE email = ?
            LIMIT 1
          `,
        )
        .get(customerEmail) as
        | {
            id: string;
            total_orders: number;
            total_spent: number;
          }
        | undefined;

      if (!customer) {
        const customerId =
          createNigeriaId("NGC");

        db.prepare(
          `
            INSERT INTO nigeria_customers (
              id,
              email,
              name,
              phone,
              address,
              city,
              state,
              postal_code,
              country,
              total_orders,
              total_spent,
              created_at,
              updated_at
            )
            VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?,
              'Nigeria', 1, 0, ?, ?
            )
          `,
        ).run(
          customerId,
          customerEmail,
          customerName,
          customerPhone,
          shippingAddress,
          city,
          state,
          postalCode,
          now,
          now,
        );

        customer = {
          id: customerId,
          total_orders: 1,
          total_spent: 0,
        };
      } else {
        db.prepare(
          `
            UPDATE nigeria_customers
            SET
              name = ?,
              phone = ?,
              address = ?,
              city = ?,
              state = ?,
              postal_code = ?,
              total_orders = total_orders + 1,
              updated_at = ?
            WHERE id = ?
          `,
        ).run(
          customerName,
          customerPhone,
          shippingAddress,
          city,
          state,
          postalCode,
          now,
          customer.id,
        );
      }

      db.prepare(
        `
          INSERT INTO nigeria_orders (
            id,
            customer_id,
            customer_name,
            customer_email,
            customer_phone,
            shipping_address,
            city,
            state,
            postal_code,
            country,
            currency,
            subtotal,
            shipping_fee,
            discount,
            total,
            supplier_cost_total,
            shipping_cost_total,
            other_cost_total,
            profit,
            profit_margin,
            payment_status,
            settlement_status,
            order_status,
            payment_provider,
            flutterwave_transaction_id,
            flutterwave_reference,
            supplier_name,
            supplier_order_reference,
            tracking_number,
            estimated_delivery,
            created_at,
            updated_at
          )
          VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?,
            'Nigeria',
            'NGN',
            ?, ?, ?, ?, ?, ?, ?, ?, ?,
            'pending',
            'pending',
            'payment_pending',
            'flutterwave',
            NULL,
            NULL,
            ?,
            NULL,
            NULL,
            ?,
            ?,
            ?
          )
        `,
      ).run(
        orderId,
        customer.id,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        city,
        state,
        postalCode,
        subtotal,
        shippingFee,
        discount,
        total,
        supplierCostTotal,
        shippingCostTotal,
        otherCostTotal,
        profit,
        profitMargin,
        settings.supplier_name || null,
        settings.delivery_estimate || null,
        now,
        now,
      );

      const insertItem =
        db.prepare(
          `
            INSERT INTO nigeria_order_items (
              id,
              order_id,
              product_id,
              product_name,
              quantity,
              selling_price,
              supplier_cost,
              shipping_cost,
              other_cost,
              subtotal,
              profit
            )
            VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
          `,
        );

      for (const item of orderItems) {
        insertItem.run(
          createNigeriaId("NGOI"),
          orderId,
          item.product.id,
          item.product.name,
          item.quantity,
          item.product.price,
          item.supplierCost,
          item.shippingCost,
          item.otherCost,
          item.subtotal,
          item.profit,
        );
      }
    });

    transaction();

    const order = db
      .prepare(
        `
          SELECT *
          FROM nigeria_orders
          WHERE id = ?
          LIMIT 1
        `,
      )
      .get(orderId);

    return c.json(
      {
        success: true,
        data: order,
      },
      201,
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create Nigeria order.",
      },
      400,
    );
  }
});

/* -------------------------------------------------------------------------- */
/* Customers                                                                  */
/* -------------------------------------------------------------------------- */

nigeria.get("/customers", (c) => {
  const customers = db
    .prepare(
      `
        SELECT *
        FROM nigeria_customers
        ORDER BY created_at DESC
      `,
    )
    .all();

  return c.json({
    success: true,
    data: customers,
  });
});

/* -------------------------------------------------------------------------- */
/* Inventory                                                                  */
/* -------------------------------------------------------------------------- */

nigeria.get("/inventory", (c) => {
  const inventory = db
    .prepare(
      `
        SELECT
          p.id,
          p.name,
          p.category,
          p.active,
          COALESCE(
            i.quantity,
            p.inventory
          ) AS quantity,
          COALESCE(
            i.reserved_quantity,
            0
          ) AS reserved_quantity,
          COALESCE(
            i.low_stock_threshold,
            p.low_stock_threshold
          ) AS low_stock_threshold
        FROM nigeria_products p
        LEFT JOIN nigeria_inventory i
          ON i.product_id = p.id
        ORDER BY p.name ASC
      `,
    )
    .all();

  return c.json({
    success: true,
    data: inventory,
  });
});

export default nigeria;