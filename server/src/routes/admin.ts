import { Hono } from "hono";

import { db } from "../database/db";
import { getAllOrders } from "../data/store";
import {
  analyticsSeries,
  visitorLocations as analyticsVisitors,
} from "../data/analytics";
import { visitorLocations as trackedVisitors } from "../data/visitors";
import { authMiddleware } from "../middleware/auth";

const admin = new Hono();
admin.use("*", authMiddleware);

const platformOwnerMiddleware = async (c: any, next: () => Promise<void>) => {
  const role = String(c.get("adminRole") || "store_owner");

  if (role !== "platform_owner") {
    return c.json(
      {
        success: false,
        error: "Platform owner access required.",
      },
      403,
    );
  }

  await next();
};

admin.use("/platform-owner/*", platformOwnerMiddleware);

admin.post("/system-reset", async (c) => {
  let body: { workspace?: unknown; confirmation?: unknown };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid reset request." }, 400);
  }

  if (
    body.workspace !== "global" ||
    body.confirmation !== "RESET GLOBAL DATA"
  ) {
    return c.json(
      { success: false, error: "Global reset confirmation is required." },
      400,
    );
  }

  const counts = {
    deletedOrders: Number(
      (
        db.prepare("SELECT COUNT(*) AS count FROM orders").get() as {
          count: number;
        }
      ).count,
    ),
    deletedOrderItems: Number(
      (
        db.prepare("SELECT COUNT(*) AS count FROM order_items").get() as {
          count: number;
        }
      ).count,
    ),
    deletedProducts: Number(
      (
        db.prepare("SELECT COUNT(*) AS count FROM products").get() as {
          count: number;
        }
      ).count,
    ),
    deletedInventoryMovements: Number(
      (
        db
          .prepare("SELECT COUNT(*) AS count FROM inventory_movements")
          .get() as { count: number }
      ).count,
    ),
    removedStores: Number(
      (
        db
          .prepare("SELECT COUNT(*) AS count FROM stores WHERE id != 'default'")
          .get() as { count: number }
      ).count,
    ),
    deletedSupportMessages: Number(
      (
        db.prepare("SELECT COUNT(*) AS count FROM support_messages").get() as {
          count: number;
        }
      ).count,
    ),
  };

  try {
    const now = new Date().toISOString();
    const navigation = JSON.stringify([
      { label: "Home", page: "home", enabled: true },
      { label: "Catalog", page: "catalog", enabled: true },
      { label: "Contact", page: "contact", enabled: true },
      { label: "Cart", page: "cart", enabled: true },
    ]);
    const settings = JSON.stringify({
      showRelatedProducts: true,
      showContactPage: true,
      showCatalogPage: true,
      showCartPage: true,
      showSearch: true,
      showNewsletter: true,
      showTestimonials: true,
      showTrustBadges: true,
      showAnnouncementBar: false,
      stickyHeader: true,
      darkMode: true,
    });

    db.transaction(() => {
      db.prepare("DELETE FROM store_products").run();
      db.prepare("DELETE FROM order_items").run();
      db.prepare("DELETE FROM orders").run();
      db.prepare("DELETE FROM inventory_movements").run();
      db.prepare("DELETE FROM products").run();
      db.prepare("DELETE FROM support_messages").run();
      db.prepare("DELETE FROM store_registry_metadata").run();
      db.prepare("DELETE FROM store_config WHERE id != 'default'").run();
      db.prepare("DELETE FROM stores WHERE id != 'default'").run();
      db.prepare(
        "DELETE FROM admin_workspace_settings WHERE workspace = 'global'",
      ).run();

      db.prepare(
        `
        INSERT OR IGNORE INTO stores
          (id, name, slug, niche, domain, status, created_at, updated_at)
        VALUES ('default', 'MEO Store', 'meo-store', 'General', NULL, 'Active', ?, ?)
      `,
      ).run(now, now);
      db.prepare(
        `
        UPDATE stores
        SET name = 'MEO Store', slug = 'meo-store', niche = 'General',
            domain = NULL, status = 'Active', shipping_fee = NULL,
            delivery_estimate = NULL, updated_at = ?
        WHERE id = 'default'
      `,
      ).run(now);

      db.prepare(
        `
        INSERT OR IGNORE INTO store_config
          (id, name, description, theme_id, navigation, settings,
           primary_color, accent_color, font_family, updated_at)
        VALUES ('default', 'MEO Store', 'A professional ecommerce store.',
                'meo-default', ?, ?, '#0f172a', '#3b82f6', 'Inter', ?)
      `,
      ).run(navigation, settings, now);
      db.prepare(
        `
        UPDATE store_config
        SET name = 'MEO Store', description = 'A professional ecommerce store.',
            logo_url = NULL, favicon_url = NULL, theme_id = 'meo-default',
            navigation = ?, settings = ?, primary_color = '#0f172a',
            accent_color = '#3b82f6', font_family = 'Inter', updated_at = ?
        WHERE id = 'default'
      `,
      ).run(navigation, settings, now);
    })();

    analyticsSeries.splice(0, analyticsSeries.length);
    analyticsVisitors.splice(0, analyticsVisitors.length);
    trackedVisitors.splice(0, trackedVisitors.length);

    return c.json({ success: true, data: counts });
  } catch (error) {
    console.error("Global data reset failed:", error);
    return c.json(
      {
        success: false,
        error: "Global data reset failed. No partial reset was committed.",
      },
      500,
    );
  }
});

