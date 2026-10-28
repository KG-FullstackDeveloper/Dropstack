export interface CheckoutItem {
  product_id: string;
  quantity: number;
  variant_id?: string;
}

export interface CheckoutData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;

  shipping_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;

  currency: string;
  subtotal: number;
  shipping_fee?: number;
  workspace: "global" | "nigeria";
  store_id: string;
  shipping_method_id: string;
  shipping_policy_accepted: boolean;
  discount_code?: string;

  items?: CheckoutItem[];
}

export interface CheckoutShippingOption {
  id: string;
  name: string;
  price: number;
  minDays: number;
  maxDays: number;
  deliveryEstimate: string;
}

export interface CheckoutShippingResponse {
  policyText: string;
  options: CheckoutShippingOption[];
}

export interface CheckoutResponseItem {
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

export interface CheckoutResponse {
  orderId: string;

  // Required to confirm this specific order securely.
  confirmationToken: string;

  // The reservation deadline returned by the server.
  reservationExpiresAt: string;

  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  deliveryTime: string;

  paymentStatus: string;
  orderStatus: string;

  items?: CheckoutResponseItem[];
}

export interface ConfirmOrderResponse {
  orderId: string;
  orderStatus: "payment_review_pending";
  paymentStatus: string;
  emailSent: boolean;
  emailMessage: string;
}
