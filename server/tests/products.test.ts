import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const testDirectory = mkdtempSync(path.join(tmpdir(), "dropstack-products-"));
process.env.DATABASE_PATH = path.join(testDirectory, "test.db");
process.env.JWT_SECRET = "test-only-secret-with-more-than-32-characters";
process.env.OWNER_EMAIL = "test@example.invalid";
process.env.OWNER_PASSWORD = "test-only-password-123";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_API_SECRET = "test-api-secret";

const [
  { db },
  { default: products },
  { default: orders },
  { default: checkout },
  { default: stores },
  { default: admin },
  { default: inventory },
  { default: media },
  { convertCurrency, updateCurrencyRates },
  jwt,
] = await Promise.all([
  import("../src/database/db.ts"),
  import("../src/routes/products.ts"),
  import("../src/routes/orders.ts"),
  import("../src/routes/checkout.ts"),
  import("../src/routes/stores.ts"),
  import("../src/routes/admin.ts"),
  import("../src/routes/inventory.ts"),
  import("../src/routes/media.ts"),
  import("../../client/src/utils/currency.ts"),
  import("jsonwebtoken"),
]);

const createdAt = new Date().toISOString();
const insertProduct = db.prepare(`
  INSERT INTO products (
    id, name, slug, description, category, price, currency,
    supplier_cost, supplier_product_id, sku, active, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertProduct.run(
  "test-global-product",
  "Global test product",
  "global-test-product",
  "A public description",
  "Accessories",
  25,
  "USD",
  8,
  "private-global-supplier-id",
  "PRIVATE-GLOBAL-SKU",
  1,
  createdAt,
);

insertProduct.run(
  "test-store-product",
  "Store-only test product",
  "store-test-product",
  "A private store description",
  "Accessories",
  30,
  "USD",
  10,
  "private-store-supplier-id",
  "PRIVATE-STORE-SKU",
  1,
  createdAt,
);

db.prepare(
  `
  UPDATE products
  SET images = ?, variants = ?, delivery_time = ?
  WHERE id = ?
`,
).run(
  JSON.stringify([
    "https://example.invalid/one.jpg",
    "https://example.invalid/two.jpg",
  ]),
  JSON.stringify([
    {
      id: "variant-black",
      name: "Color",
      value: "Black",
      price: "30",
      sku: "BLK",
      stock: "4",
    },
  ]),
  "7-12 business days",
  "test-store-product",
);

db.prepare(
  `
  INSERT INTO store_products (store_id, product_id, created_at)
  VALUES (?, ?, ?)
`,
).run("default", "test-store-product", createdAt);

db.prepare(
  `
  INSERT INTO orders (
    id, customer_name, customer_email, shipping_address, country,
    currency, total, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
).run(
  "test-review-order",
  "Test Customer",
  "customer@example.invalid",
  "1 Test Street",
  "US",
  "USD",
  25,
  createdAt,
  createdAt,
);

db.prepare(
  `
  INSERT INTO inventory_movements (
    id, product_id, previous_stock, change_amount, new_stock, reason, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`,
).run(
  "test-inventory-movement",
  "test-global-product",
  4,
  -1,
  3,
  "Test adjustment",
  createdAt,
);

db.prepare(
  `
  INSERT INTO orders (
    id, customer_name, customer_email, shipping_address, country,
    currency, total, payment_status, order_status, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
).run(
  "test-paid-order",
  "Paid Test Customer",
  "paid@example.invalid",
  "2 Test Street",
  "US",
  "USD",
  30,
  "confirmed",
  "payment_confirmed",
  createdAt,
  createdAt,
);

after(() => {
  db.close();
  rmSync(testDirectory, { recursive: true, force: true });
});

test("global product endpoints expose only public global products", async () => {
  const response = await products.request("http://localhost/");
  const body = (await response.json()) as {
    data: Array<Record<string, unknown>>;
  };

  assert.equal(response.status, 200);
  assert.deepEqual(
    body.data.map((product) => product.id),
    ["test-global-product"],
  );
  assert.equal("supplier_cost" in body.data[0], false);
  assert.equal("supplier_product_id" in body.data[0], false);
  assert.equal("sku" in body.data[0], false);
});

test("global product lookup hides store products", async () => {
  const response = await products.request(
    "http://localhost/id/test-store-product",
  );

  assert.equal(response.status, 404);
});

test("assigned store products include product galleries and variants", async () => {
  const response = await stores.request(
    "http://localhost/public/meo-store/products",
  );
  const body = (await response.json()) as {
    data?: Array<{
      id: string;
      images: string[];
      variants: Array<{ id: string; value: string }>;
      delivery_time: string;
    }>;
  };
  const product = body.data?.find((item) => item.id === "test-store-product");

  assert.equal(response.status, 200);
  assert.deepEqual(product?.images, [
    "https://example.invalid/one.jpg",
    "https://example.invalid/two.jpg",
  ]);
  assert.equal(product?.variants[0]?.value, "Black");
  assert.equal(product?.delivery_time, "7-12 business days");
});

test("admin can save the existing payment review order status", async () => {
  const token = jwt.default.sign(
    {
      id: "admin-test",
      email: "test@example.invalid",
      name: "Test Admin",
    },
    process.env.JWT_SECRET!,
  );

  const response = await orders.request("http://localhost/test-review-order", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ order_status: "payment_review_pending" }),
  });
  const body = (await response.json()) as {
    data?: { order_status?: string };
  };

  assert.equal(response.status, 200);
  assert.equal(body.data?.order_status, "payment_review_pending");
});

test("admin cannot move an unpaid order into fulfillment", async () => {
  const token = jwt.default.sign(
    {
      id: "admin-test",
      email: "test@example.invalid",
      name: "Test Admin",
    },
    process.env.JWT_SECRET!,
  );

  const response = await orders.request("http://localhost/test-review-order", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ order_status: "ready_to_fulfill" }),
  });
  const body = (await response.json()) as { error?: string };

  assert.equal(response.status, 400);
  assert.match(body.error ?? "", /Payment must be confirmed/);
});

test("supplier-ordered status requires supplier details", async () => {
  const token = jwt.default.sign(
    {
      id: "admin-test",
      email: "test@example.invalid",
      name: "Test Admin",
    },
    process.env.JWT_SECRET!,
  );

  const response = await orders.request("http://localhost/test-paid-order", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ order_status: "supplier_ordered" }),
  });
  const body = (await response.json()) as { error?: string };

  assert.equal(response.status, 400);
  assert.match(body.error ?? "", /supplier name and supplier order reference/);
});

test("inventory history loads for the requested product", async () => {
  const token = jwt.default.sign(
    {
      id: "admin-test",
      email: "test@example.invalid",
      name: "Test Admin",
    },
    process.env.JWT_SECRET!,
  );

  const response = await inventory.request(
    "http://localhost/product/test-global-product",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const body = (await response.json()) as {
    data?: Array<{ id: string; product_id: string }>;
  };

  assert.equal(response.status, 200);
  assert.equal(body.data?.[0]?.id, "test-inventory-movement");
  assert.equal(body.data?.[0]?.product_id, "test-global-product");
});

test("Cloudinary signatures require admin auth and never reveal the secret", async () => {
  const anonymous = await media.request("http://localhost/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resourceType: "image" }),
  });
  assert.equal(anonymous.status, 401);

  const token = jwt.default.sign(
    {
      id: "admin-test",
      email: "test@example.invalid",
      name: "Test Admin",
    },
    process.env.JWT_SECRET!,
  );
  const response = await media.request("http://localhost/signature", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resourceType: "video" }),
  });
  const body = (await response.json()) as {
    data?: Record<string, unknown>;
  };

  assert.equal(response.status, 200);
  assert.equal(body.data?.cloudName, "test-cloud");
  assert.equal(body.data?.apiKey, "test-api-key");
  assert.equal(body.data?.folder, "dropstack/products/videos");
  assert.equal(body.data?.resourceType, "video");
  assert.equal("apiSecret" in (body.data ?? {}), false);
  assert.equal(JSON.stringify(body.data).includes("test-api-secret"), false);

  const expectedSignature = createHash("sha1")
    .update(
      `folder=dropstack/products/videos&timestamp=${body.data?.timestamp}test-api-secret`,
    )
    .digest("hex");
  assert.equal(body.data?.signature, expectedSignature);
});

test("visitor currency conversion uses cached daily rates", () => {
  updateCurrencyRates({ USD: 1, GBP: 0.75, NGN: 1300 });

  assert.equal(convertCurrency(100, "USD", "GBP"), 75);
  assert.equal(convertCurrency(75, "GBP", "NGN"), 130000);
});

test("checkout converts product, cost, and shipping amounts to visitor currency", async () => {
  const productId = "test-checkout-fx-product";
  db.prepare(
    `
    INSERT INTO products (
      id, name, slug, description, category, price, currency,
      supplier_cost, shipping_cost, other_cost, stock, active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    productId,
    "FX checkout product",
    "fx-checkout-product",
    "Product for checkout conversion test",
    "Accessories",
    25,
    "USD",
    8,
    2,
    1,
    10,
    1,
    createdAt,
  );

  db.prepare(
    `
    INSERT INTO store_products (store_id, product_id, created_at)
    VALUES ('default', ?, ?)
  `,
  ).run(productId, createdAt);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    if (String(input).includes("api.frankfurter.dev")) {
      return new Response(
        JSON.stringify([
          { date: "2026-10-26", base: "USD", quote: "NGN", rate: 1300 },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return originalFetch(input);
  };

  try {
    const shippingResponse = await checkout.request(
      "http://localhost/shipping?workspace=global&store_id=default&country=NG&currency=NGN",
    );
    const shippingBody = (await shippingResponse.json()) as {
      data?: {
        policyText: string;
        options: Array<{ id: string; price: number }>;
      };
    };

    assert.equal(shippingResponse.status, 200);
    assert.ok(shippingBody.data?.policyText);
    assert.equal(
      shippingBody.data?.options.find((option) => option.id === "standard")
        ?.price,
      19500,
    );

    const response = await checkout.request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: "FX Customer",
        customer_email: "fx@example.invalid",
        shipping_address: "1 Test Street",
        country: "NG",
        currency: "NGN",
        workspace: "global",
        store_id: "default",
        shipping_method_id: "standard",
        shipping_policy_accepted: true,
        items: [{ product_id: productId, quantity: 2 }],
      }),
    });
    const body = (await response.json()) as {
      data?: {
        orderId: string;
        total: number;
        subtotal: number;
        shippingFee: number;
        items: Array<{
          selling_price: number;
          supplier_cost: number;
          shipping_cost: number;
          other_cost: number;
          total: number;
        }>;
      };
    };

    assert.equal(response.status, 201);
    assert.equal(body.data?.subtotal, 65000);
    assert.equal(body.data?.shippingFee, 19500);
    assert.equal(body.data?.total, 84500);
    assert.equal(body.data?.items[0]?.selling_price, 32500);
    assert.equal(body.data?.items[0]?.supplier_cost, 10400);
    assert.equal(body.data?.items[0]?.shipping_cost, 2600);
    assert.equal(body.data?.items[0]?.other_cost, 1300);
    assert.equal(body.data?.items[0]?.total, 65000);
    assert.equal(
      (
        db
          .prepare("SELECT store_id FROM orders WHERE id = ?")
          .get(body.data?.orderId) as { store_id: string }
      ).store_id,
      "default",
    );

    db.prepare(
      `UPDATE store_products SET price_override = 40
       WHERE store_id = 'default' AND product_id = ?`,
    ).run(productId);

    const overrideResponse = await checkout.request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: "Override Customer",
        customer_email: "override@example.invalid",
        shipping_address: "2 Test Street",
        country: "NG",
        currency: "NGN",
        workspace: "global",
        store_id: "default",
        shipping_method_id: "standard",
        shipping_policy_accepted: true,
        items: [{ product_id: productId, quantity: 2 }],
      }),
    });
    const overrideBody = (await overrideResponse.json()) as {
      data?: { subtotal: number; total: number };
    };

    assert.equal(overrideResponse.status, 201);
    assert.equal(overrideBody.data?.subtotal, 104000);
    assert.equal(overrideBody.data?.total, 123500);

    db.prepare(
      "UPDATE stores SET shipping_fee = 7, delivery_estimate = ? WHERE id = 'default'",
    ).run("7-12 business days");

    const configuredShippingResponse = await checkout.request(
      "http://localhost/shipping?workspace=global&store_id=default&country=NG&currency=NGN",
    );
    const configuredShippingBody =
      (await configuredShippingResponse.json()) as {
        data?: {
          options: Array<{
            id: string;
            price: number;
            deliveryEstimate: string;
          }>;
        };
      };
    const configuredOption = configuredShippingBody.data?.options[0];

    assert.equal(configuredShippingResponse.status, 200);
    assert.equal(configuredOption?.id, "store-configured");
    assert.equal(configuredOption?.price, 9100);
    assert.equal(configuredOption?.deliveryEstimate, "7-12 business days");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("global reset requires confirmation and preserves Nigeria data and admin login", async () => {
  await import("../src/database/nigeriaDb.ts");
  db.prepare(
    `
    INSERT INTO nigeria_products (id, name, slug, created_at, updated_at)
    VALUES ('reset-nigeria-product', 'Nigeria keepsake', 'nigeria-keepsake', ?, ?)
  `,
  ).run(createdAt, createdAt);
  db.prepare(
    "UPDATE nigeria_settings SET store_name = ?, updated_at = ? WHERE id = 'nigeria'",
  ).run("Nigeria Keep", createdAt);
  db.prepare(
    `
    INSERT INTO admin_workspace_settings (workspace, settings, updated_at)
    VALUES ('global', '{"demo":true}', ?)
  `,
  ).run(createdAt);
  db.prepare(
    `
    INSERT INTO support_messages (id, name, email, subject, message, created_at)
    VALUES ('reset-support-message', 'Demo', 'demo@example.invalid', 'Demo', 'Demo', ?)
  `,
  ).run(createdAt);

  const unauthed = await admin.request("http://localhost/system-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workspace: "global",
      confirmation: "RESET GLOBAL DATA",
    }),
  });
  assert.equal(unauthed.status, 401);

  const token = jwt.default.sign(
    { id: "admin-test", email: "test@example.invalid", name: "Test Admin" },
    process.env.JWT_SECRET!,
  );
  const wrongWorkspace = await admin.request("http://localhost/system-reset", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workspace: "nigeria",
      confirmation: "RESET GLOBAL DATA",
    }),
  });
  assert.equal(wrongWorkspace.status, 400);

  const response = await admin.request("http://localhost/system-reset", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workspace: "global",
      confirmation: "RESET GLOBAL DATA",
    }),
  });
  const body = (await response.json()) as {
    data?: {
      deletedProducts: number;
      deletedOrders: number;
      removedStores: number;
    };
  };

  assert.equal(response.status, 200);
  assert.ok((body.data?.deletedProducts ?? 0) > 0);
  assert.ok((body.data?.deletedOrders ?? 0) > 0);
  assert.equal(
    (
      db.prepare("SELECT COUNT(*) AS count FROM products").get() as {
        count: number;
      }
    ).count,
    0,
  );
  assert.equal(
    (
      db.prepare("SELECT COUNT(*) AS count FROM orders").get() as {
        count: number;
      }
    ).count,
    0,
  );
  assert.equal(
    (
      db.prepare("SELECT COUNT(*) AS count FROM order_items").get() as {
        count: number;
      }
    ).count,
    0,
  );
  assert.equal(
    (
      db.prepare("SELECT COUNT(*) AS count FROM inventory_movements").get() as {
        count: number;
      }
    ).count,
    0,
  );
  assert.equal(
    (
      db.prepare("SELECT COUNT(*) AS count FROM support_messages").get() as {
        count: number;
      }
    ).count,
    0,
  );
  assert.equal(
    (
      db
        .prepare(
          "SELECT COUNT(*) AS count FROM admin_workspace_settings WHERE workspace = 'global'",
        )
        .get() as { count: number }
    ).count,
    0,
  );
  assert.equal(
    (
      db.prepare("SELECT COUNT(*) AS count FROM stores").get() as {
        count: number;
      }
    ).count,
    1,
  );
  assert.equal(
    (
      db.prepare("SELECT COUNT(*) AS count FROM admin_users").get() as {
        count: number;
      }
    ).count,
    1,
  );
  assert.equal(
    (
      db
        .prepare("SELECT name FROM nigeria_products WHERE id = ?")
        .get("reset-nigeria-product") as { name: string }
    ).name,
    "Nigeria keepsake",
  );
  assert.equal(
    (
      db
        .prepare("SELECT store_name FROM nigeria_settings WHERE id = 'nigeria'")
        .get() as {
        store_name: string;
      }
    ).store_name,
    "Nigeria Keep",
  );
});
