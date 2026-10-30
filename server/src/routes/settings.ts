
import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { db } from "../database/db";
import { validateShippingSettings } from "../services/shippingService";

const settings = new Hono();

settings.use("*", authMiddleware);

type Workspace = "global" | "nigeria";

interface WorkspaceSettingsRow {
  workspace: Workspace;
  settings: string;
  updated_at: string;
}

function normalizeWorkspace(value: unknown): Workspace | null {
  if (value === "global" || value === "nigeria") {
    return value;
  }

  return null;
}

function getRow(workspace: Workspace): WorkspaceSettingsRow | undefined {
  return db
    .prepare(
      `SELECT workspace, settings, updated_at
       FROM admin_workspace_settings
       WHERE workspace = ?
       LIMIT 1`,
    )
    .get(workspace) as WorkspaceSettingsRow | undefined;
}

function parseSettings(value: string | undefined): Record<string, unknown> {
  if (!value) return {};

  try {
    const parsed: unknown = JSON.parse(value);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

settings.get("/:workspace", (c) => {
  const workspace = normalizeWorkspace(c.req.param("workspace"));

  if (!workspace) {
    return c.json(
      {
        success: false,
        message: "Invalid workspace. Use global or nigeria.",
      },
      400,
    );
  }

  try {
    const row = getRow(workspace);
    const parsedSettings = parseSettings(row?.settings);

    return c.json({
      success: true,
      workspace,
      settings: parsedSettings,
      updated_at: row?.updated_at ?? null,
    });
  } catch (error) {
    console.error("Failed to load workspace settings:", error);

    return c.json(
      {
        success: false,
        message: "Failed to load settings.",
      },
      500,
    );
  }
});

settings.patch("/:workspace", async (c) => {
  const workspace = normalizeWorkspace(c.req.param("workspace"));

  if (!workspace) {
    return c.json(
      {
        success: false,
        message: "Invalid workspace. Use global or nigeria.",
      },
      400,
    );
  }

  try {
    const body: unknown = await c.req.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return c.json(
        {
          success: false,
          message: "Request body must be an object.",
        },
        400,
      );
    }

    const incoming = body as Record<string, unknown>;
    const incomingSettings = incoming.settings;

    if (
      !incomingSettings ||
      typeof incomingSettings !== "object" ||
      Array.isArray(incomingSettings)
    ) {
      return c.json(
        {
          success: false,
          message: "The settings field must be an object.",
        },
        400,
      );
    }

    const currentRow = getRow(workspace);
    const currentSettings = parseSettings(currentRow?.settings);

    const mergedSettings: Record<string, unknown> = {
      ...currentSettings,
      ...(incomingSettings as Record<string, unknown>),
    };

    // Validate shipping configuration before it reaches the database.
    // Other existing workspace settings remain preserved.
    if (Object.prototype.hasOwnProperty.call(mergedSettings, "shipping")) {
      try {
        mergedSettings.shipping = validateShippingSettings(
          mergedSettings.shipping,
        );
      } catch (error) {
        return c.json(
          {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Invalid shipping settings.",
          },
          400,
        );
      }
    }

    const updatedAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO admin_workspace_settings (workspace, settings, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(workspace)
       DO UPDATE SET
         settings = excluded.settings,
         updated_at = excluded.updated_at`,
    ).run(workspace, JSON.stringify(mergedSettings), updatedAt);

    return c.json({
      success: true,
      workspace,
      settings: mergedSettings,
      updated_at: updatedAt,
    });
  } catch (error) {
    console.error("Failed to save workspace settings:", error);

    return c.json(
      {
        success: false,
        message: "Failed to save settings.",
      },
      500,
    );
  }
});

export default settings;
