import type { Product } from "./product";

/** A cart line represents one product + one specific variant. */
export interface CartItem {
  product: Product;
  quantity: number;
  variant_id?: string;
  variant_name?: string;
  /** Price chosen from the product variant when one is selected. */
  unit_price?: number;
  /** Stock available for the selected variant at the time it was added. */
  variant_stock?: number;
}

export interface CartSummary {
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
}
