export type PaymentStatus =
  | "pending"
  | "confirmed"
  | "failed"
  | "refunded";

export type SettlementStatus =
  | "pending"
  | "available"
  | "settled";

export type OrderStatus =
  | "payment_pending"
  | "payment_confirmed"
  | "settlement_pending"
  | "ready_to_fulfill"
  | "supplier_ordered"
  | "shipped"
  | "delivered"
  | "cancelled";

export type FulfillmentMode =
  | "local_stock"
  | "local_supplier"
  | "international_dropship"
  | "mixed"
  | "unset";

export type PaymentMethod =
  | "online"
  | "cod"
  | "manual";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  selling_price: number;
  supplier_cost: number;
  shipping_cost: number;
  other_cost: number;
  total: number;
  profit: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  currency: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_status: PaymentStatus;
  settlement_status: SettlementStatus;
  order_status: OrderStatus;
  fulfillment_mode?: FulfillmentMode;
  payment_method?: PaymentMethod;
  flutterwave_transaction_id: string | null;
  flutterwave_reference: string | null;
  supplier_name: string | null;
  supplier_order_reference: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface CreateOrderItemInput {
  product_id: string;
  quantity: number;
}

export interface CreateOrderInput {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  currency: string;
  subtotal: number;
  shipping_fee?: number;
  total?: number;
  flutterwave_reference?: string;
  items?: CreateOrderItemInput[];
}
