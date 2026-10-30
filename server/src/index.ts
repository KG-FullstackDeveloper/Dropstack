import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { serve } from "@hono/node-server";

import auth from "./routes/auth";
import products from "./routes/products";
import inventory from "./routes/inventory";
import orders from "./routes/orders";
import customers from "./routes/customers";
import checkout from "./routes/checkout";
import admin from "./routes/admin";
import store from "./routes/store";
import stores from "./routes/stores";
import analytics from "./routes/analytics";
import visitors from "./routes/visitors";
import businessHealth from "./routes/businessHealth";
import market from "./routes/market";
import ai from "./routes/ai";
import nigeria from "./routes/nigeria";
import settings from "./routes/settings";
import orderConfirmation from "./routes/orderConfirmation";
import contact from "./routes/contact";
import tracking from "./routes/tracking";
import media from "./routes/media";
import discounts from "./routes/discounts";

import { authMiddleware } from "./middleware/auth";
import { rateLimit } from "./middleware/rateLimit";

const app = new Hono();
app.use("*", secureHeaders());

// Limit repeated login attempts.
app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    keyPrefix: "auth-login",
  }),
);

// Limit password-reset requests.
app.use(
  "/api/auth/forgot-password",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    keyPrefix: "auth-forgot-password",
  }),
);

app.use(
  "/api/auth/forgot-password/*",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    keyPrefix: "auth-password-reset",
  }),
);

// Limit repeated checkout submissions.
app.use(
  "/api/checkout",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    keyPrefix: "checkout",
  }),
);

// Limit contact-form spam.
app.use(
  "/api/contact",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    keyPrefix: "contact",
  }),
);

const PORT = Number(process.env.PORT || 4000);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is required. Add it to server/.env before starting the API.",
  );
}

/* --------------------------------------------------
   CORS
-------------------------------------------------- */

app.use(
  "*",
  cors({
    origin: CLIENT_URL,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

/* --------------------------------------------------
   Health checks
-------------------------------------------------- */

app.get("/", (c) => {
  return c.json({
    success: true,
    message: "Custom Ecommerce API is running.",
    platform: "MEO Store",
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/health", (c) => {
  return c.json({
    success: true,
    data: {
      status: "ok",
      service: "custom-ecommerce-api",
      environment: process.env.NODE_ENV || "development",
      database: "local",
    },
  });
});

/* --------------------------------------------------
   Authentication and settings
-------------------------------------------------- */

app.route("/api/auth", auth);
app.route("/api/settings", settings);

/* --------------------------------------------------
   Public ecommerce APIs
-------------------------------------------------- */

app.route("/api/products", products);
app.route("/api/inventory", inventory);
app.route("/api/checkout", checkout);
app.route("/api/discounts", discounts);
app.route("/api/order-confirmation", orderConfirmation);
app.route("/api/visitors", visitors);
app.route("/api/market", market);
app.route("/api/contact", contact);
app.route("/api/tracking", tracking);

/* --------------------------------------------------
   Protected admin APIs
-------------------------------------------------- */
app.use("/api/admin/*", authMiddleware);
app.use("/api/orders/*", authMiddleware);
app.use("/api/customers/*", authMiddleware);
app.use("/api/analytics/*", authMiddleware);
app.use("/api/business-health/*", authMiddleware);
app.use("/api/ai/*", authMiddleware);

/* --------------------------------------------------
   Admin and store routes
-------------------------------------------------- */
// Require authentication for media upload and management routes.
app.route("/api/media", media);
app.route("/api/admin", admin);
app.route("/api/orders", orders);
app.route("/api/customers", customers);

/*
 * Single-store configuration routes.
 * Existing functionality remains unchanged.
 */
app.route("/api/store", store);

/*
 * Multi-store management.
 *
 * Register the real router for both collection URL forms.
 * This supports clients requesting /api/stores or
 * /api/stores/ while retaining the existing handlers
 * and authentication inside routes/stores.ts.
 */
app.route("/api/stores", stores);
app.route("/api/stores/", stores);

app.route("/api/analytics", analytics);
app.route("/api/business-health", businessHealth);
app.route("/api/ai", ai);

/* --------------------------------------------------
   Nigeria ecommerce API
-------------------------------------------------- */

app.route("/api/nigeria", nigeria);

/* --------------------------------------------------
   Not found
-------------------------------------------------- */

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "Route not found.",
      path: c.req.path,
    },
    404,
  );
});

/* --------------------------------------------------
   Centralized error handling
-------------------------------------------------- */

app.onError((error, c) => {
  // Keep detailed errors in server logs for debugging.
  console.error("API ERROR:", error);

  // Never expose internal details to customers in production.
  const isDevelopment = process.env.NODE_ENV !== "production";

  return c.json(
    {
      success: false,
      error: isDevelopment
        ? error.message
        : "An unexpected server error occurred. Please try again.",
    },
    500,
  );
});
/* --------------------------------------------------
   Start server
-------------------------------------------------- */

console.log("");
console.log("========================================");
console.log(" Custom Ecommerce API");
console.log("========================================");
console.log(`Server: http://localhost:${PORT}`);
console.log(`Client: ${CLIENT_URL}`);
console.log("Runtime: Hono + Node.js");
console.log("Authentication: enabled");
console.log("Global Customers API: enabled");
console.log("Nigeria Ecommerce API: enabled");
console.log("Stores API: enabled");
console.log("Status: starting...");
console.log("========================================");
console.log("");

serve(
  {
    fetch: app.fetch,
    port: PORT,
    hostname: "127.0.0.1",
  },
  (info) => {
    console.log(`API server running at http://${info.address}:${info.port}`);
  },
);

export default app;
