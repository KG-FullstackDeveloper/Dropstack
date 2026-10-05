export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;

  category: string;
  description: string;

  price: number;
  currency: string;

  image_url?: string | null;
  images?: string[];

  supplier_name?: string | null;
  supplier_cost: number;
  shipping_cost: number;
  other_cost: number;

  profit_per_unit: number;
  profit_margin: number;

  processing_time?: string | null;
  delivery_time?: string | null;

  stock?: number;
  low_stock_threshold?: number;

  active: number;

  created_at?: string;
  updated_at?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  price: string;
  sku: string;
  stock: string;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  category: string;
  description: string;

  price: number;
  currency: string;

  image_url?: string;
  images?: string[];

  supplier_name?: string;
  supplier_cost: number;
  shipping_cost: number;
  other_cost: number;

  processing_time?: string;
  delivery_time?: string;

  sku?: string;
  stock?: number;
  low_stock_threshold?: number;

  variants?: ProductVariant[];
}