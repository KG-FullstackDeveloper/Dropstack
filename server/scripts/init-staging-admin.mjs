import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

const email =
  process.env.STAGING_ADMIN_EMAIL || "staging-admin@dropstack.local";
const password = process.env.STAGING_ADMIN_PASSWORD;

if (!password) {
  console.error("STAGING_ADMIN_PASSWORD is required.");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);
const now = new Date().toISOString();
const sql = `
  INSERT INTO admin_users (id, email, password_hash, name, phone, role, two_factor_enabled, created_at, updated_at)
  VALUES ('admin_staging_seed', ?, 'custom_hash_placeholder', 'Staging Admin', '+15550000000', 'platform_owner', 0, ?, ?)
  ON CONFLICT(email) DO UPDATE SET
    password_hash = excluded.password_hash,
    name = excluded.name,
    phone = excluded.phone,
    role = excluded.role,
    updated_at = excluded.updated_at;
`;

const escapedHash = passwordHash.replace(/'/g, "''");
const sqlWithHash = `
  INSERT INTO admin_users (id, email, password_hash, name, phone, role, two_factor_enabled, created_at, updated_at)
  VALUES ('admin_staging_seed', '${email.replace(/'/g, "''")}', '${escapedHash}', 'Staging Admin', '+15550000000', 'platform_owner', 0, '${now}', '${now}')
  ON CONFLICT(email) DO UPDATE SET
    password_hash = excluded.password_hash,
    name = excluded.name,
    phone = excluded.phone,
    role = excluded.role,
    updated_at = excluded.updated_at;
`;

const sqlPath = path.resolve(process.cwd(), "staging-admin-seed.sql");
writeFileSync(sqlPath, sqlWithHash, "utf8");

const quotedSqlPath =
  process.platform === "win32"
    ? `'${sqlPath.replace(/'/g, "''")}'`
    : `'${sqlPath.replace(/'/g, "'\\''")}'`;

const command = [
  "npm",
  "exec",
  "--yes",
  "--",
  "wrangler@4.156.0",
  "d1",
  "execute",
  "dropstack-global-staging",
  "--config",
  "wrangler.worker.toml",
  "--remote",
  "--file",
  quotedSqlPath,
].join(" ");

const isWindows = process.platform === "win32";
const result = spawnSync(
  isWindows ? "powershell.exe" : "/bin/bash",
  isWindows ? ["-NoProfile", "-Command", command] : ["-lc", command],
  {
    stdio: "inherit",
    shell: false,
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Staging admin created/updated: ${email}`);
