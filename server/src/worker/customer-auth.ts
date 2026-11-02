import bcrypt from "bcryptjs";
import type { Context } from "hono";
import type { WorkerEnvironment } from "./types";
import { createWorkerToken, verifyWorkerToken } from "./auth";

export async function registerCustomer(c: Context<WorkerEnvironment>) {
  try {
    const rawBody = (await c.req
      .json<{
        name?: string;
        email?: string;
        password?: string;
        company?: string | null;
      }>()
      .catch(() => ({}))) as {
      name?: string;
      email?: string;
      password?: string;
      company?: string | null;
    };

    const name = typeof rawBody.name === "string" ? rawBody.name.trim() : "";
    const email =
      typeof rawBody.email === "string"
        ? rawBody.email.trim().toLowerCase()
        : "";
    const password =
      typeof rawBody.password === "string" ? rawBody.password : "";
    const company =
      typeof rawBody.company === "string" ? rawBody.company.trim() : null;

    if (!name || !email || !password) {
      return c.json(
        { success: false, error: "Name, email and password are required." },
        400,
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json(
        { success: false, error: "Please provide a valid email address." },
        400,
      );
    }

    if (password.length < 8) {
      return c.json(
        {
          success: false,
          error: "Password must contain at least 8 characters.",
        },
        400,
      );
    }

    const existing = await c.env.DB.prepare(
      "SELECT id FROM platform_customers WHERE LOWER(email) = ? LIMIT 1",
    )
      .bind(email)
      .first<{ id: string }>();

    if (existing) {
      return c.json(
        { success: false, error: "An account with this email already exists." },
        409,
      );
    }

    const secret = c.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      return c.json(
        { success: false, error: "Authentication is not configured." },
        503,
      );
    }

    const now = new Date().toISOString();
    const id = `customer_${globalThis.crypto.randomUUID()}`;
    const passwordHash = await bcrypt.hash(password, 12);

    await c.env.DB.prepare(
      `INSERT INTO platform_customers (
        id,
        name,
        email,
        company,
        password_hash,
        plan,
        role,
        status,
        subscription_expires_at,
        store_limit,
        stores_used,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    )
      .bind(
        id,
        name,
        email,
        company || null,
        passwordHash,
        "starter",
        "customer",
        "active",
        null,
        1,
        now,
        now,
      )
      .run();

    const token = await createWorkerToken(
      {
        sub: id,
        id,
        email,
        name,
        role: "customer",
      },
      secret,
    );

    return c.json({
      success: true,
      data: {
        token,
        customer: {
          id,
          name,
          email,
          company,
          plan: "starter",
          status: "active",
          role: "customer",
          createdAt: now,
          updatedAt: now,
        },
      },
    });
  } catch (error) {
    console.error("Worker customer registration failed:", error);
    return c.json(
      { success: false, error: "Unable to create your account right now." },
      500,
    );
  }
}

export async function loginCustomer(c: Context<WorkerEnvironment>) {
  try {
    const rawBody = (await c.req
      .json<{
        email?: string;
        password?: string;
      }>()
      .catch(() => ({}))) as {
      email?: string;
      password?: string;
    };

    const email =
      typeof rawBody.email === "string"
        ? rawBody.email.trim().toLowerCase()
        : "";
    const password =
      typeof rawBody.password === "string" ? rawBody.password : "";

    if (!email || !password) {
      return c.json(
        { success: false, error: "Email and password are required." },
        400,
      );
    }

    const customer = await c.env.DB.prepare(
      `SELECT id, email, name, company, password_hash, plan, role, status, store_limit, stores_used, created_at, updated_at
       FROM platform_customers
       WHERE LOWER(email) = ? LIMIT 1`,
    )
      .bind(email)
      .first<{
        id: string;
        email: string;
        name: string | null;
        company: string | null;
        password_hash: string;
        plan: string | null;
        role: string | null;
        status: string | null;
        store_limit: number;
        stores_used: number;
        created_at: string;
        updated_at: string;
      }>();

    if (!customer) {
      return c.json({ success: false, error: "Invalid credentials." }, 401);
    }

    const validPassword = await bcrypt.compare(
      password,
      customer.password_hash,
    );

    if (!validPassword) {
      return c.json({ success: false, error: "Invalid credentials." }, 401);
    }

    if (String(customer.status || "active").toLowerCase() === "suspended") {
      return c.json(
        { success: false, error: "This account has been suspended." },
        403,
      );
    }

    const secret = c.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      return c.json(
        { success: false, error: "Authentication is not configured." },
        503,
      );
    }

    const token = await createWorkerToken(
      {
        sub: customer.id,
        id: customer.id,
        email: customer.email,
        name: customer.name ?? customer.email.split("@")[0],
        role: "customer",
      },
      secret,
    );

    await c.env.DB.prepare(
      `UPDATE platform_customers
       SET last_login_at = ?, updated_at = ?
       WHERE id = ?`,
    )
      .bind(new Date().toISOString(), new Date().toISOString(), customer.id)
      .run();

    return c.json({
      success: true,
      data: {
        token,
        customer: {
          id: customer.id,
          name: customer.name ?? customer.email.split("@")[0],
          email: customer.email,
          company: customer.company,
          plan: customer.plan ?? "starter",
          status: customer.status ?? "active",
          role: "customer",
          storeLimit: Number(customer.store_limit ?? 1),
          storesUsed: Number(customer.stores_used ?? 0),
        },
      },
    });
  } catch (error) {
    console.error("Worker customer login failed:", error);
    return c.json(
      { success: false, error: "Unable to sign in right now." },
      500,
    );
  }
}

export async function getCustomerSession(c: Context<WorkerEnvironment>) {
  const customerId = c.get("customerId");

  const customer = await c.env.DB.prepare(
    `SELECT id, name, email, company, plan, role, status, subscription_expires_at, store_limit, stores_used, created_at, updated_at
     FROM platform_customers
     WHERE id = ? LIMIT 1`,
  )
    .bind(customerId)
    .first<{
      id: string;
      name: string | null;
      email: string;
      company: string | null;
      plan: string | null;
      role: string | null;
      status: string | null;
      subscription_expires_at: string | null;
      store_limit: number;
      stores_used: number;
      created_at: string;
      updated_at: string;
    }>();

  if (!customer) {
    return c.json(
      { success: false, error: "Customer account not found." },
      404,
    );
  }

  if (String(customer.status || "active").toLowerCase() === "suspended") {
    return c.json(
      { success: false, error: "This account has been suspended." },
      403,
    );
  }

  return c.json({
    success: true,
    data: {
      id: customer.id,
      name: customer.name ?? customer.email.split("@")[0],
      email: customer.email,
      company: customer.company,
      plan: customer.plan ?? "starter",
      role: customer.role ?? "customer",
      status: customer.status ?? "active",
      subscriptionExpiresAt: customer.subscription_expires_at,
      storeLimit: Number(customer.store_limit ?? 1),
      storesUsed: Number(customer.stores_used ?? 0),
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
    },
  });
}
