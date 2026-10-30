
import { db } from "./db";

/**
 * Adds the shipping snapshot fields to existing orders.
 * Safe to run more than once.
 */
export function runShippingMigration(): void {
  const columns: Array<[string, string]> = [
    ["workspace", "TEXT"],
    ["order_reference", "TEXT"],
    ["shipping_method_id", "TEXT"],
    ["shipping_method_name", "TEXT"],
    ["shipping_method_code", "TEXT"],
    ["shipping_price_snapshot", "REAL"],
    ["shipping_min_days", "INTEGER"],
    ["shipping_max_days", "INTEGER"],
    ["shipping_delivery_estimate", "TEXT"],
    ["shipping_policy_accepted", "INTEGER NOT NULL DEFAULT 0"],
    ["shipping_policy_text_snapshot", "TEXT"],
    ["shipping_policy_accepted_at", "TEXT"],
  ];

  for (const [column, definition] of columns) {
    const existing = db
      .prepare("PRAGMA table_info(orders)")
      .all() as Array<{ name: string }>;

    if (!existing.some((item) => item.name === column)) {
      db.exec(`ALTER TABLE orders ADD COLUMN ${column} ${definition}`);
    }
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_reference
    ON orders(order_reference)
    WHERE order_reference IS NOT NULL
  `);
}
