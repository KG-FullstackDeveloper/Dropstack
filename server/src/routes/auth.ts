import { Hono } from "hono";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

import { db } from "../database/db";
import { authMiddleware, type AuthVariables } from "../middleware/auth";

interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is required. Add a strong JWT_SECRET to server/.env before starting the API."
  );
}

const auth = new Hono<{ Variables: AuthVariables }>();

auth.post("/login", async (c) => {
  try {
    const body = await c.req.json<{
      email?: string;
      password?: string;
    }>();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return c.json(
        {
          success: false,
          error: "Email and password are required.",
        },
        400
      );
    }

    const admin = db
      .prepare(
        `
          SELECT
            id,
            email,
            password_hash,
            name,
            created_at
          FROM admin_users
          WHERE email = ?
          LIMIT 1
        `
      )
      .get(email) as AdminUser | undefined;

    if (!admin) {
      return c.json(
        {
          success: false,
          error: "Invalid credentials.",
        },
        401
      );
    }

    const passwordValid = await bcryptjs.compare(
      password,
      admin.password_hash
    );

    if (!passwordValid) {
      return c.json(
        {
          success: false,
          error: "Invalid credentials.",
        },
        401
      );
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return c.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
        },
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return c.json(
      {
        success: false,
        error: "Login failed.",
      },
      500
    );
  }
});

auth.post("/logout", (c) => {
  return c.json({
    success: true,
    data: {
      message: "Logged out successfully.",
    },
  });
});

auth.get("/me", authMiddleware, (c) => {
  const adminId = c.get("adminId");

  const admin = db
    .prepare(
      `
        SELECT
          id,
          email,
          name,
          created_at
        FROM admin_users
        WHERE id = ?
        LIMIT 1
      `
    )
    .get(adminId) as
    | {
        id: string;
        email: string;
        name: string;
        created_at: string;
      }
    | undefined;

  if (!admin) {
    return c.json(
      {
        success: false,
        error: "Admin user not found.",
      },
      404
    );
  }

  return c.json({
    success: true,
    data: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      createdAt: admin.created_at,
    },
  });
});

export default auth;