/*
|--------------------------------------------------------------------------
| GET /admin/orders
|--------------------------------------------------------------------------
*/

admin.get("/orders", (c) => {
  const orders = getAllOrders();

  return c.json({
    success: true,
    data: orders,
  });
});

/*
|--------------------------------------------------------------------------
| GET /admin/stats
|--------------------------------------------------------------------------
*/

admin.get("/stats", (c) => {
  const totalOrders = (
    db.prepare("SELECT COUNT(*) as count FROM orders").get() as {
      count: number;
    }
  ).count;

  const pendingOrders = (
    db
      .prepare(
        "SELECT COUNT(*) as count FROM orders WHERE order_status = 'payment_pending'",
      )
      .get() as { count: number }
  ).count;

  const confirmedPayments = (
    db
      .prepare(
        "SELECT COUNT(*) as count FROM orders WHERE payment_status = 'confirmed'",
      )
      .get() as { count: number }
  ).count;

  const totalSalesRow = db
    .prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders")
    .get() as { total: number };

  const totalSales = totalSalesRow.total;

  const activeProducts = (
    db
      .prepare("SELECT COUNT(*) as count FROM products WHERE active = 1")
      .get() as { count: number }
  ).count;

  return c.json({
    success: true,
    data: {
      totalOrders,
      pendingOrders,
      confirmedPayments,
      totalSales,
      activeProducts,
    },
  });
});

/*
|--------------------------------------------------------------------------
| GET /admin/customers — aggregate unique customers
|--------------------------------------------------------------------------
*/

admin.get("/customers", (c) => {
  const customers = db
    .prepare(
      `
      SELECT
        customer_email,
        customer_name,
        customer_phone,
        country,
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as total_spend,
        MIN(created_at) as first_order_at,
        MAX(created_at) as last_order_at
      FROM orders
      GROUP BY customer_email
      ORDER BY total_spend DESC
    `,
    )
    .all() as {
    customer_email: string;
    customer_name: string;
    customer_phone: string | null;
    country: string;
    order_count: number;
    total_spend: number;
    first_order_at: string;
    last_order_at: string;
  }[];

  return c.json({
    success: true,
    data: customers,
  });
});

