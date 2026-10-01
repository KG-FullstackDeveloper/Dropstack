import type { Product, CreateProductInput } from "../types/product";
import type { AdminOrder, AdminStats, CustomerSummary } from "../types/admin";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getToken(): string | null {
  return localStorage.getItem("admin_token");
}

async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || "Something went wrong.");
  }
  return result.data;
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string; admin: { id: string; name: string; email: string } }> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || "Invalid credentials.");
  }
  return result.data;
}

export async function logout(): Promise<void> {
  try {
    await authFetch(`${API_URL}/api/auth/logout`, { method: "POST" });
  } catch {
    // Ignore errors on logout — token is cleared client-side anyway
  }
  localStorage.removeItem("admin_token");
}

export async function getMe(): Promise<{ id: string; name: string; email: string }> {
  return authFetch(`${API_URL}/api/auth/me`);
}

export async function getAdminProducts(): Promise<Product[]> {
  return authFetch(`${API_URL}/api/products/admin/all`);
}

export async function createProduct(data: CreateProductInput): Promise<Product> {
  return authFetch(`${API_URL}/api/products`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProduct(
  id: string,
  data: Partial<CreateProductInput> & { active?: number }
): Promise<Product> {
  return authFetch(`${API_URL}/api/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await authFetch(`${API_URL}/api/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  return authFetch(`${API_URL}/api/admin/orders`);
}

export async function updateOrderStatus(
  id: string,
  data: {
    order_status?: string;
    tracking_number?: string;
    payment_status?: string;
  }
): Promise<AdminOrder> {
  return authFetch(`${API_URL}/api/orders/${encodeURIComponent(id)}/status`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getCustomers(): Promise<CustomerSummary[]> {
  return authFetch(`${API_URL}/api/admin/customers`);
}

export async function getAdminStats(): Promise<AdminStats> {
  return authFetch(`${API_URL}/api/admin/stats`);
}
