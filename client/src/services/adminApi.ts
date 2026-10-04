const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface LoginResponse {
  token: string;
  admin: AdminUser;
}

function getToken(): string | null {
  return localStorage.getItem("admin_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
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

  const contentType =
    response.headers.get("content-type") || "";

  let result: unknown;

  if (contentType.includes("application/json")) {
    result = await response.json();
  } else {
    result = await response.text();
  }

  if (!response.ok) {
    let errorMessage =
      `Request failed with status ${response.status}.`;

    if (
      result &&
      typeof result === "object"
    ) {
      const body =
        result as ApiResponse<unknown>;

      if (body.error) {
        errorMessage = body.error;
      } else if (body.message) {
        errorMessage = body.message;
      }
    }

    if (
      response.status === 401 &&
      path !== "/auth/login"
    ) {
      localStorage.removeItem("admin_token");
    }

    throw new Error(errorMessage);
  }

  if (
    result &&
    typeof result === "object"
  ) {
    const body =
      result as ApiResponse<T>;

    if (body.success === false) {
      throw new Error(
        body.error ||
          body.message ||
          "Request failed.",
      );
    }

    if ("data" in body) {
      return body.data as T;
    }
  }

  return result as T;
}

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const result =
    await request<LoginResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      },
    );

  localStorage.setItem(
    "admin_token",
    result.token,
  );

  return result;
}

export async function logout(): Promise<void> {
  try {
    await request(
      "/auth/logout",
      {
        method: "POST",
      },
    );
  } finally {
    localStorage.removeItem(
      "admin_token",
    );
  }
}

export async function getMe(): Promise<AdminUser> {
  return request<AdminUser>(
    "/auth/me",
    {
      method: "GET",
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Generic API                                                                */
/* -------------------------------------------------------------------------- */

export async function apiGet<T>(
  path: string,
): Promise<T> {
  return request<T>(path, {
    method: "GET",
  });
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body:
      body === undefined
        ? undefined
        : JSON.stringify(body),
  });
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    body:
      body === undefined
        ? undefined
        : JSON.stringify(body),
  });
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body:
      body === undefined
        ? undefined
        : JSON.stringify(body),
  });
}

export async function apiDelete<T>(
  path: string,
): Promise<T> {
  return request<T>(path, {
    method: "DELETE",
  });
}

/* -------------------------------------------------------------------------- */
/* API Client Compatibility                                                   */
/* -------------------------------------------------------------------------- */

export const apiClient = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,

  stores: async (): Promise<any> => {
    return apiGet("/stores");
  },
};

/* -------------------------------------------------------------------------- */
/* Admin                                                                      */
/* -------------------------------------------------------------------------- */

export async function getAdminOrders(): Promise<any[]> {
  const result =
    await apiGet<unknown>("/admin/orders");

  if (Array.isArray(result)) {
    return result;
  }

  if (
    result &&
    typeof result === "object"
  ) {
    const data =
      result as Record<string, unknown>;

    if (Array.isArray(data.orders)) {
      return data.orders;
    }
  }

  return [];
}

export async function getCustomers(): Promise<any[]> {
  const result =
    await apiGet<unknown>("/admin/customers");

  if (Array.isArray(result)) {
    return result;
  }

  if (
    result &&
    typeof result === "object"
  ) {
    const data =
      result as Record<string, unknown>;

    if (Array.isArray(data.customers)) {
      return data.customers;
    }
  }

  return [];
}

export async function getAdminStats(): Promise<any> {
  return apiGet("/admin/stats");
}

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

export async function getProducts(): Promise<any[]> {
  const result =
    await apiGet<unknown>("/products/all");

  if (Array.isArray(result)) {
    return result;
  }

  if (
    result &&
    typeof result === "object"
  ) {
    const data =
      result as Record<string, unknown>;

    if (Array.isArray(data.products)) {
      return data.products;
    }
  }

  return [];
}

export async function getAdminProducts(): Promise<any[]> {
  return getProducts();
}

export async function createProduct(
  product: unknown,
): Promise<any> {
  return apiPost(
    "/products",
    product,
  );
}

export async function updateProduct(
  productId: string,
  product: unknown,
): Promise<any> {
  return apiPatch(
    `/products/${encodeURIComponent(productId)}`,
    product,
  );
}

export async function deleteProduct(
  productId: string,
): Promise<any> {
  return apiDelete(
    `/products/${encodeURIComponent(productId)}`,
  );
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

export async function updateOrder(
  orderId: string,
  update: unknown,
): Promise<any> {
  return apiPatch(
    `/orders/${encodeURIComponent(orderId)}`,
    update,
  );
}

export async function updateOrderStatus(
  orderId: string,
  update: {
    order_status?: string;
    payment_status?: string;
    tracking_number?: string;
  },
): Promise<any> {
  return updateOrder(
    orderId,
    update,
  );
}

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

export async function getStore(): Promise<any> {
  return apiGet("/store");
}

export async function updateStore(
  settings: unknown,
): Promise<any> {
  return apiPut(
    "/store",
    settings,
  );
}

/* -------------------------------------------------------------------------- */
/* Analytics                                                                  */
/* -------------------------------------------------------------------------- */

export async function getAnalytics(): Promise<any> {
  return apiGet("/analytics");
}

/* -------------------------------------------------------------------------- */
/* Business health                                                            */
/* -------------------------------------------------------------------------- */

export async function getBusinessHealth(): Promise<any> {
  return apiGet(
    "/business-health",
  );
}

/* -------------------------------------------------------------------------- */
/* AI                                                                         */
/* -------------------------------------------------------------------------- */

export async function sendAIMessage(
  message: string,
  history?: unknown[],
  context?: unknown,
): Promise<any> {
  return apiPost(
    "/ai",
    {
      message,
      history,
      context,
    },
  );
}

export { API_URL };