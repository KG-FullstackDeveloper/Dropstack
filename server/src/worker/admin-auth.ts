import bcrypt from "bcryptjs";
import type { Context } from "hono";
import type { WorkerEnvironment, AdminRecord } from "./types";
import { createWorkerToken } from "./auth";

export async function loginAdmin(c: Context<WorkerEnvironment>) {
  try {
    const body = await c.req.json<{
      email?: string;
      password?: string;
    }>();

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password || password.length > 1024) {
      return c.json(
        { success: false, error: "Email and password are required." },
        400,
      );
    }

    if (email.length > 254) {
      return c.json(
        { success: false, error: "Invalid email or password." },
        401,
      );
    }

    const admin = await c.env.DB.prepare(
      `SELECT id, email, password_hash, name, role
         FROM admin_users
         WHERE LOWER(email) = ?
         LIMIT 1`,
    )
      .bind(email)
      .first<AdminRecord>();

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return c.json(
        { success: false, error: "Invalid email or password." },
        401,
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
      { sub: admin.id, email: admin.email },
      secret,
    );

    return c.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name ?? null,
          role: admin.role ?? null,
        },
      },
    });
  } catch (error) {
    console.error("Worker admin login failed:", error);

    return c.json(
      { success: false, error: "Unable to sign in right now." },
      500,
    );
  }
}

export async function signupAdmin(c: Context<WorkerEnvironment>) {
  try {
    const body = await c.req.json<{
      name?: string;
      email?: string;
      password?: string;
    }>();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const allowedOwnerEmail = (
      c.env.OWNER_EMAIL || "toxicfullstackdeveloper@gmail.com"
    )
      .trim()
      .toLowerCase();

    if (!email || !password) {
      return c.json(
        { success: false, error: "Email and password are required." },
        400,
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json(
        { success: false, error: "Please provide a valid email address." },
        400,
      );
    }

    if (email !== allowedOwnerEmail) {
      return c.json(
        {
          success: false,
          error: "This signup is restricted to the platform owner email only.",
        },
        403,
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
      `SELECT id FROM admin_users WHERE LOWER(email) = ? LIMIT 1`,
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
    const id = `admin_${globalThis.crypto.randomUUID()}`;
    const passwordHash = await bcrypt.hash(password, 12);

    await c.env.DB.prepare(
      `INSERT INTO admin_users (
        id,
        email,
        password_hash,
        name,
        phone,
        role,
        two_factor_enabled,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        email,
        passwordHash,
        name || email.split("@")[0],
        null,
        "platform_owner",
        0,
        now,
        now,
      )
      .run();

    const secret = c.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      return c.json(
        { success: false, error: "Authentication is not configured." },
        503,
      );
    }

    const token = await createWorkerToken({ sub: id, email }, secret);

    return c.json({
      success: true,
      data: {
        token,
        admin: {
          id,
          email,
          name: name || email.split("@")[0],
          role: "platform_owner",
        },
      },
    });
  } catch (error) {
    console.error("Worker admin signup failed:", error);
    return c.json(
      { success: false, error: "Unable to create your account right now." },
      500,
    );
  }
}
