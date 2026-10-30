import Database from "better-sqlite3";
import { constants } from "node:fs";
import { access, mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : fileURLToPath(new URL("../dropstack.db", import.meta.url));
const backupDirectory = process.env.BACKUP_DIRECTORY
  ? path.resolve(process.env.BACKUP_DIRECTORY)
  : fileURLToPath(new URL("../backups/", import.meta.url));

await access(databasePath, constants.R_OK);
await mkdir(backupDirectory, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = path.join(backupDirectory, `dropstack-${timestamp}.db`);
const requestedRetention = Number(process.env.BACKUP_KEEP || 7);
const retentionCount = Number.isInteger(requestedRetention)
  ? Math.max(1, requestedRetention)
  : 7;
const database = new Database(databasePath, {
  readonly: true,
  fileMustExist: true,
});

try {
  await database.backup(backupPath);
  const oldBackups = (await readdir(backupDirectory))
    .filter((name) => name.startsWith("dropstack-") && name.endsWith(".db"))
    .sort()
    .slice(0, -retentionCount);

  await Promise.all(
    oldBackups.map((name) => unlink(path.join(backupDirectory, name))),
  );

  console.log(`SQLite backup created: ${backupPath}`);
} finally {
  database.close();
}
