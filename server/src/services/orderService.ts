import type { Order } from "../types/order";
import { orders } from "../data/store";

export function getAllOrders(): Order[] {
  return [...orders].reverse();
}

export function getOrderById(
  id: string
): Order | null {
  return (
    orders.find(
      (order) => order.id === id
    ) ?? null
  );
}