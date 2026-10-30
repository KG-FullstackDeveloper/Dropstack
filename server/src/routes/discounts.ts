import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../database/db";
import { authMiddleware } from "../middleware/auth";

const discounts = new Hono();
const adminDiscounts = new Hono();
adminDiscounts.use("*", authMiddleware);

db.exec(`
  CREATE TABLE IF NOT EXISTS store_discounts (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('product_amount','order_amount','buy_x_get_y','free_shipping')),
    value REAL NOT NULL DEFAULT 0,
    product_ids TEXT NOT NULL DEFAULT '[]',
    minimum_order_amount REAL,
    minimum_quantity INTEGER,
    buy_quantity INTEGER,
    get_quantity INTEGER,
    get_discount_percent REAL NOT NULL DEFAULT 100,
    starts_at TEXT,
    ends_at TEXT,
    usage_limit INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 0,
    per_customer_limit INTEGER,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(store_id, code),
    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_store_discounts_store ON store_discounts(store_id);
`);

const clean = (v: unknown) => typeof v === "string" ? v.trim() : "";
function serialize(row: any) {
  return {
    id: row.id, storeId: row.store_id, name: row.name, code: row.code,
    type: row.type, value: row.value, productIds: JSON.parse(row.product_ids || "[]"),
    minimumOrderAmount: row.minimum_order_amount, minimumQuantity: row.minimum_quantity,
    buyQuantity: row.buy_quantity, getQuantity: row.get_quantity,
    getDiscountPercent: row.get_discount_percent, startsAt: row.starts_at, endsAt: row.ends_at,
    usageLimit: row.usage_limit, usageCount: row.usage_count,
    perCustomerLimit: row.per_customer_limit, active: row.active === 1,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}
function validType(v: unknown): v is string {
  return ["product_amount", "order_amount", "buy_x_get_y", "free_shipping"].includes(String(v));
}
function normalizeInput(body: any) {
  const name = clean(body.name);
  const code = clean(body.code).toUpperCase().replace(/\s+/g, "");
  const type = body.type;
  const value = Number(body.value ?? 0);
  const productIds = Array.isArray(body.productIds) ? [...new Set(body.productIds.filter((x: unknown) => typeof x === "string" && x.trim()).map((x: string) => x.trim()))] : [];
  if (!name || !/^[A-Z0-9_-]{3,40}$/.test(code) || !validType(type)) throw new Error("Enter a name, a valid code (3–40 letters/numbers), and a discount type.");
  if (!Number.isFinite(value) || value < 0 || ((type === "product_amount" || type === "order_amount") && value <= 0) || (type !== "free_shipping" && value > 100 && type !== "buy_x_get_y" && body.valueMode === "percent")) throw new Error("Enter a valid discount value.");
  const startsAt = body.startsAt ? new Date(body.startsAt).toISOString() : null;
  const endsAt = body.endsAt ? new Date(body.endsAt).toISOString() : null;
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) throw new Error("End date must be after the start date.");
  return {
    name, code, type, value, productIds,
    minimumOrderAmount: body.minimumOrderAmount === "" || body.minimumOrderAmount == null ? null : Math.max(0, Number(body.minimumOrderAmount)),
    minimumQuantity: body.minimumQuantity === "" || body.minimumQuantity == null ? null : Math.max(1, Math.floor(Number(body.minimumQuantity))),
    buyQuantity: body.buyQuantity === "" || body.buyQuantity == null ? null : Math.max(1, Math.floor(Number(body.buyQuantity))),
    getQuantity: body.getQuantity === "" || body.getQuantity == null ? null : Math.max(1, Math.floor(Number(body.getQuantity))),
    getDiscountPercent: Math.min(100, Math.max(0, Number(body.getDiscountPercent ?? 100))),
    startsAt, endsAt,
    usageLimit: body.usageLimit === "" || body.usageLimit == null ? null : Math.max(1, Math.floor(Number(body.usageLimit))),
    perCustomerLimit: body.perCustomerLimit === "" || body.perCustomerLimit == null ? null : Math.max(1, Math.floor(Number(body.perCustomerLimit))),
    active: body.active === false ? 0 : 1,
  };
}

// Admin list is always scoped to one existing store.
adminDiscounts.get("/", (c) => {
  const storeId = clean(c.req.query("store_id"));
  if (!storeId) return c.json({ success: false, error: "Store is required." }, 400);
  const store = db.prepare("SELECT id FROM stores WHERE id = ?").get(storeId);
  if (!store) return c.json({ success: false, error: "Store not found." }, 404);
  const rows = db.prepare("SELECT * FROM store_discounts WHERE store_id = ? ORDER BY created_at DESC").all(storeId);
  return c.json({ success: true, data: rows.map(serialize) });
});

adminDiscounts.post("/", async (c) => {
  try {
    const body = await c.req.json<any>();
    const storeId = clean(body.storeId);
    if (!storeId || !db.prepare("SELECT id FROM stores WHERE id = ?").get(storeId)) return c.json({ success: false, error: "Choose an existing store." }, 400);
    const input = normalizeInput(body);
    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(`INSERT INTO store_discounts (id,store_id,name,code,type,value,product_ids,minimum_order_amount,minimum_quantity,buy_quantity,get_quantity,get_discount_percent,starts_at,ends_at,usage_limit,per_customer_limit,active,created_at,updated_at) VALUES (@id,@storeId,@name,@code,@type,@value,@productIds,@minimumOrderAmount,@minimumQuantity,@buyQuantity,@getQuantity,@getDiscountPercent,@startsAt,@endsAt,@usageLimit,@perCustomerLimit,@active,@now,@now)`).run({ id, storeId, ...input, productIds: JSON.stringify(input.productIds), now });
    const row = db.prepare("SELECT * FROM store_discounts WHERE id = ?").get(id);
    return c.json({ success: true, data: serialize(row) }, 201);
  } catch (error: any) {
    const message = String(error?.message || "");
    return c.json({ success: false, error: message.includes("UNIQUE") ? "That code already exists for this store." : message || "Unable to create discount." }, 400);
  }
});

