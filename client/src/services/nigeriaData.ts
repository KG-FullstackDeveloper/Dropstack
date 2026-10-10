import type { Product } from "../types/product";

export interface NigeriaOrderRecord {
  id: string;
  customerName: string;
  phone: string;
  city: string;
  state: string;
  amount: number;
  profit: number;
  status:
    | "payment_pending"
    | "payment_confirmed"
    | "ready_to_fulfill"
    | "supplier_ordered"
    | "shipped"
    | "delivered"
    | "cancelled";
  paymentStatus: "pending" | "confirmed" | "failed" | "refunded";
  supplierName: string;
  trackingNumber: string;
  createdAt: string;
}

export interface NigeriaProductRecord {
  id: string;
  name: string;
  category: string;
  price: number;
  supplierCost: number;
  shippingCost: number;
  otherCost: number;
  inventory: number;
  active: boolean;
  imageUrl?: string;
  description?: string;
}

export interface NigeriaDataRecord {
  orders: NigeriaOrderRecord[];
  products: NigeriaProductRecord[];
  settings: {
    storeName: string;
    supplierName: string;
    paymentMethod: "flutterwave" | "manual" | "cod";
    shippingFee: number;
    deliveryEstimate: string;
  };
}

export const NIGERIA_DATA_KEY = "meo_nigeria_ecommerce_dashboard_v2";

export const DEFAULT_NIGERIA_DATA: NigeriaDataRecord = {
  orders: [],
  products: [],
  settings: {
    storeName: "Nigeria Ecommerce",
    supplierName: "",
    paymentMethod: "flutterwave",
    shippingFee: 0,
    deliveryEstimate: "2–7 business days",
  },
};

export function loadNigeriaData(): NigeriaDataRecord {
  if (typeof window === "undefined") return cloneDefault();

  try {
    const raw = window.localStorage.getItem(NIGERIA_DATA_KEY);
    if (!raw) return cloneDefault();

    const parsed = JSON.parse(raw) as Partial<NigeriaDataRecord>;

    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      products: Array.isArray(parsed.products) ? parsed.products : [],
      settings: {
        ...DEFAULT_NIGERIA_DATA.settings,
        ...(parsed.settings || {}),
      },
    };
  } catch {
    return cloneDefault();
  }
}

export function saveNigeriaData(data: NigeriaDataRecord) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NIGERIA_DATA_KEY, JSON.stringify(data));
}

export function addNigeriaOrder(order: NigeriaOrderRecord) {
  const data = loadNigeriaData();
  data.orders = [order, ...data.orders];
  saveNigeriaData(data);
}

export function getNigeriaProducts(): Product[] {
  const data = loadNigeriaData();

  return data.products
    .filter((product) => product.active)
    .map((product) => {
      return {
        id: product.id,
        name: product.name,
        description:
          product.description ||
          "Quality physical product available to customers in Nigeria.",
        category: product.category,
        price: product.price,
        currency: "NGN",
        image_url: product.imageUrl || null,
        supplier_name: data.settings.supplierName || null,
        supplier_cost: product.supplierCost,
        shipping_cost: product.shippingCost,
        other_cost: product.otherCost,
        profit_per_unit:
          product.price -
          product.supplierCost -
          product.shippingCost -
          product.otherCost,
        profit_margin:
          product.price > 0
            ? ((product.price -
                product.supplierCost -
                product.shippingCost -
                product.otherCost) /
                product.price) *
              100
            : 0,
        active: 1,
        created_at: new Date().toISOString(),
      } as unknown as Product;
    });
}

function cloneDefault(): NigeriaDataRecord {
  return {
    ...DEFAULT_NIGERIA_DATA,
    orders: [],
    products: [],
    settings: { ...DEFAULT_NIGERIA_DATA.settings },
  };
}
