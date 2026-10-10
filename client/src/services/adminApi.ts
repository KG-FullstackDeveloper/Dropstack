const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  twoFactorEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string;
}

export interface LoginSuccess {
  token: string;
  admin: AdminUser;
}

export interface LoginTwoFactorRequired {
  requiresTwoFactor: true;
  challenge: {
    id: string;
    method: "email" | "email_and_sms";
    expiresInSeconds: number;
  };
}

export type LoginResult =
  | LoginSuccess
  | LoginTwoFactorRequired;

interface LoginApiResult {
  requiresTwoFactor?: boolean;
  challenge?: {
    id: string;
    method: "email" | "email_and_sms";
    expiresInSeconds: number;
  };
  token?: string;
  admin?: AdminUser;
}

interface VerifyTwoFactorResult {
  token: string;
  admin: AdminUser;
}

export interface ForgotPasswordResult {
  message: string;
  expiresInSeconds?: number;
  delivery?: "email" | "email_and_sms";
}

export interface VerifyForgotPasswordResult {
  resetToken: string;
  expiresInSeconds: number;
}

export interface ResetForgotPasswordResult {
  message: string;
}

/* -------------------------------------------------------------------------- */
/* Product types                                                              */
/* -------------------------------------------------------------------------- */

import type {
  Product,
  ProductVariant,
} from "../types/product";

export type AdminProduct = Product & {
  title?: string;
  handle?: string;
  bodyHtml?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  supplierName?: string | null;
  supplierProductId?: string | null;
  warehouseCountry?: string | null;
  processingTime?: string | null;
  deliveryTime?: string | null;
  supplierCost?: number;
  shippingCost?: number;
  otherCost?: number;
  profitPerUnit?: number;
  profitMargin?: number;
  lowStockThreshold?: number;
  createdAt?: string;
};

export interface CreateProductInput {
  name: string;
  slug: string;
  sku?: string | null;
  description: string;
  category: string;
  price: number;
  currency: string;
  image_url?: string | null;
  images?: string[];
  video_url?: string | null;
  supplier_name?: string | null;
  supplier_product_id?: string | null;
  warehouse_country?: string | null;
  processing_time?: string | null;
  delivery_time?: string | null;
  supplier_cost?: number;
  shipping_cost?: number;
  other_cost?: number;
  stock?: number;
  low_stock_threshold?: number;
  variants?: ProductVariant[];
  active?: number | boolean;
}

export interface ProductImportError {
  row: number;
  message: string;
  field?: string;
  value?: string;
}

export interface ProductImportResult {
  imported?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  failed?: number;
  total?: number;
  errors?: ProductImportError[];
  products?: AdminProduct[];
  message?: string;
}

function normalizeAdminProduct(
  product: Product,
): AdminProduct {
  return {
    ...product,
    title: product.name,
    handle: product.slug,
    imageUrl: product.image_url ?? null,
    videoUrl: product.video_url ?? null,
    supplierName: product.supplier_name ?? null,
    supplierProductId:
      product.supplier_product_id ?? null,
    warehouseCountry:
      product.warehouse_country ?? null,
    processingTime:
      product.processing_time ?? null,
    deliveryTime:
      product.delivery_time ?? null,
    supplierCost: Number(
      product.supplier_cost ?? 0,
    ),
    shippingCost: Number(
      product.shipping_cost ?? 0,
    ),
    otherCost: Number(
      product.other_cost ?? 0,
    ),
    profitPerUnit: Number(
      product.profit_per_unit ?? 0,
    ),
    profitMargin: Number(
      product.profit_margin ?? 0,
    ),
    lowStockThreshold: Number(
      product.low_stock_threshold ?? 0,
    ),
    createdAt: product.created_at,
  };
}

/* -------------------------------------------------------------------------- */
/* Authentication and shared request helper                                   */
/* -------------------------------------------------------------------------- */