admin.get("/platform-owner/summary", (c) => {
  const totals = db
    .prepare(
      `
      SELECT
        COUNT(*) AS customer_count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_customers,
        SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END) AS trial_customers,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS expired_customers,
        SUM(store_limit) AS total_store_capacity
      FROM platform_customers
    `,
    )
    .get() as {
    customer_count: number;
    active_customers: number;
    trial_customers: number;
    expired_customers: number;
    total_store_capacity: number;
  };

  return c.json({
    success: true,
    data: {
      customerCount: Number(totals.customer_count || 0),
      activeCustomers: Number(totals.active_customers || 0),
      trialCustomers: Number(totals.trial_customers || 0),
      expiredCustomers: Number(totals.expired_customers || 0),
      totalStoreCapacity: Number(totals.total_store_capacity || 0),
    },
  });
});

admin.get("/platform-owner/customers", (c) => {
  const customers = db
    .prepare(
      `
      SELECT
        id,
        name,
        email,
        company,
        plan,
        status,
        subscription_expires_at AS subscriptionExpiresAt,
        store_limit AS storeLimit,
        stores_used AS storesUsed,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM platform_customers
      ORDER BY updated_at DESC, created_at DESC
    `,
    )
    .all() as Array<{
    id: string;
    name: string;
    email: string;
    company: string | null;
    plan: string;
    status: string;
    subscriptionExpiresAt: string | null;
    storeLimit: number;
    storesUsed: number;
    createdAt: string;
    updatedAt: string;
  }>;

  return c.json({ success: true, data: customers });
});

