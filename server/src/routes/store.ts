import { Hono } from "hono";

import { storeConfig } from "../data/storeConfig";
import type { StoreConfig } from "../types/store";

const store = new Hono();

store.get("/", (c) => {
  return c.json({
    success: true,
    data: storeConfig,
  });
});

store.put("/", async (c) => {
  try {
    const body =
      await c.req.json<Partial<StoreConfig>>();

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
          error:
            "Store description must be a string.",
        },
        400
      );
    }

    if (body.themeId !== undefined) {
      const validThemes = [
        "meo-default",
        "fashion",
        "commerce",
        "minimal",
        "modern",
      ];

      if (
        !validThemes.includes(
          body.themeId
        )
      ) {
        return c.json(
          {
            success: false,
            error: "Invalid theme.",
          },
          400
        );
      }
    }

    Object.assign(storeConfig, {
      ...body,

      settings: body.settings
        ? {
            ...storeConfig.settings,
            ...body.settings,
          }
        : storeConfig.settings,

      navigation:
        body.navigation ??
        storeConfig.navigation,
    });

    return c.json({
      success: true,
      data: storeConfig,
    });
  } catch {
    return c.json(
      {
        success: false,
        error:
          "Invalid store configuration.",
      },
      400
    );
  }
});

export default store;