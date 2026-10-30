/** Minimal Cloudflare D1 types so the Worker entry point does not depend on
 * Node-only database packages or accidentally import the local SQLite DB. */
export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: { changes?: number; duration?: number; last_row_id?: number };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

export type WorkerEnv = {
  DB: D1Database;
  CLIENT_URL?: string;
  ENVIRONMENT?: string;
  OWNER_EMAIL?: string;
  JWT_SECRET?: string;
};

export type WorkerEnvironment = {
  Bindings: WorkerEnv;
  Variables: {
    adminId: string;
    adminEmail: string;
    adminName?: string;
    adminRole?: string;
  };
};

export interface AdminRecord {
  id: string;
  email: string;
  password_hash: string;
  name?: string | null;
  role?: string | null;
}

export interface ProductRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency?: string | null;
  sku?: string | null;
  category?: string | null;
  image?: string | null;
  images?: string | null;
  videos?: string | null;
  dimensions?: string | null;
  weight?: number | null;
  cj_metadata?: string | null;
  supplier_name?: string | null;
  supplier_product_id?: string | null;
  warehouse_country?: string | null;
  processing_time?: string | null;
  delivery_time?: string | null;
  supplier_cost?: number | null;
  shipping_cost?: number | null;
  other_cost?: number | null;
  profit_per_unit?: number | null;
  profit_margin?: number | null;
  stock?: number | null;
  low_stock_threshold?: number | null;
  variants?: string | null;
  active?: number | null;
  store_id?: string | null;
  created_at?: string;
  updated_at?: string;
  price_override?: number | null;
}

export interface StoreRecord {
  id: string;
  slug: string;
  name?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}
