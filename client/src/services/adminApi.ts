const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";

  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload
        ? String((payload as { error?: unknown }).error)
        : typeof payload === "object" &&
            payload !== null &&
            "message" in payload
          ? String((payload as { message?: unknown }).message)
          : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  if (typeof payload === "object" && payload !== null && "success" in payload) {
    const envelope = payload as {
      success?: boolean;
      data?: T;
      error?: unknown;
      message?: unknown;
    };

    if (envelope.success === false) {
      throw new Error(
        String(envelope.error ?? envelope.message ?? "Request failed."),
      );
    }

    if ("data" in envelope) {
      return envelope.data as T;
    }
  }

  return payload as T;
}

function normalizeList<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const list = record[key];
    return Array.isArray(list) ? (list as T[]) : [];
  }

  return [];
}

export const apiClient = {
  get: <T = unknown>(path: string) =>
    request<T>(path, { method: "GET" }),

  post: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  patch: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  put: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  delete: <T = unknown>(path: string) =>
    request<T>(path, { method: "DELETE" }),

  stores: () =>
    request<{ stores: unknown[] }>("/stores", {
      method: "GET",
    }),
};

export async function login(
  email: string,
  password: string,
): Promise<any> {
  const result = await request<{
    user: any;
    message?: string;
    redirectTo?: string;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return result.user;
}

export async function logout() {
  return request<{ message: string }>("/auth/logout", {
    method: "POST",
  });
}

export async function getMe(): Promise<any> {
  const result = await request<{ user: any }>("/auth/me", {
    method: "GET",
  });

  return result.user;
}

export async function getCustomers(storeId?: string): Promise<any[]> {
  const path = storeId
    ? `/customers?storeId=${encodeURIComponent(storeId)}`
    : "/customers";

  const result = await request<unknown>(path, {
    method: "GET",
  });

  return normalizeList<any>(result, "customers");
}

export async function getAdminOrders(storeId?: string): Promise<any[]> {
  const path = storeId
    ? `/orders?storeId=${encodeURIComponent(storeId)}`
    : "/admin/orders";

  const result = await request<unknown>(path, {
    method: "GET",
  });

  return normalizeList<any>(result, "orders");
}

export async function getAdminProducts(storeId?: string): Promise<any[]> {
  const path = storeId
    ? `/products?storeId=${encodeURIComponent(storeId)}`
    : "/products/all";

  const result = await request<unknown>(path, {
    method: "GET",
  });

  return normalizeList<any>(result, "products");
}

export async function deleteProduct(productId: string) {
  return request<unknown>(
    `/products/${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );
}

export async function createProduct(data: unknown) {
  return request<unknown>("/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProduct(
  productOrId: unknown,
  maybeData?: unknown,
) {
  let productId = "";
  let data = maybeData;

  if (typeof productOrId === "string") {
    productId = productOrId;
  } else if (productOrId && typeof productOrId === "object") {
    const record = productOrId as Record<string, unknown>;
    productId = String(record.id || "");

    if (data === undefined) {
      const { id: _id, ...rest } = record;
      data = rest;
    }
  }

  if (!productId) {
    throw new Error("Product ID is required.");
  }

  return request<unknown>(
    `/products/${encodeURIComponent(productId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(data ?? {}),
    },
  );
}

export async function updateOrderStatus(
  orderId: string,
  update: unknown,
) {
  const body =
    update && typeof update === "object"
      ? update
      : { order_status: update, status: update };

  return request<unknown>(
    `/orders/${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export { API_URL };
