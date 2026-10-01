import { db } from "../database/db";
import type { Product } from "../types/product";
import type { Order } from "../types/order";

export function getAllProducts(): Product[] {
  return db
    .prepare("SELECT * FROM products ORDER BY created_at DESC")
    .all() as Product[];
}

export function getActiveProducts(): Product[] {
  return db
    .prepare(
      "SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC"
    )
    .all() as Product[];
}

export function getProductById(id: string): Product | undefined {
  return db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(id) as Product | undefined;
}

export function getProductBySlug(slug: string): Product | undefined {
  return db
    .prepare("SELECT * FROM products WHERE slug = ? AND active = 1")
    .get(slug) as Product | undefined;
}

export function getAllOrders(): (Order & { items: OrderItem[] })[] {
  const orders = db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC")
    .all() as Order[];
  return orders.map((order) => ({
    ...order,
    items: db
      .prepare("SELECT * FROM order_items WHERE order_id = ?")
      .all(order.id) as OrderItem[],
  }));
}

export function getOrderById(
  id: string
): (Order & { items: OrderItem[] }) | undefined {
  const order = db
    .prepare("SELECT * FROM orders WHERE id = ?")
    .get(id) as Order | undefined;
  if (!order) return undefined;
  return {
    ...order,
    items: db
      .prepare("SELECT * FROM order_items WHERE order_id = ?")
      .all(order.id) as OrderItem[],
  };
}

import type { OrderItem } from "../types/order";