admin.post("/platform-owner/customers", async (c) => {
  const body = (await c.req.json().catch(() => null)) as {
    name?: string;
    email?: string;
    company?: string | null;
    plan?: string;
    status?: string;
    subscriptionExpiresAt?: string | null;
    storeLimit?: number;
  } | null;

  if (!body || !body.name || !body.email) {
    return c.json(
      {
        success: false,
        error: "Customer name and email are required.",
      },
      400,
    );
  }

  const id = `customer-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const plan = body.plan || "starter";
  const status = body.status || "active";
  const storeLimit = Number(body.storeLimit ?? 1);

  try {
    db.prepare(
      `
      INSERT INTO platform_customers (
        id,
        name,
        email,
        company,
        plan,
        status,
        subscription_expires_at,
        store_limit,
        stores_used,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `,
    ).run(
      id,
      body.name.trim(),
      body.email.trim().toLowerCase(),
      body.company?.trim() || null,
      plan,
      status,
      body.subscriptionExpiresAt || null,
      Number.isFinite(storeLimit) ? storeLimit : 1,
      createdAt,
      createdAt,
    );

    const customer = db
      .prepare(
        `
        SELECT
          id,
          name,
          email,
          company,
          plan,
          status,
          subscription_expires_at AS subscriptionExpiresAt,
          store_limit AS storeLimit,
          stores_used AS storesUsed,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM platform_customers
        WHERE id = ?
      `,
      )
      .get(id) as
      | {
          id: string;
          name: string;
          email: string;
          company: string | null;
          plan: string;
          status: string;
          subscriptionExpiresAt: string | null;
          storeLimit: number;
          storesUsed: number;
          createdAt: string;
          updatedAt: string;
        }
      | undefined;

    return c.json({ success: true, data: customer });
  } catch (error) {
    console.error("Failed to create platform customer:", error);
    return c.json(
      {
        success: false,
        error: "Customer account could not be created.",
      },
      400,
    );
  }
});

admin.patch("/platform-owner/customers/:id", async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => null)) as {
    name?: string;
    email?: string;
    company?: string | null;
    plan?: string;
    status?: string;
    subscriptionExpiresAt?: string | null;
    storeLimit?: number;
  } | null;

  if (!body) {
    return c.json({ success: false, error: "Invalid customer update." }, 400);
  }

  const existing = db
    .prepare("SELECT id FROM platform_customers WHERE id = ?")
    .get(id) as { id: string } | undefined;

  if (!existing) {
    return c.json({ success: false, error: "Customer not found." }, 404);
  }

  const current = db
    .prepare(
      `
      SELECT
        name,
        email,
        company,
        plan,
        status,
        subscription_expires_at,
        store_limit,
        stores_used
      FROM platform_customers
      WHERE id = ?
      `,
    )
    .get(id) as
    | {
        name: string;
        email: string;
        company: string | null;
        plan: string;
        status: string;
        subscription_expires_at: string | null;
        store_limit: number;
        stores_used: number;
      }
    | undefined;

  const nextName = body.name?.trim() || current?.name || "";
  const nextEmail = (body.email || current?.email || "").trim().toLowerCase();
  const nextCompany = body.company?.trim() || current?.company || null;
  const nextPlan = body.plan || current?.plan || "starter";
  const nextStatus = body.status || current?.status || "active";
  const nextExpiresAt =
    body.subscriptionExpiresAt ?? current?.subscription_expires_at ?? null;
  const nextStoreLimit = Number(body.storeLimit ?? current?.store_limit ?? 1);

  db.prepare(
    `
    UPDATE platform_customers
    SET name = ?, email = ?, company = ?, plan = ?, status = ?,
        subscription_expires_at = ?, store_limit = ?, updated_at = ?
    WHERE id = ?
    `,
  ).run(
    nextName,
    nextEmail,
    nextCompany,
    nextPlan,
    nextStatus,
    nextExpiresAt,
    Number.isFinite(nextStoreLimit) ? nextStoreLimit : 1,
    new Date().toISOString(),
    id,
  );

  const customer = db
    .prepare(
      `
      SELECT
        id,
        name,
        email,
        company,
        plan,
        status,
        subscription_expires_at AS subscriptionExpiresAt,
        store_limit AS storeLimit,
        stores_used AS storesUsed,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM platform_customers
      WHERE id = ?
    `,
    )
    .get(id) as
    | {
        id: string;
        name: string;
        email: string;
        company: string | null;
        plan: string;
        status: string;
        subscriptionExpiresAt: string | null;
        storeLimit: number;
        storesUsed: number;
        createdAt: string;
        updatedAt: string;
      }
    | undefined;

  return c.json({ success: true, data: customer });
});

/* --------------------------------------------------------------------------
   GET /admin/support-messages — Global Ecommerce support inbox
   The admin router is protected by authMiddleware above.
-------------------------------------------------------------------------- */

admin.get("/support-messages", (c) => {
  const status = c.req.query("status");
  const allowedStatuses = ["new", "in_review", "resolved"];

  let messages;
  if (status && allowedStatuses.includes(status)) {
    messages = db
      .prepare(
        `
      SELECT id, name, email, subject, message, status, created_at
      FROM support_messages
      WHERE status = ?
      ORDER BY created_at DESC
      LIMIT 300
    `,
      )
      .all(status);
  } else {
    messages = db
      .prepare(
        `
      SELECT id, name, email, subject, message, status, created_at
      FROM support_messages
      ORDER BY created_at DESC
      LIMIT 300
    `,
      )
      .all();
  }

  return c.json({ success: true, data: messages });
});

/* --------------------------------------------------------------------------
   PATCH /admin/support-messages/:id — update a message's review status
-------------------------------------------------------------------------- */

admin.patch("/support-messages/:id", async (c) => {
  const id = c.req.param("id");
  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid request body." }, 400);
  }

  const status =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).status
      : undefined;
  const allowedStatuses = ["new", "in_review", "resolved"];

  if (typeof status !== "string" || !allowedStatuses.includes(status)) {
    return c.json(
      { success: false, error: "Choose a valid support status." },
      400,
    );
  }

  const result = db
    .prepare(
      `
    UPDATE support_messages SET status = ? WHERE id = ?
  `,
    )
    .run(status, id);

  if (result.changes === 0) {
    return c.json({ success: false, error: "Support message not found." }, 404);
  }

  const message = db
    .prepare(
      `
    SELECT id, name, email, subject, message, status, created_at
    FROM support_messages WHERE id = ?
  `,
    )
    .get(id);

  return c.json({ success: true, data: message });
});

export default admin;
