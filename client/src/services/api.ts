
import type { Product } from "../types/product";
import type {
  CheckoutData,
  CheckoutResponse,
} from "../types/order";
import type { StoreConfig } from "../types/store";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";

export interface PublicStore {
  id: string;
  name: string;
  slug: string;
  niche: string;
  description: string | null;
  logo_url: string | null;
}

async function handleResponse<T>(
  response: Response,
): Promise<T> {
  let result: {
    success?: boolean;
    data?: T;
    error?: string;
    message?: string;
  };

  try {
    result = await response.json();
  } catch {
    throw new Error("Server returned an invalid response.");
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.error || result.message || "Something went wrong.",
    );
  }

  return result.data as T;
}

function adminHeaders(): HeadersInit {
  const token = localStorage.getItem("admin_token");

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

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

export async function getProductBySlug(
  slug: string,
): Promise<Product> {
  const response = await fetch(
    `${API_URL}/api/products/slug/${encodeURIComponent(slug)}`,
  );

  return handleResponse<Product>(response);
}

export async function getPublicStore(
  slug: string,
): Promise<PublicStore> {
  const response = await fetch(
    `${API_URL}/api/store/public/${encodeURIComponent(slug)}`,
  );

  return handleResponse<PublicStore>(response);
}

export async function getStoreProducts(
  slug: string,
): Promise<Product[]> {
  const response = await fetch(
    `${API_URL}/api/store/public/${encodeURIComponent(slug)}/products`,
  );

  return handleResponse<Product[]>(response);
}

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

export async function getStoreConfig(): Promise<StoreConfig> {
  const response = await fetch(`${API_URL}/api/store`);
  return handleResponse<StoreConfig>(response);
}

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