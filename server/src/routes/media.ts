import { createHash } from "node:crypto";
import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

export type CloudinaryResourceType = "image" | "video";

const normalizeResourceValue = (value: unknown): string => {
  if (typeof value !== "string") return "products";

  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return "products";

  return cleaned
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/\/+$/g, "")
    .replace(/\/{2,}/g, "/")
    .replace(/^\./, "");
};

export function buildCloudinaryFolder(
  resource: unknown,
  resourceType: CloudinaryResourceType,
): string {
  const scope = normalizeResourceValue(resource);
  const suffix = resourceType === "image" ? "images" : "videos";

  return `dropstack/${scope}/${suffix}`;
}

const media = new Hono();
media.use("*", authMiddleware);

media.post("/signature", async (c) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return c.json(
      {
        success: false,
        error:
          "Cloudinary is not configured. Set its cloud name, API key, and API secret in server/.env.",
      },
      503,
    );
  }

  let body: { resourceType?: unknown; resource?: unknown; scope?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid media request." }, 400);
  }

  const resourceType =
    body.resourceType === "image" || body.resourceType === "video"
      ? body.resourceType
      : null;

  if (!resourceType) {
    return c.json(
      { success: false, error: "Choose an image or video upload." },
      400,
    );
  }

  const scope = normalizeResourceValue(
    body.resource ?? body.scope ?? "products",
  );
  const folder = buildCloudinaryFolder(scope, resourceType);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  return c.json({
    success: true,
    data: {
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
      resourceType,
      scope,
    },
  });
});

export default media;
