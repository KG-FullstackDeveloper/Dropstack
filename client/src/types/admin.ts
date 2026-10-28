export interface CustomerSummary {
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  country: string;
  currency?: string | null;
  order_count: number;
  total_spend: number;
  first_order_at: string;
  last_order_at: string;
}

export interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedPayments: number;
  totalSales: number;
  activeProducts: number;
}

export interface AdminOrder {
  id: string;
  order_reference?: string | null;
  store_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  currency: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  order_status: string;
  payment_status: string;
  tracking_number: string | null;
  supplier_name?: string | null;
  supplier_order_reference?: string | null;
  created_at: string;
  updated_at: string;
  items: AdminOrderItem[];
}

export interface AdminOrderItem {
  id: string;
  order_id: string;
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
