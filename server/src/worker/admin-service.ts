import { Hono } from "hono";
import type { WorkerEnvironment, AdminRecord } from "./types";
import { workerAuthMiddleware } from "./auth";

const adminService = new Hono<WorkerEnvironment>();

adminService.get(
  "/profile",
  workerAuthMiddleware,
  async (c) => {
    try {
      const admin = await c.env.DB
        .prepare(
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
  },
);

export default adminService;