function getToken(): string | null {
  return localStorage.getItem("admin_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  if (token) {
    headers.set(
      "Authorization",
      "Bearer " + token,
    );
  }

  const response = await fetch(
    API_URL + path,
    {
      ...options,
      headers,
      credentials: "include",
    },
  );

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
      "Request failed with status " +
      response.status +
      ".";

    let details = "";

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

      if (typeof body.details === "string") {
        details = body.details.trim();
      }
    }

    const isAuthRequest =
      path === "/auth/login" ||
      path === "/auth/login/verify" ||
      path === "/auth/login/resend" ||
      path === "/auth/forgot-password" ||
      path === "/auth/forgot-password/verify" ||
      path === "/auth/forgot-password/reset";

    if (
      response.status === 401 &&
      !isAuthRequest
    ) {
      localStorage.removeItem("admin_token");
    }

    throw new Error(
      details
        ? errorMessage + " " + details
        : errorMessage,
    );
  }

  if (
    result &&
    typeof result === "object"
  ) {
    const body = result as ApiResponse<T>;

    if (body.success === false) {
      const message =
        body.error ||
        body.message ||
        "Request failed.";

      const details =
        typeof body.details === "string"
          ? body.details.trim()
          : "";

      throw new Error(
        details
          ? message + " " + details
          : message,
      );
    }

    if ("data" in body) {
      return body.data as T;
    }

    return result as T;
  }

  return result as T;
}

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

export async function login(
  email: string,
  password: string,
): Promise<LoginSuccess> {
  const result =
    await request<LoginApiResult>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      },
    );

  if (
    result.requiresTwoFactor &&
    result.challenge
  ) {
    return {
      requiresTwoFactor: true,
      challenge: result.challenge,
    } as never;
  }

  if (!result.token || !result.admin) {
    throw new Error(
      "The server returned an incomplete login response.",
    );
  }

  localStorage.setItem(
    "admin_token",
    result.token,
  );

  return {
    token: result.token,
    admin: result.admin,
  };
}

export async function verifyLoginTwoFactor(
  adminId: string,
  code: string,
): Promise<VerifyTwoFactorResult> {
  const result =
    await request<VerifyTwoFactorResult>(
      "/auth/login/verify",
      {
        method: "POST",
        body: JSON.stringify({
          adminId,
          code,
        }),
      },
    );

  if (!result.token || !result.admin) {
    throw new Error(
      "The server returned an incomplete verification response.",
    );
  }

  localStorage.setItem(
    "admin_token",
    result.token,
  );

  return result;
}

export async function resendLoginTwoFactor(
  adminId: string,
): Promise<{
  method: "email" | "email_and_sms";
  expiresInSeconds: number;
}> {
  return request(
    "/auth/login/resend",
    {
      method: "POST",
      body: JSON.stringify({ adminId }),
    },
  );
}

export async function logout(): Promise<void> {
  try {
    await request(
      "/auth/logout",
      { method: "POST" },
    );
  } finally {
    localStorage.removeItem("admin_token");
  }
}

export async function getMe(): Promise<AdminUser> {
  return request<AdminUser>(
    "/auth/me",
    { method: "GET" },
  );
}

export async function updateProfile(
  name: string,
  phone?: string | null,
): Promise<AdminUser> {
  return request<AdminUser>(
    "/auth/profile",
    {
      method: "PATCH",
      body: JSON.stringify({
        name,
        phone: phone ?? null,
      }),
    },
  );
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  return request(
    "/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    },
  );
}

