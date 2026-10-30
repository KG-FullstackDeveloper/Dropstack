import type { D1Database, D1PreparedStatement, D1Result } from "./types";

function prepareStatement(
  database: D1Database,
  sql: string,
  values: unknown[] = [],
): D1PreparedStatement {
  const statement = database.prepare(sql);
  return values.length > 0 ? statement.bind(...values) : statement;
}

export async function d1First<T>(
  database: D1Database,
  sql: string,
  values: unknown[] = [],
): Promise<T | null> {
  return prepareStatement(database, sql, values).first<T>();
}

export async function d1All<T>(
  database: D1Database,
  sql: string,
  values: unknown[] = [],
): Promise<T[]> {
  const result = await prepareStatement(database, sql, values).all<T>();

  if (!result.success) {
    throw new Error(result.error || "D1 query failed.");
  }

  return result.results ?? [];
}

export async function d1Run(
  database: D1Database,
  sql: string,
  values: unknown[] = [],
): Promise<D1Result> {
  const result = await prepareStatement(database, sql, values).run();

  if (!result.success) {
    throw new Error(result.error || "D1 database operation failed.");
  }

  return result;
}

export async function d1Batch(
  database: D1Database,
  statements: D1PreparedStatement[],
): Promise<D1Result[]> {
  if (statements.length === 0) {
    return [];
  }

  const results = await database.batch(statements);

  if (results.some((result) => !result.success)) {
    throw new Error("One or more D1 batch operations failed.");
  }

  return results;
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
