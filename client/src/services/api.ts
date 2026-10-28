import type { Product } from "../types/product";
import type {
  CheckoutData,
  CheckoutResponse,
  CheckoutShippingResponse,
  ConfirmOrderResponse,
} from "../types/order";
import type { StoreConfig } from "../types/store";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000")
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

export interface PublicStore {
  id: string;
  name: string;
  slug: string;
  niche: string;
  domain?: string | null;
  status?: string;
  description?: string | null;
  logo_url?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  let result: ApiResponse<T>;

  try {
    result = await response.json();
  } catch {
    throw new Error("Server returned an invalid response.");
  }

  if (!response.ok || !result.success) {
    throw new Error(result.error || result.message || "Something went wrong.");
  }

  return result.data as T;
}

/** Attach the logged-in admin's token to protected requests. */
function adminHeaders(): HeadersInit {
  const token = localStorage.getItem("admin_token");

  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Retrieve global products for platform-level features. */
export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_URL}/api/products`);

  return handleResponse<Product[]>(response);
}

export async function getProduct(id: string): Promise<Product> {
  const response = await fetch(
    `${API_URL}/api/products/${encodeURIComponent(id)}`,
  );

  return handleResponse<Product>(response);
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const response = await fetch(
    `${API_URL}/api/products/slug/${encodeURIComponent(slug)}`,
  );

  return handleResponse<Product>(response);
}

/** Retrieve public information for one store. */
export async function getPublicStore(slug: string): Promise<PublicStore> {
  const response = await fetch(
    `${API_URL}/api/stores/public/${encodeURIComponent(slug)}`,
  );

  return handleResponse<PublicStore>(response);
}

/** Retrieve products assigned to the requested store. */
export async function getStoreProducts(slug: string): Promise<Product[]> {
  const response = await fetch(
    `${API_URL}/api/stores/public/${encodeURIComponent(slug)}/products`,
  );

  return handleResponse<Product[]>(response);
}

/** Create an order and reserve its stock on the server. */
export async function createCheckout(
  data: CheckoutData,
): Promise<CheckoutResponse> {
  const response = await fetch(`${API_URL}/api/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse<CheckoutResponse>(response);
}

export async function getCheckoutShipping(
  workspace: "global" | "nigeria",
  storeId: string,
  country: string,
  currency: string,
): Promise<CheckoutShippingResponse> {
  const params = new URLSearchParams({
    workspace,
    store_id: storeId,
    country,
    currency,
  });
  const response = await fetch(`${API_URL}/api/checkout/shipping?${params}`);

  return handleResponse<CheckoutShippingResponse>(response);
}

/**
 * Submit an order for payment review.
 *
 * This does not mark payment as paid or verified.
 * The server validates the order-specific confirmation token.
 */
export async function confirmOrder(
  orderId: string,
  confirmationToken: string,
): Promise<ConfirmOrderResponse> {
  const response = await fetch(`${API_URL}/api/order-confirmation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId,
      confirmationToken,
    }),
  });

  return handleResponse<ConfirmOrderResponse>(response);
}

/** Retrieve the default store configuration. */
export async function getStoreConfig(): Promise<StoreConfig> {
  const response = await fetch(`${API_URL}/api/store`, {
    headers: {
      ...adminHeaders(),
    },
  });

  return handleResponse<StoreConfig>(response);
}

/** Save the default store configuration. */
export async function updateStoreConfig(
  store: StoreConfig,
): Promise<StoreConfig> {
  const response = await fetch(`${API_URL}/api/store`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...adminHeaders(),
    },
    body: JSON.stringify(store),
  });

  return handleResponse<StoreConfig>(response);
}
