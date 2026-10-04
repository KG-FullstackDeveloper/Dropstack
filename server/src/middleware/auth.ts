import type { MiddlewareHandler } from "hono";
import jwt from "jsonwebtoken";

export interface AuthVariables {
  adminId: string;
  adminEmail: string;
  adminName: string;
}

interface AdminJwtPayload {
  id: string;
  email: string;
  name: string;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is required. Configure it in the server environment before starting the API.",
  );
}

export const authMiddleware: MiddlewareHandler<{
  Variables: AuthVariables;
}> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      { success: false, error: "Unauthorized. Missing or invalid Authorization header." },
      401,
    );
  }

  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as AdminJwtPayload;
    c.set("adminId", decoded.id);
    c.set("adminEmail", decoded.email);
    c.set("adminName", decoded.name);
    await next();
  } catch {
    return c.json(
      { success: false, error: "Unauthorized. Invalid or expired token." },
      401,
    );
  }
};
