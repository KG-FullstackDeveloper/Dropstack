import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";

import auth from "./routes/auth";
import products from "./routes/products";
import orders from "./routes/orders";
import checkout from "./routes/checkout";
import admin from "./routes/admin";
import store from "./routes/store";
import analytics from "./routes/analytics";
import visitors from "./routes/visitors";
import businessHealth from "./routes/businessHealth";
import market from "./routes/market";
import ai from "./routes/ai";
import nigeria from "./routes/nigeria";

import { authMiddleware } from "./middleware/auth";

const app = new Hono();

const PORT = Number(
  process.env.PORT || 4000
);

const CLIENT_URL =
  process.env.CLIENT_URL ||
  "http://localhost:5173";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is required. Add it to server/.env before starting the API."
  );
}

app.use(
  "*",
  cors({
    origin: CLIENT_URL,
    allowMethods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowHeaders: [
      "Content-Type",
      "Authorization",
    ],
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.json({
    success: true,
    message:
      "Custom Ecommerce API is running.",
    platform: "MEO Store",
    environment:
      process.env.NODE_ENV ||
      "development",
  });
});

app.get("/api/health", (c) => {
  return c.json({
    success: true,
    data: {
      status: "ok",
      service:
        "custom-ecommerce-api",
      environment:
        process.env.NODE_ENV ||
        "development",
      database: "local",
    },
  });
});

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

app.route(
  "/api/auth",
  auth
);

/*
|--------------------------------------------------------------------------
| Public ecommerce APIs
|--------------------------------------------------------------------------
*/

app.route(
  "/api/products",
  products
);

app.route(
  "/api/checkout",
  checkout
);

app.route(
  "/api/visitors",
  visitors
);

app.route(
  "/api/market",
  market
);

/*
|--------------------------------------------------------------------------
| Protected admin APIs
|--------------------------------------------------------------------------
*/

app.use(
  "/api/admin/*",
  authMiddleware
);

app.use(
  "/api/orders/*",
  authMiddleware
);

app.use(
  "/api/analytics/*",
  authMiddleware
);

app.use(
  "/api/business-health/*",
  authMiddleware
);

app.use(
  "/api/ai/*",
  authMiddleware
);

app.route(
  "/api/admin",
  admin
);

app.route(
  "/api/orders",
  orders
);

app.route(
  "/api/store",
  store
);

app.route(
  "/api/analytics",
  analytics
);

app.route(
  "/api/business-health",
  businessHealth
);

app.route(
  "/api/ai",
  ai
);

/*
|--------------------------------------------------------------------------
| Nigeria Ecommerce
|--------------------------------------------------------------------------
|
| Completely separate Nigeria workspace.
|
| IMPORTANT:
| Nigeria products/orders/customers/inventory use the nigeria_* tables.
| They do not use the Global products/orders tables.
|
*/

app.route(
  "/api/nigeria",
  nigeria
);

/*
|--------------------------------------------------------------------------
| Errors
|--------------------------------------------------------------------------
*/

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "Route not found.",
      path: c.req.path,
    },
    404
  );
});

app.onError((error, c) => {
  console.error(
    "API ERROR:",
    error
  );

  return c.json(
    {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Internal server error.",
    },
    500
  );
});

console.log("");
console.log(
  "========================================"
);
console.log(
  " Custom Ecommerce API"
);
console.log(
  "========================================"
);
console.log(
  `Server: http://localhost:${PORT}`
);
console.log(
  `Client: ${CLIENT_URL}`
);
console.log(
  "Runtime: Hono + Node.js"
);
console.log(
  "Authentication: enabled"
);
console.log(
  "Nigeria Ecommerce API: enabled"
);
console.log(
  "Status: starting..."
);
console.log(
  "========================================"
);
console.log("");

serve(
  {
    fetch: app.fetch,
    port: PORT,
    hostname: "127.0.0.1",
  },
  (info) => {
    console.log(
      `API server running at http://${info.address}:${info.port}`
    );
  }
);

export default app;