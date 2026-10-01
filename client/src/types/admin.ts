export interface CustomerSummary {
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  country: string;
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
  created_at: string;
  updated_at: string;
  items: AdminOrderItem[];
}

export interface AdminOrderItem {
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
