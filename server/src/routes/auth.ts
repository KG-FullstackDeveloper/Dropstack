import { Hono } from "hono";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

import { db } from "../database/db";
import { authMiddleware } from "../middleware/auth";

type AdminVariables = {
  adminId: string;
  adminEmail: string;
  adminName: string;
};

const JWT_SECRET =
  process.env.JWT_SECRET || "dropstack-secret-2024";

interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
}

const auth = new Hono<{ Variables: AdminVariables }>();

/*
|--------------------------------------------------------------------------
| POST /api/auth/login
|--------------------------------------------------------------------------
*/

auth.post("/login", async (c) => {
  try {
    const body = await c.req.json<{
      email: string;
      password: string;
    }>();

    if (!body.email?.trim() || !body.password?.trim()) {
      return c.json(
        {
          success: false,
          error: "Email and password are required.",
        },
        400
      );
    }

    const admin = db
      .prepare("SELECT * FROM admin_users WHERE email = ?")
      .get(body.email.trim().toLowerCase()) as AdminUser | undefined;

    if (!admin) {
      return c.json(
        {
          success: false,
          error: "Invalid credentials.",
        },
        401
      );
    }

    const passwordValid = bcryptjs.compareSync(
      body.password,
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
      { expiresIn: "7d" }
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
  } catch {
    return c.json(
      {
        success: false,
        error: "Login failed.",
      },
      500
    );
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/auth/logout
|--------------------------------------------------------------------------
*/

auth.post("/logout", (c) => {
  return c.json({
    success: true,
    message: "Logged out successfully.",
  });
});

/*
|--------------------------------------------------------------------------
| GET /api/auth/me
|--------------------------------------------------------------------------
*/

auth.get("/me", authMiddleware, (c) => {
  const adminId = c.get("adminId") as string;

  const admin = db
    .prepare(
      "SELECT id, email, name, created_at FROM admin_users WHERE id = ?"
    )
    .get(adminId) as
    | { id: string; email: string; name: string; created_at: string }
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
    data: admin,
  });
});

export default auth;
