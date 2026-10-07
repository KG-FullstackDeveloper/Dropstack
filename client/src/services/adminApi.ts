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

/*
 * Kept for compatibility with existing code.
 *
 * Normal login does NOT require this.
 * Two-factor authentication can be enabled later
 * as an optional account-security feature.
 */
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
  delivery?:
    | "email"
    | "email_and_sms";
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

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  price?: number;
  sku?: string | null;
  stock?: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  title?: string;
  slug: string;
  handle?: string;

  sku?: string | null;

  description: string;
  bodyHtml?: string;

  category: string;

  price: number;
  currency: string;

  imageUrl?: string | null;
  image_url?: string | null;

  images: string[];

  videoUrl?: string | null;

  supplierName?: string | null;
  supplierProductId?: string | null;

  warehouseCountry?: string | null;

  processingTime?: string | null;
  deliveryTime?: string | null;

  supplierCost: number;
  shippingCost: number;
  otherCost: number;

  profitPerUnit: number;
  profitMargin: number;

  stock: number;
  lowStockThreshold: number;

  variants: ProductVariant[];

  active: boolean;

  createdAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Product CSV import types                                                   */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

function getToken(): string | null {
  return localStorage.getItem(
    "admin_token"
  );
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers = new Headers(
    options.headers
  );

  /*
   * Do not force JSON for FormData.
   *
   * This is important for CSV/image uploads.
   */
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
      credentials: "include",
    }
  );

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  let result: unknown;

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    result = await response.json();
  } else {
    result = await response.text();
  }

  if (!response.ok) {
    let errorMessage =
      `Request failed with status ${response.status}.`;

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
        errorMessage =
          body.message;
      }

      if (
        typeof body.details === "string"
      ) {
        details =
          body.details.trim();
      }
    }

    /*
     * Password recovery endpoints intentionally
     * do not clear an existing admin session.
     */
    const isAuthRequest =
      path === "/auth/login" ||
      path === "/auth/login/verify" ||
      path === "/auth/login/resend" ||
      path === "/auth/forgot-password" ||
      path ===
        "/auth/forgot-password/verify" ||
      path ===
        "/auth/forgot-password/reset";

    if (
      response.status === 401 &&
      !isAuthRequest
    ) {
      localStorage.removeItem(
        "admin_token"
      );
    }

    /*
     * Include backend details when available.
     *
     * This fixes the old situation where the UI only
     * showed "Unable to create product." while the
     * server had the real SQLite error in `details`.
     */
    throw new Error(
      details
        ? `${errorMessage} ${details}`
        : errorMessage
    );
  }

  if (
    result &&
    typeof result === "object"
  ) {
    const body =
      result as ApiResponse<T>;

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
          ? `${message} ${details}`
          : message
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

/*
 * Normal login:
 *
 * Email
 * Password
 * Sign in
 *
 * No verification-code screen is shown.
 */
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
      }
    );

  /*
   * Compatibility check for an older backend.
   *
   * The current backend should return token + admin
   * directly during normal login.
   */
  if (
    result.requiresTwoFactor &&
    result.challenge
  ) {
    return {
      requiresTwoFactor: true,
      challenge:
        result.challenge,
    } as never;
  }

  if (
    !result.token ||
    !result.admin
  ) {
    throw new Error(
      "The server returned an incomplete login response."
    );
  }

  localStorage.setItem(
    "admin_token",
    result.token
  );

  return {
    token: result.token,
    admin: result.admin,
  };
}

/*
 * Kept for future optional 2FA account-security
 * settings. It is NOT used by normal login.
 */
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
      }
    );

  if (
    !result.token ||
    !result.admin
  ) {
    throw new Error(
      "The server returned an incomplete verification response."
    );
  }

  localStorage.setItem(
    "admin_token",
    result.token
  );

  return result;
}

/*
 * Kept for future optional 2FA account-security
 * settings. It is NOT used by normal login.
 */
export async function resendLoginTwoFactor(
  adminId: string,
): Promise<{
  method:
    | "email"
    | "email_and_sms";
  expiresInSeconds: number;
}> {
  return request(
    "/auth/login/resend",
    {
      method: "POST",
      body: JSON.stringify({
        adminId,
      }),
    }
  );
}

export async function logout(): Promise<void> {
  try {
    await request(
      "/auth/logout",
      {
        method: "POST",
      }
    );
  } finally {
    localStorage.removeItem(
      "admin_token"
    );
  }
}

export async function getMe(): Promise<AdminUser> {
  return request<AdminUser>(
    "/auth/me",
    {
      method: "GET",
    }
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
): Promise<{
  message: string;
}> {
  return request(
    "/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    }
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
    }
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
      body: JSON.stringify({
        email,
      }),
    }
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
      }
    );

  if (
    !result.resetToken
  ) {
    throw new Error(
      "The server did not return a valid password reset session."
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
    }
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
    {
      method: "GET",
    }
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
    }
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
    }
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
    }
  );
}

