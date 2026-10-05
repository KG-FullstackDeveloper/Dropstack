import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { db } from "../database/db";

const settings = new Hono();
settings.use("*", authMiddleware);

type Workspace = "global" | "nigeria";

function normalizeWorkspace(value: unknown): Workspace | null {
  return value === "nigeria" ? "nigeria" : value === "global" ? "global" : null;
}

function getRow(workspace: Workspace) {
  return db.prepare(`SELECT workspace, settings, updated_at FROM admin_workspace_settings WHERE workspace = ? LIMIT 1`).get(workspace) as { workspace: Workspace; settings: string; updated_at: string } | undefined;
}

settings.get("/:workspace", (c) => {
  const workspace = normalizeWorkspace(c.req.param("workspace"));
  if (!workspace) return c.json({ success: false, error: "Invalid workspace." }, 400);

  const row = getRow(workspace);
  return c.json({
    success: true,
    data: {
      workspace,
      settings: row ? JSON.parse(row.settings) : {},
      updatedAt: row?.updated_at ?? null,
    },
  });
});

settings.patch("/:workspace", async (c) => {
  const workspace = normalizeWorkspace(c.req.param("workspace"));
  if (!workspace) return c.json({ success: false, error: "Invalid workspace." }, 400);

  try {
    const body = await c.req.json<{ settings?: unknown }>();
    if (!body.settings || typeof body.settings !== "object" || Array.isArray(body.settings)) {
      return c.json({ success: false, error: "Settings must be an object." }, 400);
    }

    const existing = getRow(workspace);
    const current = existing ? JSON.parse(existing.settings) as Record<string, unknown> : {};
    const merged = { ...current, ...(body.settings as Record<string, unknown>) };
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO admin_workspace_settings (workspace, settings, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(workspace) DO UPDATE SET
        settings = excluded.settings,
        updated_at = excluded.updated_at
    `).run(workspace, JSON.stringify(merged), now);

    return c.json({
      success: true,
      data: { workspace, settings: merged, updatedAt: now },
    });
  } catch (error) {
    console.error("Workspace settings update error:", error);
    return c.json({ success: false, error: "Unable to save workspace settings." }, 500);
  }
});

export default settings;