adminDiscounts.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<any>();
    const storeId = clean(body.storeId);
    const existing = db.prepare("SELECT id FROM store_discounts WHERE id = ? AND store_id = ?").get(id, storeId);
    if (!existing) return c.json({ success: false, error: "Discount not found for this store." }, 404);
    const input = normalizeInput(body);
    db.prepare(`UPDATE store_discounts SET name=@name,code=@code,type=@type,value=@value,product_ids=@productIds,minimum_order_amount=@minimumOrderAmount,minimum_quantity=@minimumQuantity,buy_quantity=@buyQuantity,get_quantity=@getQuantity,get_discount_percent=@getDiscountPercent,starts_at=@startsAt,ends_at=@endsAt,usage_limit=@usageLimit,per_customer_limit=@perCustomerLimit,active=@active,updated_at=@now WHERE id=@id AND store_id=@storeId`).run({ id, storeId, ...input, productIds: JSON.stringify(input.productIds), now: new Date().toISOString() });
    return c.json({ success: true, data: serialize(db.prepare("SELECT * FROM store_discounts WHERE id = ?").get(id)) });
  } catch (error: any) {
    const message = String(error?.message || "");
    return c.json({ success: false, error: message.includes("UNIQUE") ? "That code already exists for this store." : message || "Unable to update discount." }, 400);
  }
});

adminDiscounts.delete("/:id", (c) => {
  const id = c.req.param("id");
  const storeId = clean(c.req.query("store_id"));
  const result = db.prepare("DELETE FROM store_discounts WHERE id = ? AND store_id = ?").run(id, storeId);
  if (!result.changes) return c.json({ success: false, error: "Discount not found for this store." }, 404);
  return c.json({ success: true, data: { deleted: true } });
});

// Server-side validation endpoint for the storefront checkout to use.
discounts.post("/validate", async (c) => {
  try {
    const body = await c.req.json<any>();
    const storeId = clean(body.storeId);
    const code = clean(body.code).toUpperCase().replace(/\s+/g, "");
    const subtotal = Number(body.subtotal);
    const items = Array.isArray(body.items) ? body.items : [];
    if (!storeId || !code || !Number.isFinite(subtotal) || subtotal < 0) return c.json({ success: false, error: "Store, code, and subtotal are required." }, 400);
    const row: any = db.prepare("SELECT * FROM store_discounts WHERE store_id = ? AND code = ? AND active = 1").get(storeId, code);
    if (!row) return c.json({ success: false, error: "This discount code is invalid or inactive." }, 404);
    const now = Date.now();
    if (row.starts_at && now < Date.parse(row.starts_at)) return c.json({ success: false, error: "This discount has not started yet." }, 400);
    if (row.ends_at && now > Date.parse(row.ends_at)) return c.json({ success: false, error: "This discount has expired." }, 400);
    if (row.usage_limit != null && row.usage_count >= row.usage_limit) return c.json({ success: false, error: "This discount has reached its usage limit." }, 400);
    if (row.minimum_order_amount != null && subtotal < row.minimum_order_amount) return c.json({ success: false, error: `Minimum order subtotal is ${row.minimum_order_amount}.` }, 400);
    const eligibleIds: string[] = JSON.parse(row.product_ids || "[]");
    const eligible = items.filter((item: any) => Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0 && (row.type === "order_amount" || eligibleIds.length === 0 || eligibleIds.includes(String(item.productId || item.product_id))));
    const qty = eligible.reduce((n: number, item: any) => n + Number(item.quantity), 0);
    if (row.minimum_quantity != null && qty < row.minimum_quantity) return c.json({ success: false, error: `Add at least ${row.minimum_quantity} qualifying item(s).` }, 400);
    let discountAmount = 0;
    let shippingDiscount = 0;
    if (row.type === "free_shipping") shippingDiscount = Number(body.shipping || 0);
    else if (row.type === "order_amount") discountAmount = Math.min(subtotal, row.value);
    else if (row.type === "product_amount") {
      const eligibleSubtotal = eligible.reduce((sum: number, item: any) => sum + Number(item.unitPrice || 0) * Number(item.quantity), 0);
      discountAmount = Math.min(eligibleSubtotal, row.value <= 100 && body.valueMode === "percent" ? eligibleSubtotal * row.value / 100 : row.value);
    } else if (row.type === "buy_x_get_y") {
      const buy = Math.max(1, Number(row.buy_quantity || 1));
      const get = Math.max(1, Number(row.get_quantity || 1));
      const freeUnits = Math.floor(qty / (buy + get)) * get;
      const prices = eligible.flatMap((item: any) => Array.from({ length: Number(item.quantity) }, () => Number(item.unitPrice || 0))).sort((a: number,b: number) => a-b);
      discountAmount = prices.slice(0, freeUnits).reduce((s: number,p: number) => s+p, 0) * Math.min(100, Math.max(0, Number(row.get_discount_percent || 100))) / 100;
    }
    return c.json({ success: true, data: { id: row.id, code: row.code, type: row.type, discountAmount: Math.max(0, discountAmount), shippingDiscount: Math.max(0, shippingDiscount), message: "Discount is valid." } });
  } catch (error) {
    console.error("Discount validation failed", error);
    return c.json({ success: false, error: "Unable to validate this discount." }, 500);
  }
});

discounts.route("/", adminDiscounts);

export default discounts;
