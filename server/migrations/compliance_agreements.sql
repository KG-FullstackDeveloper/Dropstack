-- Idempotent migration runner is provided in scripts/apply-compliance-migration.ts.
-- This SQL documents the compliance columns added to the existing orders table.
ALTER TABLE orders ADD COLUMN terms_accepted INTEGER NOT NULL DEFAULT 0 CHECK (terms_accepted IN (0, 1));
ALTER TABLE orders ADD COLUMN terms_version TEXT;
ALTER TABLE orders ADD COLUMN terms_accepted_at TEXT;
ALTER TABLE orders ADD COLUMN compliance_file_path TEXT;
ALTER TABLE orders ADD COLUMN compliance_sha256 TEXT;
ALTER TABLE orders ADD COLUMN confirmation_email_sent_at TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_terms_acceptance ON orders(terms_accepted, terms_accepted_at);
