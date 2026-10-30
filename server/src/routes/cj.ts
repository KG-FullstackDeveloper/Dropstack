
import { Hono } from "hono";

const cj = new Hono();

const CJ_API_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

type CJApiResponse<T> = {
  code?: number;
  success?: boolean;
  result?: boolean;
  message?: string;
  data?: T;
};

type CJTokenData = {
  accessToken?: string;
  accessTokenExpiryDate?: string;
};

type CJObject = Record<string, unknown>;

const SUPPORTED_WAREHOUSES = [
  "ALL",
  "US",
  "GB",
  "CA",
  "AU",
  "DE",
  "FR",
  "ES",
  "IT",
  "PL",
  "CN",
] as const;

type WarehouseCode = (typeof SUPPORTED_WAREHOUSES)[number];

function isObject(value: unknown): value is CJObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readValue(object: CJObject, keys: string[]): string {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === "string" || typeof value === "number") {
      const result = String(value).trim();
      if (result) return result;
    }
  }

  return "";
}

function readNumber(
  object: CJObject,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (
      typeof value === "string" &&
      value.trim() !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return null;
}

function normalizeWarehouse(
  value: string | undefined,
): WarehouseCode | null {
  const code = (value || "ALL").trim().toUpperCase();

  return SUPPORTED_WAREHOUSES.includes(code as WarehouseCode)
    ? (code as WarehouseCode)
    : null;
}

/**
 * Safely collect URLs from known CJ image/video fields.
 * The raw CJ response is also returned so unrecognized fields
 * are not lost.
 */
function collectMediaUrls(
  object: CJObject,
  keys: string[],
): string[] {
  const urls: string[] = [];

  for (const key of keys) {
    const value = object[key];

    if (typeof value === "string") {
      const url = value.trim();

      if (/^https?:\/\//i.test(url)) {
        urls.push(url);
      }

      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === "string") {
          const url = entry.trim();

          if (/^https?:\/\//i.test(url)) {
            urls.push(url);
          }
        } else if (isObject(entry)) {
          const url = readValue(entry, [
            "url",
            "src",
            "imageUrl",
            "image",
            "videoUrl",
            "video",
          ]);

          if (/^https?:\/\//i.test(url)) {
            urls.push(url);
          }
        }
      }
    } else if (isObject(value)) {
      const url = readValue(value, [
        "url",
        "src",
        "imageUrl",
        "image",
        "videoUrl",
        "video",
      ]);

      if (/^https?:\/\//i.test(url)) {
        urls.push(url);
      }
    }
  }

  return [...new Set(urls)];
}

async function getCJAccessToken(): Promise<string> {
  if (
    cachedAccessToken &&
    Date.now() < tokenExpiresAt - 5 * 60 * 1000
  ) {
    return cachedAccessToken;
  }

  const apiKey = process.env.CJ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("CJ_API_KEY is missing. Check server/.env.");
  }

  const response = await fetch(
    `${CJ_API_BASE}/authentication/getAccessToken`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    },
  );

  const result =
    (await response.json()) as CJApiResponse<CJTokenData>;

  if (
    !response.ok ||
    result.success === false ||
    result.result === false ||
    !result.data?.accessToken
  ) {
    throw new Error(
      `CJ authentication failed: ${
        result.message || "Unable to obtain access token."
      }`,
    );
  }

  cachedAccessToken = result.data.accessToken;

  const expiry = result.data.accessTokenExpiryDate
    ? new Date(result.data.accessTokenExpiryDate).getTime()
    : Date.now() + 60 * 60 * 1000;

  tokenExpiresAt = Number.isFinite(expiry)
    ? expiry
    : Date.now() + 60 * 60 * 1000;

  return cachedAccessToken;
}

