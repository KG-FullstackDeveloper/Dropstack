const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:4000")
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");
const API_URL = `${API_ORIGIN}/api`;

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string;
}

export interface CustomerSession {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  plan: string;
  role: string;
  status: string;
  subscriptionExpiresAt?: string | null;
  storeLimit: number;
  storesUsed: number;
  createdAt?: string;
  updatedAt?: string;
}

function getToken(): string | null {
  return localStorage.getItem("customer_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") || "";
  let result: unknown;

  if (contentType.includes("application/json")) {
    result = await response.json();
  } else {
    result = await response.text();
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}.`;
    let details = "";

    if (result && typeof result === "object") {
      const body = result as ApiResponse<unknown>;
      if (body.error) errorMessage = body.error;
      else if (body.message) errorMessage = body.message;
      if (typeof body.details === "string") details = body.details.trim();
    }

    if (response.status === 401) {
      localStorage.removeItem("customer_token");
    }

    throw new Error(details ? `${errorMessage} ${details}` : errorMessage);
  }

  if (result && typeof result === "object") {
    const body = result as ApiResponse<T>;
    if (body.success === false) {
      throw new Error(body.error || body.message || "Request failed.");
    }
    if ("data" in body) {
      return body.data as T;
    }
  }

  return result as T;
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  password: string;
  company?: string | null;
}): Promise<{ token: string; customer: CustomerSession }> {
  const result = await request<{ token: string; customer: CustomerSession }>(
    "/auth/customer/register",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  if (result.token) {
    localStorage.setItem("customer_token", result.token);
  }

  return result;
}

export async function loginCustomer(input: {
  email: string;
  password: string;
}): Promise<{ token: string; customer: CustomerSession }> {
  const result = await request<{ token: string; customer: CustomerSession }>(
    "/auth/customer/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  if (result.token) {
    localStorage.setItem("customer_token", result.token);
  }

  return result;
}

export async function getCustomerSession(): Promise<CustomerSession> {
  return request<CustomerSession>("/customers/me");
}

export async function getCustomerDashboard(): Promise<{
  id: string;
  name: string;
  email: string;
  company?: string | null;
  plan: string;
  status: string;
  storeLimit: number;
  storesUsed: number;
  subscriptionExpiresAt?: string | null;
  createdAt?: string;
}> {
  return request("/customers/dashboard");
}

export function logoutCustomer(): void {
  localStorage.removeItem("customer_token");
}
