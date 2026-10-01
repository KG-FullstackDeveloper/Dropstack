import type { Order } from "../types/order";
import { getAllOrders as dbGetAllOrders, getOrderById as dbGetOrderById } from "../data/store";

export function getAllOrders(): (Order & { items: import("../types/order").OrderItem[] })[] {
  return dbGetAllOrders();
}

export function getOrderById(
  id: string
): (Order & { items: import("../types/order").OrderItem[] }) | null {
  return dbGetOrderById(id) ?? null;
}
