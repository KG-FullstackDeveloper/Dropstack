import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { db,} from "../database/db";

function createInventoryId(): string { return "inventory_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10); }

const inventory = new Hono();

inventory.use("*", authMiddleware);

type InventoryMovementRow = {
id: string;
product_id: string;
product_name: string;
previous_stock: number;
change_amount: number;
new_stock: number;
reason: string;
note: string | null;
admin_id: string | null;
created_at: string;
};

type ProductRow = {
id: string;
name: string;
stock: number | string | null;
};

function getAdminId(c: any): string | null {
const user = c.get("user");

if (!user || typeof user !== "object") {
return null;
}

if (typeof user.id === "string") {
return user.id;
}

if (typeof user.userId === "string") {
return user.userId;
}

return null;
}

function toSafeNumber(value: unknown, fallback = 0): number {
const number = Number(value);

if (!Number.isFinite(number)) {
return fallback;
}

return number;
}

inventory.get("/", (c) => {
try {
const requestedLimit = Number(c.req.query("limit") || 100);

const limit = Math.min(
  Math.max(
    Number.isFinite(requestedLimit)
      ? Math.floor(requestedLimit)
      : 100,
    1,
  ),
  500,
);

const sql =
  "SELECT " +
  "im.id, " +
  "im.product_id, " +
  "COALESCE(p.name, 'Deleted product') AS product_name, " +
  "im.previous_stock, " +
  "im.change_amount, " +
  "im.new_stock, " +
  "im.reason, " +
  "im.note, " +
  "im.admin_id, " +
  "im.created_at " +
  "FROM inventory_movements im " +
  "LEFT JOIN products p ON p.id = im.product_id " +
  "ORDER BY im.created_at DESC " +
  "LIMIT ?";

const rows = db.prepare(sql).all(limit) as InventoryMovementRow[];

return c.json({
  success: true,
  data: rows,
});

} catch (error) {
console.error("GET /inventory error:", error);

return c.json(
  {
    success: false,
    error: "Failed to load inventory history",
  },
  500,
);

}
});

inventory.get("/product/", (c) => {
try {
const productId = c.req.param("productId");

const sql =
  "SELECT " +
  "im.id, " +
  "im.product_id, " +
  "COALESCE(p.name, 'Deleted product') AS product_name, " +
  "im.previous_stock, " +
  "im.change_amount, " +
  "im.new_stock, " +
  "im.reason, " +
  "im.note, " +
  "im.admin_id, " +
  "im.created_at " +
  "FROM inventory_movements im " +
  "LEFT JOIN products p ON p.id = im.product_id " +
  "WHERE im.product_id = ? " +
  "ORDER BY im.created_at DESC " +
  "LIMIT 200";

const rows = db
  .prepare(sql)
  .all(productId) as InventoryMovementRow[];

return c.json({
  success: true,
  data: rows,
});

} catch (error) {
console.error("GET /inventory/product error:", error);

return c.json(
  {
    success: false,
    error: "Failed to load product inventory history",
  },
  500,
);

}
});

inventory.post("/adjust", async (c) => {
try {
const body = await c.req.json();

const productId =
  typeof body?.productId === "string"
    ? body.productId.trim()
    : "";

const mode =
  typeof body?.mode === "string"
    ? body.mode.trim().toLowerCase()
    : "";

const reason =
  typeof body?.reason === "string"
    ? body.reason.trim()
    : "Correction";

const note =
  typeof body?.note === "string"
    ? body.note.trim()
    : "";

const amount = toSafeNumber(body?.amount, NaN);

if (!productId) {
  return c.json(
    {
      success: false,
      error: "Product ID is required",
    },
    400,
  );
}

if (!["add", "remove", "set"].includes(mode)) {
  return c.json(
    {
      success: false,
      error: "Invalid inventory adjustment mode",
    },
    400,
  );
}

if (!Number.isFinite(amount) || amount < 0) {
  return c.json(
    {
      success: false,
      error: "Amount must be a valid non-negative number",
    },
    400,
  );
}

const productSql =
  "SELECT id, name, stock " +
  "FROM products " +
  "WHERE id = ? " +
  "LIMIT 1";

const product = db
  .prepare(productSql)
  .get(productId) as ProductRow | undefined;

if (!product) {
  return c.json(
    {
      success: false,
      error: "Product not found",
    },
    404,
  );
}

const previousStock = Math.max(
  0,
  Math.floor(toSafeNumber(product.stock, 0)),
);

let newStock: number;

if (mode === "add") {
  newStock = previousStock + Math.floor(amount);
} else if (mode === "remove") {
  const removeAmount = Math.floor(amount);

  if (removeAmount > previousStock) {
    return c.json(
      {
        success: false,
        error: "Cannot remove more stock than currently available",
      },
      400,
    );
  }

  newStock = previousStock - removeAmount;
} else {
  newStock = Math.floor(amount);
}

newStock = Math.max(0, newStock);

const changeAmount = newStock - previousStock;
const adminId = getAdminId(c);
const movementId = createInventoryId();

const updateSql =
  "UPDATE products " +
  "SET stock = ? " +
  "WHERE id = ?";

const insertSql =
  "INSERT INTO inventory_movements " +
  "(id, product_id, previous_stock, change_amount, new_stock, reason, note, admin_id, created_at) " +
  "VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))";

const transaction = db.transaction(() => {
  db.prepare(updateSql).run(newStock, productId);

  db.prepare(insertSql).run(
    movementId,
    productId,
    previousStock,
    changeAmount,
    newStock,
    reason || "Correction",
    note || null,
    adminId,
  );
});

transaction();

return c.json({
  success: true,
  message: "Inventory updated successfully",
  data: {
    movementId,
    productId,
    productName: product.name,
    previousStock,
    changeAmount,
    newStock,
    reason: reason || "Correction",
    note: note || null,
  },
});

} catch (error) {
console.error("POST /inventory/adjust error:", error);

return c.json(
  {
    success: false,
    error: "Failed to adjust inventory",
  },
  500,
);

}
});

export default inventory;