
import type { Context } from "hono";
import type { WorkerEnvironment } from "./types";
import { createWorkerToken } from "./auth";
import bcrypt from "bcryptjs";

type CustomerRecord = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  password_hash: string;
  plan: string;
  role: string;
  status: string;
  subscription_expires_at: string | null;
  store_limit: number;
  stores_used: number;
  created_at: string;
  updated_at: string;
};

function getCustomerResponse(customer: CustomerRecord) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    company: customer.company ?? null,
    plan: customer.plan,
    role: customer.role,
    status: customer.status,
    subscriptionExpiresAt: customer.subscription_expires_at ?? null,
    storeLimit: Number(customer.store_limit ?? 1),
    storesUsed: Number(customer.stores_used ?? 0),
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
  };
}

async function createSession(
  customer: CustomerRecord,
  secret: string,
) {
  const token = await createWorkerToken(
    {
      sub: customer.id,
      id: customer.id,
      email: customer.email,
      name: customer.name,
      role: "customer",
    },
    secret,
  );

  return {
    token,
    customer: getCustomerResponse(customer),
  };
}

export async function registerCustomer(
  c: Context<WorkerEnvironment>,
) {
  try {
    const body = await c.req.json<{
      name?: string;
      email?: string;
      password?: string;
      company?: string | null;
    }>();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const company = String(body.company ?? "").trim() || null;

    if (!name || !email || !password) {
      return c.json(
        { success: false, error: "Name, email and password are required." },
        400,
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json(
        { success: false, error: "Enter a valid email address." },
        400,
      );
    }

    if (password.length < 8 || password.length > 128) {
      return c.json(
        { success: false, error: "Password must be between 8 and 128 characters." },
        400,
      );
    }

    if (name.length > 120 || email.length > 254 || (company && company.length > 160)) {
      return c.json(
        { success: false, error: "One or more fields exceed the allowed length." },
        400,
      );
    }

    const secret = c.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      return c.json(
        { success: false, error: "Authentication is not configured." },
        503,
      );
    }

    const existing = await c.env.DB.prepare(
      `SELECT id FROM platform_customers
       WHERE LOWER(email) = ?
       LIMIT 1`,
    )
      .bind(email)
      .first<{ id: string }>();

    if (existing) {
      return c.json(
        { success: false, error: "An account with this email already exists." },
        409,
      );
    }

    const now = new Date().toISOString();
    const id = `customer_${crypto.randomUUID()}`;
    const passwordHash = await bcrypt.hash(password, 12);

    await c.env.DB.prepare(
      `INSERT INTO platform_customers (
        id, name, email, company, password_hash, plan, role,
        status, subscription_expires_at, store_limit, stores_used,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, 'starter', 'customer', 'active', NULL, 1, 0, ?, ?)`,
    )
      .bind(id, name, email, company, passwordHash, now, now)
      .run();

    const customer: CustomerRecord = {
      id,
      name,
      email,
      company,
      password_hash: passwordHash,
      plan: "starter",
      role: "customer",
      status: "active",
      subscription_expires_at: null,
      store_limit: 1,
      stores_used: 0,
      created_at: now,
      updated_at: now,
    };

    const session = await createSession(customer, secret);

    return c.json(
      {
        success: true,
        message: "Your account has been created successfully.",
        data: session,
      },
      201,
    );
  } catch (error) {
    console.error("Customer registration failed:", error);

    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes("unique") || message.includes("constraint")) {
      return c.json(
        { success: false, error: "An account with this email already exists." },
        409,
      );
    }

    return c.json(
      { success: false, error: "Unable to create your account. Please try again." },
      500,
    );
  }
}

export async function loginCustomer(
  c: Context<WorkerEnvironment>,
) {
  try {
    const body = await c.req.json<{
      email?: string;
      password?: string;
    }>();

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return c.json(
        { success: false, error: "Email and password are required." },
        400,
      );
    }

    const secret = c.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      return c.json(
        { success: false, error: "Authentication is not configured." },
        503,
      );
    }

    const customer = await c.env.DB.prepare(
      `SELECT
        id, name, email, company, password_hash, plan, role,
        status, subscription_expires_at, store_limit, stores_used,
        created_at, updated_at
       FROM platform_customers
       WHERE LOWER(email) = ?
       LIMIT 1`,
    )
      .bind(email)
      .first<CustomerRecord>();

    if (!customer || !customer.password_hash) {
      return c.json(
        { success: false, error: "Invalid email or password." },
        401,
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      customer.password_hash,
    );

    if (!passwordMatches) {
      return c.json(
        { success: false, error: "Invalid email or password." },
        401,
      );
    }

    if (
      String(customer.role).toLowerCase() !== "customer" ||
      String(customer.status).toLowerCase() !== "active"
    ) {
      return c.json(
        {
          success: false,
          error: "Your account is currently unavailable. Please contact support.",
        },
        403,
      );
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(
      `UPDATE platform_customers
       SET last_login_at = ?, updated_at = ?
       WHERE id = ?`,
    )
      .bind(now, now, customer.id)
      .run();

    customer.updated_at = now;

    const session = await createSession(customer, secret);

    return c.json({
      success: true,
      message: "Login successful.",
      data: session,
    });
  } catch (error) {
    console.error("Customer login failed:", error);

    return c.json(
      { success: false, error: "Unable to sign in. Please try again." },
      500,
    );
  }
}
