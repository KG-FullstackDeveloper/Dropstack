
import { Hono } from "hono";
import type { Context } from "hono";
import type { WorkerEnvironment, AdminRecord } from "./types";
import { workerAuthMiddleware } from "./auth";

const adminService = new Hono<WorkerEnvironment>();

interface PlatformCustomer {
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

interface PlatformSummary {
  customerCount: number;
  activeCustomers: number;
  trialCustomers: number;
  expiredCustomers: number;
  totalStoreCapacity: number;
}

// Only authenticated platform owners can access these routes.
const requirePlatformOwner = async (
  c: Context<WorkerEnvironment>,
  next: () => Promise<void>,
) => {
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

adminService.use("*", workerAuthMiddleware, requirePlatformOwner);

// GET /api/admin/profile
adminService.get("/profile", async (c) => {
  try {
    const admin = await c.env.DB.prepare(
      `SELECT id, email, name, role
       FROM admin_users
       WHERE id = ?
       LIMIT 1`,
    )
      .bind(c.get("adminId"))
      .first<Omit<AdminRecord, "password_hash">>();

    if (!admin) {
      return c.json(
        { success: false, error: "Admin account not found." },
        404,
      );
    }

    return c.json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name ?? null,
        role: admin.role ?? null,
      },
    });
  } catch (error) {
    console.error("Worker admin profile failed:", error);

    return c.json(
      { success: false, error: "Unable to load admin profile." },
      500,
    );
  }
});

// GET /api/admin/platform-owner/summary
adminService.get("/platform-owner/summary", async (c) => {
  try {
    const summary = await c.env.DB.prepare(
      `SELECT
         COUNT(*) AS customerCount,
         COALESCE(SUM(CASE WHEN LOWER(status) = 'active' THEN 1 ELSE 0 END), 0) AS activeCustomers,
         COALESCE(SUM(CASE WHEN LOWER(status) = 'trial' THEN 1 ELSE 0 END), 0) AS trialCustomers,
         COALESCE(SUM(CASE WHEN LOWER(status) = 'expired' THEN 1 ELSE 0 END), 0) AS expiredCustomers,
         COALESCE(SUM(store_limit), 0) AS totalStoreCapacity
       FROM platform_customers`,
    ).first<PlatformSummary>();

    return c.json({
      success: true,
      data: {
        customerCount: Number(summary?.customerCount ?? 0),
        activeCustomers: Number(summary?.activeCustomers ?? 0),
        trialCustomers: Number(summary?.trialCustomers ?? 0),
        expiredCustomers: Number(summary?.expiredCustomers ?? 0),
        totalStoreCapacity: Number(summary?.totalStoreCapacity ?? 0),
      },
    });
  } catch (error) {
    console.error("Platform owner summary failed:", error);

    return c.json(
      { success: false, error: "Unable to load platform summary." },
      500,
    );
  }
});

// GET /api/admin/platform-owner/customers
adminService.get("/platform-owner/customers", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT
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
       ORDER BY created_at DESC`,
    ).all<PlatformCustomer>();

    return c.json({
      success: true,
      data: result.results ?? [],
    });
  } catch (error) {
    console.error("Platform owner customer list failed:", error);

    return c.json(
      { success: false, error: "Unable to load customer accounts." },
      500,
    );
  }
});

// POST /api/admin/platform-owner/customers
adminService.post("/platform-owner/customers", async (c) => {
  try {
    const body = await c.req.json<{
      name?: string;
      email?: string;
      company?: string | null;
      plan?: string;
      status?: string;
      subscriptionExpiresAt?: string | null;
      storeLimit?: number;
    }>();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const company =
      typeof body.company === "string" && body.company.trim()
        ? body.company.trim()
        : null;

    const plan = String(body.plan || "starter").trim().toLowerCase();
    const status = String(body.status || "active").trim().toLowerCase();

    const allowedPlans = ["starter", "growth", "scale"];
    const allowedStatuses = ["active", "trial", "expired"];

    const storeLimit = Number(body.storeLimit ?? 1);

    const subscriptionExpiresAt =
      typeof body.subscriptionExpiresAt === "string" &&
      body.subscriptionExpiresAt.trim()
        ? body.subscriptionExpiresAt.trim()
        : null;

    if (!name || !email) {
      return c.json(
        { success: false, error: "Customer name and email are required." },
        400,
      );
    }

    if (name.length > 150 || email.length > 254 || (company && company.length > 200)) {
      return c.json(
        { success: false, error: "One or more customer fields are too long." },
        400,
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json(
        { success: false, error: "Please provide a valid email address." },
        400,
      );
    }

    if (!allowedPlans.includes(plan)) {
      return c.json(
        { success: false, error: "Please select a valid customer plan." },
        400,
      );
    }

    if (!allowedStatuses.includes(status)) {
      return c.json(
        { success: false, error: "Please select a valid customer status." },
        400,
      );
    }

    if (
      !Number.isInteger(storeLimit) ||
      storeLimit < 1 ||
      storeLimit > 1000
    ) {
      return c.json(
        { success: false, error: "Store limit must be between 1 and 1000." },
        400,
      );
    }

    if (
      subscriptionExpiresAt &&
      Number.isNaN(Date.parse(subscriptionExpiresAt))
    ) {
      return c.json(
        { success: false, error: "Please provide a valid subscription expiry date." },
        400,
      );
    }

    const existing = await c.env.DB.prepare(
      `SELECT id
       FROM platform_customers
       WHERE LOWER(email) = ?
       LIMIT 1`,
    )
      .bind(email)
      .first<{ id: string }>();

    if (existing) {
      return c.json(
        {
          success: false,
          error: "A platform customer with this email already exists.",
        },
        409,
      );
    }

    const now = new Date().toISOString();
    const id = `pc_${globalThis.crypto.randomUUID()}`;

    await c.env.DB.prepare(
      `INSERT INTO platform_customers (
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
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        name,
        email,
        company,
        plan,
        status,
        subscriptionExpiresAt,
        storeLimit,
        0,
        now,
        now,
      )
      .run();

    const created = await c.env.DB.prepare(
      `SELECT
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
       LIMIT 1`,
    )
      .bind(id)
      .first<PlatformCustomer>();

    if (!created) {
      return c.json(
        { success: false, error: "Customer was created but could not be retrieved." },
        500,
      );
    }

    return c.json(
      {
        success: true,
        data: created,
      },
      201,
    );
  } catch (error) {
    console.error("Platform owner customer creation failed:", error);

    const message =
      error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes("unique") || message.includes("constraint")) {
      return c.json(
        {
          success: false,
          error: "A platform customer with this email already exists.",
        },
        409,
      );
    }

    return c.json(
      { success: false, error: "Unable to create the customer account." },
      500,
    );
  }
});

export default adminService;
