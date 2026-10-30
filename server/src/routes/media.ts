import { createHash } from "node:crypto";
import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

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

  let body: { resourceType?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid media request." }, 400);
  }

  if (body.resourceType !== "image" && body.resourceType !== "video") {
    return c.json(
      { success: false, error: "Choose an image or video upload." },
      400,
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `dropstack/products/${body.resourceType}s`;
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
      resourceType: body.resourceType,
    },
  });
});

export default media;
