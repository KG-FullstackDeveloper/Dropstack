import { Hono } from "hono";

import { db } from "../database/db";
import type {
  StoreConfig,
  StoreThemeId,
  StoreNavigationItem,
  StoreThemeSettings,
} from "../types/store";

const store = new Hono();

interface StoreConfigRow {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  theme_id: string;
  navigation: string;
  settings: string;
  primary_color: string;
  accent_color: string;
  font_family: string;
  updated_at: string;
}

function rowToStoreConfig(row: StoreConfigRow): StoreConfig {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    logoUrl: row.logo_url,
    faviconUrl: row.favicon_url,
    themeId: row.theme_id as StoreThemeId,
    navigation: JSON.parse(row.navigation) as StoreNavigationItem[],
    settings: JSON.parse(row.settings) as StoreThemeSettings,
    primaryColor: row.primary_color,
    accentColor: row.accent_color,
    fontFamily: row.font_family,
  };
}

store.get("/", (c) => {
  const row = db
    .prepare("SELECT * FROM store_config WHERE id = 'default'")
    .get() as StoreConfigRow | undefined;

  if (!row) {
    return c.json(
      {
        success: false,
        error: "Store configuration not found.",
      },
      404
    );
  }

  return c.json({
    success: true,
    data: rowToStoreConfig(row),
  });
});

store.put("/", async (c) => {
  try {
    const body = await c.req.json<Partial<StoreConfig>>();

    if (
      body.name !== undefined &&
      typeof body.name !== "string"
    ) {
      return c.json(
        {
          success: false,
          error: "Store name must be a string.",
        },
        400
      );
    }

    if (
      body.description !== undefined &&
      typeof body.description !== "string"
    ) {
      return c.json(
        {
          success: false,
          error: "Store description must be a string.",
        },
        400
      );
    }

    if (body.themeId !== undefined) {
      const validThemes: StoreThemeId[] = [
        "meo-default",
        "fashion",
        "commerce",
        "minimal",
        "modern",
      ];

      if (!validThemes.includes(body.themeId)) {
        return c.json(
          {
            success: false,
            error: "Invalid theme.",
          },
          400
        );
      }
    }

    const existing = db
      .prepare("SELECT * FROM store_config WHERE id = 'default'")
      .get() as StoreConfigRow | undefined;

    if (!existing) {
      return c.json(
        {
          success: false,
          error: "Store configuration not found.",
        },
        404
      );
    }

    const currentConfig = rowToStoreConfig(existing);
    const now = new Date().toISOString();

    const updatedSettings = body.settings
      ? { ...currentConfig.settings, ...body.settings }
      : currentConfig.settings;

    const updatedNavigation =
      body.navigation ?? currentConfig.navigation;

    db.prepare(`
      UPDATE store_config SET
        name = @name,
        description = @description,
        logo_url = @logo_url,
        favicon_url = @favicon_url,
        theme_id = @theme_id,
        navigation = @navigation,
        settings = @settings,
        primary_color = @primary_color,
        accent_color = @accent_color,
        font_family = @font_family,
        updated_at = @updated_at
      WHERE id = 'default'
    `).run({
      name: body.name ?? currentConfig.name,
      description: body.description ?? currentConfig.description,
      logo_url: body.logoUrl !== undefined ? body.logoUrl : currentConfig.logoUrl,
      favicon_url:
        body.faviconUrl !== undefined
          ? body.faviconUrl
          : currentConfig.faviconUrl,
      theme_id: body.themeId ?? currentConfig.themeId,
      navigation: JSON.stringify(updatedNavigation),
      settings: JSON.stringify(updatedSettings),
      primary_color: body.primaryColor ?? currentConfig.primaryColor,
      accent_color: body.accentColor ?? currentConfig.accentColor,
      font_family: body.fontFamily ?? currentConfig.fontFamily,
      updated_at: now,
    });

    const updatedRow = db
      .prepare("SELECT * FROM store_config WHERE id = 'default'")
      .get() as StoreConfigRow;

    return c.json({
      success: true,
      data: rowToStoreConfig(updatedRow),
    });
  } catch {
    return c.json(
      {
        success: false,
        error: "Invalid store configuration.",
      },
      400
    );
  }
});

export default store;
