export interface CheckoutItem {
product_id: string;
quantity: number;
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

items?: CheckoutItem[];
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

subtotal: number;

shippingFee: number;

total: number;

currency: string;

deliveryTime: string;

paymentStatus: string;

items?: CheckoutResponseItem[];
}
