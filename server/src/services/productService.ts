import type { Product } from "../types/product";
import {
  getAllProducts as dbGetAllProducts,
  getProductById as dbGetProductById,
  getProductBySlug as dbGetProductBySlug,
} from "../data/store";

export function getAllProducts(): Product[] {
  return dbGetAllProducts();
}

export function getProductById(id: string): Product | null {
  return dbGetProductById(id) ?? null;
}

export function getProductBySlug(slug: string): Product | null {
  return dbGetProductBySlug(slug) ?? null;
}