async function cjRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getCJAccessToken();

  const response = await fetch(`${CJ_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "CJ-Access-Token": token,
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  const result =
    (await response.json()) as CJApiResponse<T>;

  if (
    !response.ok ||
    result.success === false ||
    result.result === false ||
    (typeof result.code === "number" && result.code !== 200)
  ) {
    throw new Error(
      result.message || `CJ request failed (${response.status}).`,
    );
  }

  return result.data as T;
}

function normalizeProduct(product: CJObject) {
  const id = readValue(product, [
    "id",
    "pid",
    "productId",
    "product_id",
  ]);

  const name = readValue(product, [
    "nameEn",
    "nameen",
    "productNameEn",
    "productName",
    "name",
    "title",
  ]);

  const image = readValue(product, [
    "bigImage",
    "bigimg",
    "productImage",
    "productImageUrl",
    "imageUrl",
    "image",
  ]);

  const price = readValue(product, [
    "sellPrice",
    "sellprice",
    "nowPrice",
    "productPrice",
    "price",
    "totalPrice",
  ]);

  const sku = readValue(product, [
    "productSku",
    "sku",
    "spu",
  ]);

  const images = collectMediaUrls(product, [
    "productImageSet",
    "imageList",
    "images",
    "newImgList",
    "productImages",
  ]);

  const videos = collectMediaUrls(product, [
    "video",
    "videoUrl",
    "videoURL",
    "videos",
    "videoList",
    "productVideo",
    "productVideoList",
  ]);

  return {
    ...product,
    id,
    pid: readValue(product, ["pid"]) || id,
    productId: id,
    name: name || "Unnamed CJ product",
    title: name || "Unnamed CJ product",
    nameEn: name,
    image,
    bigImage: image,
    images: [...new Set([image, ...images].filter(Boolean))],
    videos,
    videoUrl: videos[0] || "",
    price,
    sellPrice: price,
    sku,
    raw: product,
  };
}

function extractProducts(data: unknown): {
  products: ReturnType<typeof normalizeProduct>[];
  total: number | null;
} {
  if (Array.isArray(data)) {
    return {
      products: data.filter(isObject).map(normalizeProduct),
      total: null,
    };
  }

  if (!isObject(data)) {
    return { products: [], total: null };
  }

  let candidates: unknown[] = [];

  if (Array.isArray(data.content)) {
    for (const entry of data.content) {
      if (!isObject(entry)) continue;

      if (Array.isArray(entry.productList)) {
        candidates.push(...entry.productList);
      } else if (Array.isArray(entry.list)) {
        candidates.push(...entry.list);
      } else {
        candidates.push(entry);
      }
    }
  }

  if (candidates.length === 0) {
    for (const key of [
      "list",
      "products",
      "productList",
      "records",
      "items",
    ]) {
      if (Array.isArray(data[key])) {
        candidates = data[key] as unknown[];
        break;
      }
    }
  }

  if (candidates.length === 0 && isObject(data.data)) {
    return extractProducts(data.data);
  }

  const totalValue =
    data.totalRecords ??
    data.total ??
    data.totalCount ??
    data.totalElements;

  const total =
    typeof totalValue === "number"
      ? totalValue
      : typeof totalValue === "string" &&
          Number.isFinite(Number(totalValue))
        ? Number(totalValue)
        : null;

  return {
    products: candidates.filter(isObject).map(normalizeProduct),
    total,
  };
}

function extractInventoryRows(data: unknown): CJObject[] {
  if (Array.isArray(data)) {
    return data.filter(isObject);
  }

  if (!isObject(data)) return [];

  for (const key of [
    "inventory",
    "inventories",
    "variantInventories",
    "stockList",
    "productStockList",
    "list",
    "records",
    "items",
  ]) {
    const value = data[key];

    if (Array.isArray(value)) {
      const rows: CJObject[] = [];

      for (const entry of value) {
        if (!isObject(entry)) continue;

        const nested = extractInventoryRows(entry);

        if (nested.length > 0) {
          rows.push(...nested);
        } else {
          rows.push(entry);
        }
      }

      return rows;
    }
  }

  return [];
}

function normalizeInventoryRow(row: CJObject) {
  const countryCode = readValue(row, [
    "countryCode",
    "areaCode",
    "valueEn",
  ]).toUpperCase();

  const warehouseName = readValue(row, [
    "areaEn",
    "areaName",
    "warehouseName",
    "storage",
  ]) || countryCode;

  const verifiedValue = readNumber(row, ["verifiedWarehouse"]);
  const verified = verifiedValue === null ? null : verifiedValue === 1;

  // CJ's stock/queryByVid response documents these as separate quantities:
  // cjInventoryNum = inventory managed by CJ; factoryInventoryNum = factory stock;
  // totalInventoryNum = the combined total. Never substitute the combined total
  // for ready-to-ship CJ-managed stock.
  let cjManagedStock = readNumber(row, ["cjInventoryNum", "cjInventory"]);
  const factoryManagedStock = readNumber(row, ["factoryInventoryNum", "factoryInventory"]);
  const totalInventory = readNumber(row, ["totalInventoryNum", "totalInventory", "storageNum"]);

  // Some responses expose CJ-managed quantities only in nested sub-warehouse rows.
  if (cjManagedStock === null && Array.isArray(row.stock)) {
    const nestedQuantities = row.stock
      .filter(isObject)
      .map((item) => readNumber(item, ["inventory"]))
      .filter((quantity): quantity is number => quantity !== null);
    if (nestedQuantities.length > 0) {
      cjManagedStock = nestedQuantities.reduce((sum, quantity) => sum + quantity, 0);
    }
  }

  return {
    countryCode,
    warehouseName,
    // This is CJ-managed stock, not the combined CJ + factory inventory.
    availableStock: cjManagedStock,
    cjManagedStock,
    factoryManagedStock,
    totalInventory,
    verified,
    raw: row,
  };
}

async function getVariantInventory(
  variantId: string,
): Promise<ReturnType<typeof normalizeInventoryRow>[]> {
  const params = new URLSearchParams({ vid: variantId });

  const data = await cjRequest<unknown>(
    `/product/stock/queryByVid?${params.toString()}`,
  );

  return extractInventoryRows(data)
    .map(normalizeInventoryRow)
    .filter((row) => row.countryCode !== "");
}

// Report connection status without exposing credentials.
cj.get("/status", (c) =>
  c.json({
    success: true,
    configured: Boolean(process.env.CJ_API_KEY?.trim()),
    provider: "CJdropshipping",
  }),
);

// Search one catalogue page at a time.
// The admin can request the next page instead of loading
// the entire catalogue in one request.
cj.get("/products", async (c) => {
  try {
    const keyword = (c.req.query("keyword") || "").trim();
    const warehouse = normalizeWarehouse(c.req.query("warehouse"));

    const page = Number(c.req.query("page") || 1);
    const size = Number(c.req.query("size") || 20);

    if (!warehouse) {
      return c.json(
        {
          success: false,
          error:
            "Unsupported warehouse. Use ALL, US, GB, CA, AU, DE, FR, ES, IT, PL, or CN.",
        },
        400,
      );
    }

    if (keyword.length > 150) {
      return c.json(
        { success: false, error: "Search keyword is too long." },
        400,
      );
    }

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > 1000 ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > 100
    ) {
      return c.json(
        {
          success: false,
          error: "Page must be 1–1000 and size must be 1–100.",
        },
        400,
      );
    }

    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    if (keyword) params.set("keyWord", keyword);

    if (warehouse !== "ALL") {
      params.set("countryCode", warehouse);
      params.set("verifiedWarehouse", "1");
      params.set("startWarehouseInventory", "1");
    }

    const data = await cjRequest<unknown>(
      `/product/listV2?${params.toString()}`,
    );

    const normalized = extractProducts(data);

    return c.json({
      success: true,
      data: normalized.products,
      total: normalized.total,
      page,
      size,
      hasMore:
        normalized.total === null
          ? normalized.products.length === size
          : page * size < normalized.total,
      warehouse,
      warehouseFilterApplied: warehouse !== "ALL",
      inventoryVerification:
        warehouse === "ALL"
          ? "not_requested"
          : "CJ country and verified-inventory search filters applied",
      notice:
        warehouse === "ALL"
          ? "No warehouse restriction was applied. Verify the intended warehouse before importing."
          : "Search results use CJ's selected-country filters. Check each variant's inventory before importing.",
    });
  } catch (error) {
    console.error("CJ product search failed:", error);

    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not search CJ products.",
      },
      502,
    );
  }
});

// Retrieve the complete available detail response, including
// the raw CJ response, variants, media, dimensions, and stock.
cj.get("/products/:id", async (c) => {
  try {
    const id = c.req.param("id").trim();
    const warehouse = normalizeWarehouse(c.req.query("warehouse"));

    if (!warehouse) {
      return c.json(
        { success: false, error: "Unsupported warehouse code." },
        400,
      );
    }

    if (!id || id.length > 200) {
      return c.json(
        { success: false, error: "Invalid CJ product ID." },
        400,
      );
    }

    const data = await cjRequest<unknown>(
      "/product/productDetail/query",
      {
        method: "POST",
        body: JSON.stringify({ id }),
      },
    );

    const detail = isObject(data) ? data : {};

    const rawVariants = Array.isArray(detail.stanProducts)
      ? detail.stanProducts.filter(isObject)
      : [];

    // Inventory requests are limited to the first 50 variants
    // and four concurrent requests to avoid overloading CJ.
    let nextIndex = 0;
    const variantsToCheck = rawVariants.slice(0, 50);

    const workers = Array.from(
      { length: Math.min(4, variantsToCheck.length) },
      async () => {
        while (nextIndex < variantsToCheck.length) {
          const index = nextIndex++;
          const variant = variantsToCheck[index];

          const variantId = readValue(variant, [
            "vid",
            "variantId",
            "stanProductId",
            "id",
          ]);

          let inventory:
            ReturnType<typeof normalizeInventoryRow>[] = [];
          let inventoryError: string | null = null;

          if (variantId) {
            try {
              inventory = await getVariantInventory(variantId);
            } catch (error) {
              inventoryError =
                error instanceof Error
                  ? error.message
                  : "Inventory lookup failed.";
            }
          } else {
            inventoryError = "CJ did not provide a variant ID.";
          }

          // The stock endpoint does not always return a verifiedWarehouse flag.
          // Use the explicit CJ-managed quantity returned per warehouse, not the
          // combined totalInventoryNum and not factory-managed inventory.
          const stockRows = inventory.filter((item) => item.cjManagedStock !== null);
          // ALL is for browsing the country-by-country breakdown only. Never
          // combine different countries into one sellable stock number: orders
          // ship to a destination, so stock must be checked for one country.
          const selectedRows = warehouse === "ALL"
            ? []
            : stockRows.filter((item) => item.countryCode === warehouse);

          const selectedWarehouseInventory = selectedRows.length === 0
            ? null
            : {
                countryCode: warehouse,
                warehouseName: selectedRows[0].warehouseName,
                availableStock: selectedRows.reduce(
                  (sum, item) => sum + (item.cjManagedStock ?? 0),
                  0,
                ),
                cjManagedStock: selectedRows.reduce(
                  (sum, item) => sum + (item.cjManagedStock ?? 0),
                  0,
                ),
                factoryManagedStock: selectedRows.reduce(
                  (sum, item) => sum + (item.factoryManagedStock ?? 0),
                  0,
                ),
                totalInventory: selectedRows.reduce(
                  (sum, item) => sum + (item.totalInventory ?? 0),
                  0,
                ),
                verified: selectedRows.every((item) => item.verified === true),
                raw: selectedRows.map((item) => item.raw),
              };

          const selectedWarehouseAvailable =
            selectedWarehouseInventory !== null &&
            selectedWarehouseInventory.availableStock !== null &&
            selectedWarehouseInventory.availableStock > 0;

          (variant as CJObject).__inventoryResult = {
            variantId,
            inventory,
            selectedWarehouse: warehouse,
            selectedWarehouseInventory,
            selectedWarehouseAvailable,
            // Successful direct stock lookup is separate from CJ's verified-listing flag.
            inventoryLookupSuccessful:
              inventoryError === null &&
              (warehouse === "ALL" ? inventory.length > 0 : selectedWarehouseInventory !== null),
            inventoryVerified:
              inventoryError === null &&
              selectedWarehouseInventory?.verified === true &&
              selectedWarehouseInventory.availableStock !== null,
            inventoryError,
          };
        }
      },
    );

    await Promise.all(workers);

    const variants = rawVariants.map((variant) => {
      const inventoryResult = isObject(
        variant.__inventoryResult,
      )
        ? variant.__inventoryResult
        : null;

      const variantId = readValue(variant, [
        "vid",
        "variantId",
        "stanProductId",
        "id",
      ]);

      return {
        id: variantId,
        variantId,
        pid: readValue(variant, ["pid"]),
        name: readValue(variant, [
          "nameen",
          "nameEn",
          "name",
          "variantName",
        ]),
        sku: readValue(variant, ["sku", "variantSku"]),
        price: readValue(variant, [
          "sellprice",
          "sellPrice",
          "price",
        ]),
        image: readValue(variant, ["img", "image"]),
        weight: readNumber(variant, [
          "weight",
          "productWeight",
          "grams",
        ]),
        dimensions: {
          length: readNumber(variant, ["length", "productLength"]),
          width: readNumber(variant, ["width", "productWidth"]),
          height: readNumber(variant, ["height", "productHeight"]),
        },
        inventory: inventoryResult
          ? inventoryResult.inventory
          : [],
        selectedWarehouse: warehouse,
        selectedWarehouseInventory: inventoryResult
          ? inventoryResult.selectedWarehouseInventory
          : null,
        selectedWarehouseAvailable: inventoryResult
          ? inventoryResult.selectedWarehouseAvailable
          : null,
        inventoryVerified: inventoryResult
          ? inventoryResult.inventoryVerified
          : false,
        inventoryLookupSuccessful: inventoryResult
          ? inventoryResult.inventoryLookupSuccessful
          : false,
        inventoryError: inventoryResult
          ? inventoryResult.inventoryError
          : "Inventory lookup was not completed for this variant.",
        raw: variant,
      };
    });

    const gallery = [
      ...new Set([
        ...collectMediaUrls(detail, [
          "newImgList",
          "productImageSet",
          "imageList",
          "images",
          "productImages",
        ]),
        ...collectMediaUrls(detail, [
          "bigimg",
          "bigImage",
          "img",
          "image",
        ]),
      ]),
    ];

    const videos = collectMediaUrls(detail, [
      "video",
      "videoUrl",
      "videoURL",
      "videos",
      "videoList",
      "productVideo",
      "productVideoList",
    ]);

    return c.json({
      success: true,
      data: {
        id: readValue(detail, ["id", "pid"]) || id,
        name: readValue(detail, [
          "nameen",
          "nameEn",
          "productNameEn",
          "productName",
          "name",
        ]),
        sku: readValue(detail, ["sku", "productSku"]),
        category: readValue(detail, [
          "category",
          "categoryName",
          "categoryId",
        ]),
        price: readValue(detail, [
          "sellprice",
          "sellPrice",
          "price",
        ]),
        currency: readValue(detail, ["currency", "currencyCode"]),
        image:
          readValue(detail, ["bigimg", "bigImage", "img"]) ||
          gallery[0] ||
          "",
        gallery,
        videos,
        videoUrl: videos[0] || "",
        weight: readNumber(detail, [
          "weight",
          "productWeight",
          "grams",
        ]),
        dimensions: {
          length: readNumber(detail, [
            "length",
            "productLength",
          ]),
          width: readNumber(detail, [
            "width",
            "productWidth",
          ]),
          height: readNumber(detail, [
            "height",
            "productHeight",
          ]),
        },
        selectedWarehouse: warehouse,
        variants,
        inventoryLookupLimit: 50,
        inventoryNote:
          warehouse === "ALL"
            ? "availableStock is the sum of CJ-managed quantities returned for the listed warehouses. Factory-managed quantities are separate and excluded. This aggregate is not a guarantee that stock is available in one destination warehouse."
            : "availableStock is CJ-managed quantity returned for the selected warehouse. Factory-managed quantities are separate and excluded.",
        stockQuantityMeaning: "availableStock/cjManagedStock = stock managed directly by CJ; factoryManagedStock = factory-managed stock; totalInventory = combined total and must not be used as ready-to-ship stock. Product-list totalVerifiedInventory is a separate verified listing figure.",
        description:
          typeof detail.description === "string"
            ? detail.description
            : typeof detail.descriptionEn === "string"
              ? detail.descriptionEn
              : "",
        raw: detail,
      },
    });
  } catch (error) {
    console.error("CJ product details failed:", error);

    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not retrieve CJ product details.",
      },
      502,
    );
  }
});

export default cj;
