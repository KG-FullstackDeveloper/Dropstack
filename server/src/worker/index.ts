import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import routes from "./routes";
import { ensureD1Schema } from "./migrations";
import type { WorkerEnvironment } from "./types";

const app = new Hono<WorkerEnvironment>();
let schemaInitializationPromise: Promise<void> | null = null;

app.use("/api/*", async (c, next) => {
  if (!schemaInitializationPromise) {
    schemaInitializationPromise = ensureD1Schema(c.env.DB).catch((error) => {
      console.error("D1 schema initialization failed:", error);
      throw error;
    });
  }

  await schemaInitializationPromise;
  await next();
});

app.use("*", secureHeaders());
app.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      const allowedOrigin = c.env.CLIENT_URL;
      return origin && allowedOrigin && origin === allowedOrigin
        ? origin
        : allowedOrigin || "https://dropstack-global.pages.dev";
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.get("/", (c) =>
  c.json({
    success: true,
    message: "Dropstack Cloudflare Worker API is running.",
    platform: "MEO Store",
    runtime: "cloudflare-workers",
  }),
);

app.get("/api/health", async (c) => {
  try {
    await c.env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    return c.json({
      success: true,
      data: {
        status: "ok",
        service: "custom-ecommerce-api-worker",
        environment: c.env.ENVIRONMENT || "production",
        database: "d1",
      },
    });
  } catch {
    return c.json(
      {
        success: false,
        data: {
          status: "degraded",
          service: "custom-ecommerce-api-worker",
          database: "unavailable",
        },
      },
      503,
    );
  }
});

app.route("/api", routes);

app.notFound((c) =>
  c.json({ success: false, error: "Route not found.", path: c.req.path }, 404),
);

app.onError((error, c) => {
  console.error("Cloudflare Worker API error:", error);
  return c.json({ success: false, error: "Internal server error." }, 500);
});

export default app;
