import { db } from "../src/database/db";

const columns = db
  .prepare("PRAGMA table_info(orders)")
  .all() as Array<{ name: string }>;
const existing = new Set(columns.map((column) => column.name));

const additions: Array<{ name: string; sql: string }> = [
  { name: "terms_accepted", sql: "ALTER TABLE orders ADD COLUMN terms_accepted INTEGER NOT NULL DEFAULT 0 CHECK (terms_accepted IN (0, 1))" },
  { name: "terms_version", sql: "ALTER TABLE orders ADD COLUMN terms_version TEXT" },
  { name: "terms_accepted_at", sql: "ALTER TABLE orders ADD COLUMN terms_accepted_at TEXT" },
  { name: "compliance_file_path", sql: "ALTER TABLE orders ADD COLUMN compliance_file_path TEXT" },
  { name: "compliance_sha256", sql: "ALTER TABLE orders ADD COLUMN compliance_sha256 TEXT" },
  { name: "confirmation_email_sent_at", sql: "ALTER TABLE orders ADD COLUMN confirmation_email_sent_at TEXT" },
];

const migrate = db.transaction(() => {
  for (const column of additions) {
    if (!existing.has(column.name)) {
      db.exec(column.sql);
      console.log(`Added orders.${column.name}`);
    } else {
      console.log(`orders.${column.name} already exists`);
    }
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_terms_acceptance ON orders(terms_accepted, terms_accepted_at)`);
});

migrate();
db.close();
console.log("Compliance agreement migration complete.");
