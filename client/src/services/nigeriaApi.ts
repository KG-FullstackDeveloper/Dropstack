const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface NigeriaDashboard {
  products: {
    total_products: number;
    active_products: number;
    total_inventory: number;
  };
  orders: {
    total_orders: number;
    revenue: number;
    profit: number;
    paid_orders: number;
  };
  customers: number;
  pendingFulfillment: number;
  currency: "NGN";
  workspace: "nigeria";
}

export interface NigeriaSettings {
  id: string;
  store_name: string;
  supplier_name: string | null;
  payment_method: string;
  default_shipping_fee: number;
  delivery_estimate: string;
  currency: string;
  country: string;
  updated_at: string;
}

export interface NigeriaProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  currency: string;

  image_url: string | null;
  video_url: string | null;

  supplier_name: string | null;
  supplier_product_id: string | null;

  supplier_cost: number;
  shipping_cost: number;
  other_cost: number;

  inventory: number;
  low_stock_threshold: number;

  profit_per_unit: number;
  profit_margin: number;

  active: number;

  created_at: string;
  updated_at: string;
}

export interface NigeriaOrder {
  id: string;

  customer_id: string | null;

  customer_name: string;
  customer_email: string;
  customer_phone: string;

  shipping_address: string;
  city: string;
  state: string;
  postal_code: string | null;

  country: string;
  currency: string;

  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;

  supplier_cost_total: number;
  shipping_cost_total: number;
  other_cost_total: number;
  profit: number;
  profit_margin: number;

  payment_status: string;
  settlement_status: string;
  order_status: string;

  payment_provider: string | null;
  flutterwave_transaction_id: string | null;
  flutterwave_reference: string | null;

  supplier_name: string | null;
  supplier_order_reference: string | null;
  tracking_number: string | null;

  estimated_delivery: string | null;

  created_at: string;
  updated_at: string;
}

export interface NigeriaCustomer {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;

  total_orders: number;
  total_spent: number;

  created_at: string;
  updated_at: string;
}

export interface NigeriaInventoryItem {
  id: string;
  name: string;
  category: string;
  active: number;
  quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
}

export interface CreateNigeriaProductInput {
  name: string;
  description?: string;
  category?: string;
  price?: number;
  supplierCost?: number;
  shippingCost?: number;
  otherCost?: number;
  inventory?: number;
  lowStockThreshold?: number;
  imageUrl?: string;
  videoUrl?: string;
  supplierName?: string;
  supplierProductId?: string;
  active?: boolean;
}

export interface UpdateNigeriaProductInput {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  supplierCost?: number;
  shippingCost?: number;
  otherCost?: number;
  inventory?: number;
  lowStockThreshold?: number;
  imageUrl?: string | null;
  videoUrl?: string | null;
  supplierName?: string | null;
  supplierProductId?: string | null;
  active?: boolean;
}

export interface UpdateNigeriaSettingsInput {
  storeName?: string;
  supplierName?: string;
  paymentMethod?: string;
  shippingFee?: number;
  deliveryEstimate?: string;
}

export interface CreateNigeriaOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateNigeriaOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  state: string;
  postalCode?: string;
  items: CreateNigeriaOrderItemInput[];
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

function getToken(): string | null {
  return localStorage.getItem("admin_token");
}

/* -------------------------------------------------------------------------- */
/* Request                                                                    */
/* -------------------------------------------------------------------------- */

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);

  if (
    options.body &&
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
      `Bearer ${token}`,
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
      credentials: "include",
    },
  );

  const contentType =
    response.headers.get(
      "content-type",
    ) || "";

  let result: unknown;

  if (
    contentType.includes(
      "application/json",
    )
  ) {
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

    if (response.status === 401) {
      localStorage.removeItem(
        "admin_token",
      );
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
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export async function getNigeriaDashboard(): Promise<NigeriaDashboard> {
  return request<NigeriaDashboard>(
    "/nigeria/dashboard",
    {
      method: "GET",
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

export async function getNigeriaSettings(): Promise<NigeriaSettings> {
  return request<NigeriaSettings>(
    "/nigeria/settings",
    {
      method: "GET",
    },
  );
}

export async function updateNigeriaSettings(
  settings: UpdateNigeriaSettingsInput,
): Promise<NigeriaSettings> {
  return request<NigeriaSettings>(
    "/nigeria/settings",
    {
      method: "PATCH",
      body: JSON.stringify(settings),
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

export async function getNigeriaProducts(): Promise<NigeriaProduct[]> {
  return request<NigeriaProduct[]>(
    "/nigeria/products",
    {
      method: "GET",
    },
  );
}

export async function createNigeriaProduct(
  product: CreateNigeriaProductInput,
): Promise<NigeriaProduct> {
  return request<NigeriaProduct>(
    "/nigeria/products",
    {
      method: "POST",
      body: JSON.stringify(product),
    },
  );
}

export async function updateNigeriaProduct(
  id: string,
  product: UpdateNigeriaProductInput,
): Promise<NigeriaProduct> {
  return request<NigeriaProduct>(
    `/nigeria/products/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(product),
    },
  );
}

export async function deleteNigeriaProduct(
  id: string,
): Promise<void> {
  await request<unknown>(
    `/nigeria/products/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

export async function getNigeriaOrders(): Promise<NigeriaOrder[]> {
  return request<NigeriaOrder[]>(
    "/nigeria/orders",
    {
      method: "GET",
    },
  );
}

export async function createNigeriaOrder(
  order: CreateNigeriaOrderInput,
): Promise<NigeriaOrder> {
  return request<NigeriaOrder>(
    "/nigeria/orders",
    {
      method: "POST",
      body: JSON.stringify(order),
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Customers                                                                  */
/* -------------------------------------------------------------------------- */

export async function getNigeriaCustomers(): Promise<NigeriaCustomer[]> {
  return request<NigeriaCustomer[]>(
    "/nigeria/customers",
    {
      method: "GET",
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Inventory                                                                  */
/* -------------------------------------------------------------------------- */

export async function getNigeriaInventory(): Promise<NigeriaInventoryItem[]> {
  return request<NigeriaInventoryItem[]>(
    "/nigeria/inventory",
    {
      method: "GET",
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Generic Nigeria API                                                        */
/* -------------------------------------------------------------------------- */

export async function nigeriaApiGet<T>(
  path: string,
): Promise<T> {
  return request<T>(path, {
    method: "GET",
  });
}

export async function nigeriaApiPost<T>(
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

export async function nigeriaApiPatch<T>(
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

export { API_URL };