export async function apiDelete<T>(
  path: string,
): Promise<T> {
  return request<T>(
    path,
    {
      method: "DELETE",
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Multipart / File API                                                       */
/* -------------------------------------------------------------------------- */

/*
 * Used for CSV imports and future media uploads.
 *
 * FormData must NOT have a manually assigned
 * Content-Type header because the browser needs
 * to generate the multipart boundary itself.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  method:
    | "POST"
    | "PUT"
    | "PATCH" = "POST",
): Promise<T> {
  return request<T>(
    path,
    {
      method,
      body: formData,
    }
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
    await apiGet<unknown>(
      "/admin/orders"
    );

  if (Array.isArray(result)) {
    return result;
  }

  if (
    result &&
    typeof result === "object"
  ) {
    const data =
      result as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(
        data.orders
      )
    ) {
      return data.orders;
    }
  }

  return [];
}

export async function getCustomers(): Promise<any[]> {
  const result =
    await apiGet<unknown>(
      "/admin/customers"
    );

  if (Array.isArray(result)) {
    return result;
  }

  if (
    result &&
    typeof result === "object"
  ) {
    const data =
      result as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(
        data.customers
      )
    ) {
      return data.customers;
    }
  }

  return [];
}

export async function getAdminStats(): Promise<any> {
  return apiGet(
    "/admin/stats"
  );
}

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

export async function getProducts(): Promise<AdminProduct[]> {
  const result =
    await apiGet<unknown>(
      "/products/all"
    );

  if (Array.isArray(result)) {
    return result as AdminProduct[];
  }

  if (
    result &&
    typeof result === "object"
  ) {
    const data =
      result as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(
        data.products
      )
    ) {
      return data.products as AdminProduct[];
    }

    if (
      Array.isArray(
        data.data
      )
    ) {
      return data.data as AdminProduct[];
    }
  }

  return [];
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  return getProducts();
}

export async function createProduct(
  product: unknown,
): Promise<AdminProduct> {
  return apiPost<AdminProduct>(
    "/products",
    product
  );
}

export async function updateProduct(
  productId: string,
  product: unknown,
): Promise<AdminProduct> {
  return apiPatch<AdminProduct>(
    `/products/${encodeURIComponent(
      productId
    )}`,
    product
  );
}

export async function deleteProduct(
  productId: string,
): Promise<any> {
  return apiDelete(
    `/products/${encodeURIComponent(
      productId
    )}`
  );
}

/*
 * Find an existing product by SKU.
 *
 * Useful for Shopify-style CSV importing where
 * a SKU can identify an existing product.
 */
export async function findProductBySku(
  sku: string,
): Promise<AdminProduct | null> {
  const normalizedSku =
    sku.trim().toLowerCase();

  if (!normalizedSku) {
    return null;
  }

  const products =
    await getAdminProducts();

  return (
    products.find(
      (product) =>
        String(
          product.sku || ""
        )
          .trim()
          .toLowerCase() ===
        normalizedSku
    ) || null
  );
}

/*
 * Find an existing product by handle/slug.
 *
 * Shopify CSV files normally use Handle.
 */
export async function findProductByHandle(
  handle: string,
): Promise<AdminProduct | null> {
  const normalizedHandle =
    handle.trim().toLowerCase();

  if (!normalizedHandle) {
    return null;
  }

  const products =
    await getAdminProducts();

  return (
    products.find(
      (product) =>
        String(
          product.slug ||
            product.handle ||
            ""
        )
          .trim()
          .toLowerCase() ===
        normalizedHandle
    ) || null
  );
}

/* -------------------------------------------------------------------------- */
/* Product CSV Import                                                         */
/* -------------------------------------------------------------------------- */

/*
 * Upload a CSV file to the backend.
 *
 * The backend can parse Shopify-style CSV files,
 * dropshipping CSV files, and your custom template.
 */
export async function importProductsCsv(
  file: File,
  options?: {
    updateExisting?: boolean;
    skipExisting?: boolean;
  },
): Promise<ProductImportResult> {
  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  if (
    options?.updateExisting !==
    undefined
  ) {
    formData.append(
      "updateExisting",
      String(
        options.updateExisting
      )
    );
  }

  if (
    options?.skipExisting !==
    undefined
  ) {
    formData.append(
      "skipExisting",
      String(
        options.skipExisting
      )
    );
  }

  return apiUpload<ProductImportResult>(
    "/products/import-csv",
    formData,
    "POST"
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
    `/orders/${encodeURIComponent(
      orderId
    )}`,
    update
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
    update
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
    settings
  );
}

/* -------------------------------------------------------------------------- */
/* Analytics                                                                  */
/* -------------------------------------------------------------------------- */

export async function getAnalytics(): Promise<any> {
  return apiGet(
    "/analytics"
  );
}

/* -------------------------------------------------------------------------- */
/* Business health                                                            */
/* -------------------------------------------------------------------------- */

export async function getBusinessHealth(): Promise<any> {
  return apiGet(
    "/business-health"
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
    }
  );
}

export { API_URL };