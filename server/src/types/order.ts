export type PaymentStatus = "pending" | "confirmed" | "failed" | "refunded";

export type SettlementStatus = "pending" | "available" | "settled";

export type OrderStatus =
  | "payment_pending"
  | "payment_review_pending"
  | "payment_confirmed"
  | "settlement_pending"
  | "ready_to_fulfill"
  | "supplier_ordered"
  | "shipped"
  | "delivered"
  | "cancelled";

export type FulfillmentMode = "international_dropship" | "domestic" | "manual";

export type PaymentMethod =
  | "online"
  | "bank_transfer"
  | "cash_on_delivery"
  | "manual";

export type ShippingMethodCode = string;

export interface OrderItem {
  id: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  variant_id?: string | null;
  variant_name?: string | null;
  supplier_product_id?: string | null;
  supplier_sku?: string | null;
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
  customer_phone?: string | null;

  shipping_address: string;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
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

  flutterwave_transaction_id?: string | null;
  flutterwave_reference?: string | null;

  supplier_name?: string | null;
  supplier_order_reference?: string | null;
  tracking_number?: string | null;

  confirmation_token_hash?: string | null;
  confirmed_at?: string | null;
  reservation_expires_at?: string | null;
  reservation_released_at?: string | null;

  email_sent?: number;
  email_claimed?: number;
  email_claimed_at?: string | null;

  // Workspace and shipping snapshot.
  // These values must be copied from trusted server-side settings at checkout.
  workspace?: "global" | "nigeria" | string;
  store_id?: string | null;
  order_reference?: string | null;
  shipping_method_id?: string | null;
  shipping_method_name?: string | null;
  shipping_method_code?: ShippingMethodCode | null;
  shipping_price_snapshot?: number | null;
  shipping_min_days?: number | null;
  shipping_max_days?: number | null;
  shipping_delivery_estimate?: string | null;

  // Evidence that the customer accepted the shipping policy.
  shipping_policy_accepted?: boolean | number;
  shipping_policy_text_snapshot?: string | null;
  shipping_policy_accepted_at?: string | null;

  created_at: string;
  updated_at: string;

  items?: OrderItem[];
}

export interface CreateOrderInput {
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;

  shipping_address: string;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country: string;

  currency: string;
  subtotal: number;
  shipping_fee?: number;
  total?: number;

  flutterwave_reference?: string | null;

  // Requested option identifier only.
  // The backend must look up its actual price and delivery estimate.
  shipping_method_id?: string;

  // Do not trust client-provided prices, delivery estimates,
  // order references, or policy text as authoritative values.
  shipping_policy_accepted?: boolean;
  discount_code?: string;

  workspace?: "global" | "nigeria";
  store_id?: string;

  items: OrderItem[];
}
