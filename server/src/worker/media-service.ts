import { Hono } from "hono";
import type { WorkerEnvironment } from "./types";
import { workerAuthMiddleware } from "./auth";

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

const normalizePublicId = (value: unknown): string => {
  if (typeof value !== "string") return "";

  const cleaned = value.trim();
  if (!cleaned) return "";

  return cleaned
    .replace(/^\/+/, "")
    .replace(/\\/g, "/")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9/_-]+/g, "-")
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

async function signCloudinaryPayload(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const bytes = new Uint8Array(signature);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const mediaService = new Hono<WorkerEnvironment>();
mediaService.use("*", workerAuthMiddleware);

mediaService.post("/signature", async (c) => {
  const cloudName = (c.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = (c.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = (c.env.CLOUDINARY_API_SECRET || "").trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return c.json(
      {
        success: false,
        error:
          "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET for the worker environment.",
      },
      503,
    );
  }

  let body: {
    resourceType?: unknown;
    resource?: unknown;
    scope?: unknown;
    publicId?: unknown;
  };
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
  const publicId = normalizePublicId(body.publicId);
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadParts = [`folder=${folder}`];

  if (publicId) {
    payloadParts.push(`public_id=${publicId}`);
  }

  payloadParts.push(`timestamp=${timestamp}`);
  const payload = `${payloadParts.join("&")}${apiSecret}`;
  const signature = await signCloudinaryPayload(apiSecret, payload);

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
      ...(publicId ? { publicId } : {}),
    },
  });
});

mediaService.post("/delete", async (c) => {
  const cloudName = (c.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = (c.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = (c.env.CLOUDINARY_API_SECRET || "").trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return c.json(
      {
        success: false,
        error:
          "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET for the worker environment.",
      },
      503,
    );
  }

  let body: {
    publicId?: unknown;
    resourceType?: unknown;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid media request." }, 400);
  }

  const resourceType =
    body.resourceType === "image" || body.resourceType === "video"
      ? body.resourceType
      : null;
  const publicId = normalizePublicId(body.publicId);

  if (!resourceType || !publicId) {
    return c.json(
      {
        success: false,
        error: "Provide a valid Cloudinary resource type and public ID.",
      },
      400,
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = await signCloudinaryPayload(apiSecret, payload);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/destroy`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        public_id: publicId,
        api_key: apiKey,
        timestamp: String(timestamp),
        signature,
      }).toString(),
    },
  );

  const result = (await response.json().catch(() => ({}))) as {
    result?: string;
    error?: { message?: string };
  };

  if (!response.ok || (result.result && result.result !== "ok")) {
    return c.json(
      {
        success: false,
        error:
          result.error?.message ||
          "Cloudinary was unable to delete this asset.",
      },
      500,
    );
  }

  return c.json({
    success: true,
    data: {
      publicId,
      resourceType,
      result: result.result || "ok",
    },
  });
});

export default mediaService;
