import type { Product } from "../types/product";
import { products } from "../data/store";

export function getAllProducts(): Product[] {
  return products.filter(
    (product) => product.active === 1
  );
}

export function getProductById(
  id: string
): Product | null {
  return (
    products.find(
      (product) =>
        product.id === id &&
        product.active === 1
    ) ?? null
  );
}

export function getProductBySlug(
  slug: string
): Product | null {
  return (
    products.find(
      (product) =>
        product.slug === slug &&
        product.active === 1
    ) ?? null
  );
}