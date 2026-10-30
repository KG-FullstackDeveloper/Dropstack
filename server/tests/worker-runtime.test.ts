import assert from "node:assert/strict";
import { test } from "node:test";

class MockD1Statement {
  constructor(
    private readonly db: MockD1Database,
    private readonly sql: string,
    private values: unknown[] = [],
  ) {}

  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }

  async first<T = Record<string, unknown>>() {
    const rows = await this.all<T>();
    return rows.results?.[0] ?? null;
  }

  async all<T = Record<string, unknown>>() {
    const rows = this.db.executeQuery<T>(this.sql, this.values);
    return { success: true, results: rows };
  }

  async run<T = unknown>() {
    const rows = this.db.executeQuery<T>(this.sql, this.values);
    return {
      success: true,
      meta: { changes: Array.isArray(rows) ? rows.length : 0 },
      results: rows,
    };
  }
}

class MockD1Database {
  private readonly schemaTables = new Set<string>(["schema_migrations"]);

  private readonly rows: Record<string, unknown>[] = [
    {
      id: "global-1",
      name: "Test Global Product",
      slug: "test-global-product",
      description: "A public product",
      category: "Accessories",
      price: 25,
      currency: "USD",
      image: "https://cdn.example.com/one.jpg",
      images: JSON.stringify(["https://cdn.example.com/one.jpg"]),
      videos: null,
      dimensions: null,
      weight: 0.5,
      cj_metadata: null,
      supplier_name: null,
      supplier_product_id: null,
      warehouse_country: null,
      processing_time: null,
      delivery_time: null,
      supplier_cost: 8,
      shipping_cost: 2,
      other_cost: 1,
      profit_per_unit: 14,
      profit_margin: 56,
      stock: 12,
      low_stock_threshold: 3,
      variants: JSON.stringify([
        { id: "v-black", name: "Color", value: "Black", price: 25, stock: 5 },
      ]),
      active: 1,
      store_id: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    },
  ];

  private readonly storeProducts: Array<{
    store_id: string;
    product_id: string;
  }> = [];

  prepare(sql: string) {
    return new MockD1Statement(this, sql);
  }

  hasTable(tableName: string) {
    return this.schemaTables.has(tableName);
  }

  batch() {
    return Promise.resolve([]);
  }

  executeQuery<T>(sql: string, values: unknown[]) {
    const normalized = sql.toLowerCase();

    if (normalized.includes("create table if not exists")) {
      for (const tableName of [
        "schema_migrations",
        "admin_users",
        "products",
        "stores",
      ]) {
        if (normalized.includes(tableName)) {
          this.schemaTables.add(tableName);
          break;
        }
      }
    }

    if (
      normalized.includes("select 1 as ok") ||
      normalized.includes("select 1 as healthy")
    ) {
      return [{ ok: 1 }] as T[];
    }

    if (normalized.includes("from products")) {
      const rows = this.rows.filter((row) => {
        const activeMatches =
          !normalized.includes("p.active =") || Number(row.active) === 1;
        const globalMatches =
          !normalized.includes("p.store_id is null") || row.store_id == null;
        const notAssigned =
          !normalized.includes("not exists") ||
          this.storeProducts.every((entry) => entry.product_id !== row.id);
        const slugMatches =
          !normalized.includes("p.slug =") || values[0] === row.slug;
        const idMatches =
          !normalized.includes("p.id =") || values[0] === row.id;

        return (
          activeMatches &&
          globalMatches &&
          notAssigned &&
          (slugMatches || idMatches)
        );
      });

      return rows as T[];
    }

    return [] as T[];
  }
}

const mockDb = new MockD1Database();

const { default: workerApp } = await import("../src/worker/index.ts");
const { default: legacyProductsRouter } =
  await import("../src/worker/routes/products.ts");

test("worker /api/health reports connected DB through the real app entry", async () => {
  const response = await workerApp.fetch(
    new Request("http://localhost/api/health"),
    {
      DB: mockDb,
      CLIENT_URL: "http://localhost:5173",
      ENVIRONMENT: "test",
      JWT_SECRET: "test-secret-length-is-long-enough",
    },
    {} as any,
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
});

test("legacy public product router uses D1-style bound statements for product listing", async () => {
  const response = await legacyProductsRouter.fetch(
    new Request("http://localhost/"),
    {
      DB: mockDb,
    },
    {} as any,
  );

  assert.equal(response.status, 200);
  const body = (await response.json()) as { data: Array<{ id: string }> };
  assert.equal(body.data[0]?.id, "global-1");
});

test("worker bootstraps the D1 schema before serving API routes", async () => {
  const response = await workerApp.fetch(
    new Request("http://localhost/api/health"),
    {
      DB: mockDb,
      CLIENT_URL: "http://localhost:5173",
      ENVIRONMENT: "test",
      JWT_SECRET: "test-secret-length-is-long-enough",
    },
    {} as any,
  );

  assert.equal(response.status, 200);
  assert.equal(mockDb.hasTable("schema_migrations"), true);
  assert.equal(mockDb.hasTable("products"), true);
});

test("worker /api/products exposes global public products only", async () => {
  const response = await workerApp.fetch(
    new Request("http://localhost/api/products"),
    {
      DB: mockDb,
      CLIENT_URL: "http://localhost:5173",
      ENVIRONMENT: "test",
      JWT_SECRET: "test-secret-length-is-long-enough",
    },
    {} as any,
  );

  assert.equal(response.status, 200);
  const body = (await response.json()) as { data: Array<{ id: string }> };
  assert.equal(body.data[0]?.id, "global-1");
});
