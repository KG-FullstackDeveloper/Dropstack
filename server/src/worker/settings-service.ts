import { Hono } from "hono";
import type { WorkerEnvironment } from "./types";
import { workerAuthMiddleware } from "./auth";
import { parseJson } from "./db";

const settingsService = new Hono<WorkerEnvironment>();

settingsService.get("/:workspace", workerAuthMiddleware, async (c) => {
  const workspace = c.req.param("workspace");

  try {
    const row = await c.env.DB.prepare(
      `SELECT workspace, settings, updated_at
         FROM admin_workspace_settings
         WHERE workspace = ?
         LIMIT 1`,
    )
      .bind(workspace)
      .first<{
        workspace: string;
        settings: string | null;
        updated_at: string | null;
      }>();

    const settings = row
      ? parseJson<Record<string, unknown>>(row.settings, {})
      : {};

    return c.json({
      success: true,
      data: {
        workspace,
        settings,
        updated_at: row?.updated_at ?? null,
      },
    });
  } catch (error) {
    console.error("Worker settings read failed:", error);
    return c.json(
      { success: false, error: "Unable to load workspace settings." },
      500,
    );
  }
});

settingsService.patch("/:workspace", workerAuthMiddleware, async (c) => {
  const workspace = c.req.param("workspace");

  try {
    const currentBody = await c.req.json().catch(() => ({}));

    const row = await c.env.DB.prepare(
      `SELECT settings
         FROM admin_workspace_settings
         WHERE workspace = ?
         LIMIT 1`,
    )
      .bind(workspace)
      .first<{ settings: string | null }>();

    const existingSettings = row
      ? parseJson<Record<string, unknown>>(row.settings, {})
      : {};
    const mergedSettings = {
      ...existingSettings,
      ...(currentBody && typeof currentBody === "object" ? currentBody : {}),
    };
    const updatedAt = new Date().toISOString();

    await c.env.DB.prepare(
      `INSERT INTO admin_workspace_settings (workspace, settings, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(workspace) DO UPDATE SET settings = excluded.settings, updated_at = excluded.updated_at`,
    )
      .bind(workspace, JSON.stringify(mergedSettings), updatedAt)
      .run();

    return c.json({
      success: true,
      data: {
        workspace,
        settings: mergedSettings,
        updated_at: updatedAt,
      },
    });
  } catch (error) {
    console.error("Worker settings update failed:", error);
    return c.json(
      { success: false, error: "Unable to update workspace settings." },
      500,
    );
  }
});

export default settingsService;
