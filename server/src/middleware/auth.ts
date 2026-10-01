import type { MiddlewareHandler } from "hono";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "dropstack-secret-2024";

export interface AdminJwtPayload {
  id: string;
  email: string;
  name: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authMiddleware: MiddlewareHandler<any> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      {
        success: false,
        error: "Unauthorized. Missing or invalid Authorization header.",
      },
      401
    );
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET
    ) as AdminJwtPayload;

    c.set("adminId", decoded.id);
    c.set("adminEmail", decoded.email);
    c.set("adminName", decoded.name);

    await next();
  } catch {
    return c.json(
      {
        success: false,
        error: "Unauthorized. Invalid or expired token.",
      },
      401
    );
  }
};