export async function changeEmail(
  currentPassword: string,
  newEmail: string,
): Promise<{
  message: string;
  email: string;
}> {
  return request(
    "/auth/change-email",
    {
      method: "POST",
      body: JSON.stringify({
        currentPassword,
        newEmail,
      }),
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Forgot Password                                                            */
/* -------------------------------------------------------------------------- */

export async function forgotPassword(
  email: string,
): Promise<ForgotPasswordResult> {
  return request<ForgotPasswordResult>(
    "/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
}

export async function verifyForgotPassword(
  email: string,
  code: string,
): Promise<VerifyForgotPasswordResult> {
  const result =
    await request<VerifyForgotPasswordResult>(
      "/auth/forgot-password/verify",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          code,
        }),
      },
    );

  if (!result.resetToken) {
    throw new Error(
      "The server did not return a valid password reset session.",
    );
  }

  return result;
}

export async function resetForgotPassword(
  resetToken: string,
  newPassword: string,
): Promise<ResetForgotPasswordResult> {
  return request<ResetForgotPasswordResult>(
    "/auth/forgot-password/reset",
    {
      method: "POST",
      body: JSON.stringify({
        resetToken,
        newPassword,
      }),
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Generic API                                                                */
/* -------------------------------------------------------------------------- */

export async function apiGet<T>(
  path: string,
): Promise<T> {
  return request<T>(
    path,
    { method: "GET" },
  );
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>(
    path,
    {
      method: "POST",
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
    },
  );
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>(
    path,
    {
      method: "PUT",
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
    },
  );
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>(
    path,
    {
      method: "PATCH",
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
    },
  );
}

export async function apiDelete<T>(
  path: string,
): Promise<T> {
  return request<T>(
    path,
    { method: "DELETE" },
  );
}

/* -------------------------------------------------------------------------- */
/* Multipart / File API                                                       */
/* -------------------------------------------------------------------------- */

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  method: "POST" | "PUT" | "PATCH" = "POST",
): Promise<T> {
  return request<T>(
    path,
    {
      method,
      body: formData,
    },
  );
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
    await apiGet<unknown>("/customers");

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

    if (Array.isArray(data.data)) {
      return data.data;
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

export async function getProducts(): Promise<AdminProduct[]> {
  const result =
    await apiGet<unknown>("/products/all");

  let rows: Product[] = [];

  if (Array.isArray(result)) {
    rows = result as Product[];
  } else if (
    result &&
    typeof result === "object"
  ) {
    const data =
      result as Record<string, unknown>;

    if (Array.isArray(data.products)) {
      rows = data.products as Product[];
    } else if (Array.isArray(data.data)) {
      rows = data.data as Product[];
    }
  }

  return rows.map(normalizeAdminProduct);
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  return getProducts();
}

export async function createProduct(
  product:
    | CreateProductInput
    | Record<string, unknown>,
): Promise<AdminProduct> {
  const result =
    await apiPost<Product>(
      "/products",
      product,
    );

  return normalizeAdminProduct(result);
}

export async function updateProduct(
  productId: string,
  product:
    | Partial<CreateProductInput>
    | Record<string, unknown>,
): Promise<AdminProduct> {
  const result =
    await apiPatch<Product>(
      "/products/" +
        encodeURIComponent(productId),
      product,
    );

  return normalizeAdminProduct(result);
}

export async function deleteProduct(
  productId: string,
): Promise<any> {
  return apiDelete(
    "/products/" +
      encodeURIComponent(productId),
  );
}

export async function findProductBySku(
  sku: string,
): Promise<AdminProduct | null> {
  const normalizedSku =
    sku.trim().toLowerCase();

  if (!normalizedSku) {
    return null;
  }

  const products = await getAdminProducts();

  return (
    products.find(
      (product) =>
        String(product.sku || "")
          .trim()
          .toLowerCase() === normalizedSku,
    ) || null
  );
}

export async function findProductByHandle(
  handle: string,
): Promise<AdminProduct | null> {
  const normalizedHandle =
    handle.trim().toLowerCase();

  if (!normalizedHandle) {
    return null;
  }

  const products = await getAdminProducts();

  return (
    products.find(
      (product) =>
        String(
          product.slug ||
            product.handle ||
            "",
        )
          .trim()
          .toLowerCase() === normalizedHandle,
    ) || null
  );
}

/* -------------------------------------------------------------------------- */
/* Product CSV Import                                                         */
/* -------------------------------------------------------------------------- */

export async function importProductsCsv(
  file: File,
  options?: {
    updateExisting?: boolean;
    skipExisting?: boolean;
  },
): Promise<ProductImportResult> {
  const formData = new FormData();

  formData.append("file", file);

  if (options?.updateExisting !== undefined) {
    formData.append(
      "updateExisting",
      String(options.updateExisting),
    );
  }

  if (options?.skipExisting !== undefined) {
    formData.append(
      "skipExisting",
      String(options.skipExisting),
    );
  }

  return apiUpload<ProductImportResult>(
    "/products/import-csv",
    formData,
    "POST",
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
    "/orders/" +
      encodeURIComponent(orderId),
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
  return updateOrder(orderId, update);
}

/* -------------------------------------------------------------------------- */
/* Inventory                                                                  */
/* -------------------------------------------------------------------------- */

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  previous_stock: number;
  change_amount: number;
  new_stock: number;
  reason: string;
  note: string | null;
  admin_id: string | null;
  created_at: string;
}

export type InventoryAdjustmentMode =
  | "add"
  | "remove"
  | "set";

export type InventoryAdjustmentReason =
  | "Restock"
  | "Sale"
  | "Damaged"
  | "Returned"
  | "Correction"
  | "Other";

export interface InventoryAdjustmentInput {
  productId: string;
  mode: InventoryAdjustmentMode;
  amount: number;
  reason: InventoryAdjustmentReason;
  note?: string;
}

export interface InventoryAdjustmentResult {
  movementId: string;
  productId: string;
  productName: string;
  previousStock: number;
  changeAmount: number;
  newStock: number;
  reason: string;
  note: string | null;
}

export async function getInventoryHistory(
  limit = 100,
): Promise<InventoryMovement[]> {
  const safeLimit = Math.min(
    Math.max(
      Math.floor(Number(limit) || 100),
      1,
    ),
    500,
  );

  const result =
    await apiGet<unknown>(
      "/inventory?limit=" + safeLimit,
    );

  if (Array.isArray(result)) {
    return result as InventoryMovement[];
  }

  if (
    result &&
    typeof result === "object"
  ) {
    const data =
      result as Record<string, unknown>;

    if (Array.isArray(data.movements)) {
      return data.movements as InventoryMovement[];
    }

    if (Array.isArray(data.history)) {
      return data.history as InventoryMovement[];
    }

    if (Array.isArray(data.data)) {
      return data.data as InventoryMovement[];
    }
  }

  return [];
}

export async function getProductInventoryHistory(
  productId: string,
): Promise<InventoryMovement[]> {
  const result =
    await apiGet<unknown>(
      "/inventory/product/" +
        encodeURIComponent(productId),
    );

  if (Array.isArray(result)) {
    return result as InventoryMovement[];
  }

  if (
    result &&
    typeof result === "object"
  ) {
    const data =
      result as Record<string, unknown>;

    if (Array.isArray(data.movements)) {
      return data.movements as InventoryMovement[];
    }

    if (Array.isArray(data.history)) {
      return data.history as InventoryMovement[];
    }

    if (Array.isArray(data.data)) {
      return data.data as InventoryMovement[];
    }
  }

  return [];
}

export async function adjustInventory(
  input: InventoryAdjustmentInput,
): Promise<InventoryAdjustmentResult> {
  if (
    !input.productId ||
    !input.productId.trim()
  ) {
    throw new Error("Product ID is required.");
  }

  if (
    !["add", "remove", "set"].includes(input.mode)
  ) {
    throw new Error(
      "Invalid inventory adjustment mode.",
    );
  }

  if (
    !Number.isFinite(input.amount) ||
    input.amount < 0
  ) {
    throw new Error(
      "Stock amount must be a valid non-negative number.",
    );
  }

  return apiPost<InventoryAdjustmentResult>(
    "/inventory/adjust",
    {
      productId: input.productId.trim(),
      mode: input.mode,
      amount: Math.floor(input.amount),
      reason: input.reason || "Correction",
      note: input.note?.trim() || "",
    },
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
  return apiPut("/store", settings);
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
  return apiGet("/business-health");
}

/* -------------------------------------------------------------------------- */
/* AI                                                                         */
/* -------------------------------------------------------------------------- */

export async function sendAIMessage(
  message: string,
  history?: unknown[],
  context?: unknown,
): Promise<any> {
  return apiPost("/ai", {
    message,
    history,
    context,
  });
}

export { API_URL };
