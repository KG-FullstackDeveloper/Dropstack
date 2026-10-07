import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent } from "react";
import {
  Check,
  Edit3,
  ImagePlus,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
  updateProduct,
} from "../../services/adminApi";
import type {
  CreateProductInput,
  Product,
  ProductVariant,
} from "../../types/product";

type StockFilter = "all" | "healthy" | "low" | "out";
type StatusFilter = "all" | "active" | "inactive";

interface ProductFormState {
  name: string;
  slug: string;
  sku: string;
  category: string;
  description: string;
  price: string;
  currency: string;
  supplierName: string;
  supplierProductId: string;
  warehouseCountry: string;
  supplierCost: string;
  shippingCost: string;
  otherCost: string;
  processingTime: string;
  deliveryTime: string;
  stock: string;
  lowStockThreshold: string;
  imageUrl: string;
  images: string[];
  videoUrl: string;
  active: boolean;
  priceMode: "manual" | "recommended";
  variants: ProductVariant[];
}

interface CsvRow {
  [key: string]: string;
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

const emptyForm: ProductFormState = {
  name: "",
  slug: "",
  sku: "",
  category: "",
  description: "",
  price: "",
  currency: "USD",
  supplierName: "",
  supplierProductId: "",
  warehouseCountry: "",
  supplierCost: "",
  shippingCost: "",
  otherCost: "0",
  processingTime: "",
  deliveryTime: "",
  stock: "",
  lowStockThreshold: "5",
  imageUrl: "",
  images: [],
  videoUrl: "",
  active: true,
  priceMode: "manual",
  variants: [],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function money(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  } catch {
    return `${currency || "USD"} ${
      Number.isFinite(value) ? value.toFixed(2) : "0.00"
    }`;
  }
}

function numberValue(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const text = String(value ?? "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  if (!text || text === "-" || text === ".") return 0;

  const parsed = Number(text);

  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalNumber(
  value: string | number | null | undefined,
) {
  const text = String(value ?? "").trim();

  if (!text) return undefined;

  return numberValue(text);
}

function calculateRecommendedPrice(
  supplierCost: string,
  shippingCost: string,
  otherCost: string,
) {
  const total =
    numberValue(supplierCost) +
    numberValue(shippingCost) +
    numberValue(otherCost);

  return total > 0 ? Number((total * 2.5).toFixed(2)) : 0;
}

function productToForm(product: Product): ProductFormState {
  return {
    name: product.name || "",
    slug: product.slug || "",
    sku: product.sku || "",
    category: product.category || "",
    description: product.description || "",
    price: String(product.price ?? ""),
    currency: product.currency || "USD",
    supplierName: product.supplier_name || "",
    supplierProductId: product.supplier_product_id || "",
    warehouseCountry: product.warehouse_country || "",
    supplierCost: String(product.supplier_cost ?? ""),
    shippingCost: String(product.shipping_cost ?? ""),
    otherCost: String(product.other_cost ?? 0),
    processingTime: product.processing_time || "",
    deliveryTime: product.delivery_time || "",
    stock:
      product.stock == null
        ? ""
        : String(product.stock),
    lowStockThreshold:
      product.low_stock_threshold == null
        ? "5"
        : String(product.low_stock_threshold),
    imageUrl:
      product.image_url ||
      product.images?.[0] ||
      "",
    images: product.images || [],
    videoUrl: product.video_url || "",
    active: Number(product.active) === 1,
    priceMode: "manual",
    variants: product.variants || [],
  };
}

function getStockState(product: Product) {
  const stock = numberValue(product.stock);
  const threshold = numberValue(
    product.low_stock_threshold ?? 5,
  );

  if (stock <= 0) return "out";
  if (stock <= threshold) return "low";

  return "healthy";
}

/* -------------------------------------------------------------------------- */
/* CSV ENGINE                                                                 */
/* -------------------------------------------------------------------------- */

function normalizeCsvHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\([^)]*\)/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseCsvRecords(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];

  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
        continue;
      }

      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(cell);
      cell = "";

      if (
        row.some(
          (value) => value.trim().length > 0,
        )
      ) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);

    if (
      row.some(
        (value) => value.trim().length > 0,
      )
    ) {
      rows.push(row);
    }
  }

  return rows;
}

function parseCsv(text: string): CsvRow[] {
  const records = parseCsvRecords(text);

  if (records.length < 2) return [];

  const headers = records[0].map(normalizeCsvHeader);

  return records
    .slice(1)
    .map((values) => {
      const row: CsvRow = {};

      headers.forEach((header, index) => {
        row[header] =
          String(values[index] ?? "").trim();
      });

      return row;
    })
    .filter((row) =>
      Object.values(row).some(
        (value) => value.trim() !== "",
      ),
    );
}

function firstValue(
  row: CsvRow,
  aliases: string[],
) {
  for (const alias of aliases) {
    const value = row[normalizeCsvHeader(alias)];

    if (value != null && value.trim() !== "") {
      return value.trim();
    }
  }

  return "";
}

function splitList(value: string) {
  if (!value.trim()) return [];

  return value
    .split(/[\n|;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(
  value: string,
  fallback = true,
) {
  const normalized = value
    .trim()
    .toLowerCase();

  if (!normalized) return fallback;

  if (
    [
      "true",
      "yes",
      "y",
      "1",
      "active",
      "published",
      "publish",
      "enabled",
    ].includes(normalized)
  ) {
    return true;
  }

  if (
    [
      "false",
      "no",
      "n",
      "0",
      "inactive",
      "draft",
      "archived",
      "unpublished",
      "disabled",
    ].includes(normalized)
  ) {
    return false;
  }

  return fallback;
}

function parseProductStatus(
  status: string,
  published: string,
) {
  const normalized = status
    .trim()
    .toLowerCase();

  if (
    normalized === "draft" ||
    normalized === "archived"
  ) {
    return false;
  }

  if (normalized === "active") {
    return true;
  }

  return parseBoolean(published, true);
}

function getRowImages(row: CsvRow) {
  const values = [
    firstValue(row, [
      "image_src",
      "image_source",
      "image_url",
      "product_image_url",
      "product_image",
      "image",
      "image_urls",
      "images",
    ]),
    firstValue(row, [
      "variant_image",
      "variant_image_url",
    ]),
  ];

  return Array.from(
    new Set(
      values
        .flatMap(splitList)
        .filter((value) =>
          /^https?:\/\//i.test(value),
        ),
    ),
  );
}

function getRowHandle(row: CsvRow) {
  return firstValue(row, [
    "handle",
    "slug",
    "product_handle",
    "url_handle",
    "product_slug",
  ]);
}

function getRowName(row: CsvRow) {
  return firstValue(row, [
    "title",
    "product_name",
    "name",
    "product_title",
  ]);
}

function getRowSku(row: CsvRow) {
  return firstValue(row, [
    "variant_sku",
    "sku",
    "supplier_sku",
    "supplier_sku_code",
    "product_sku",
  ]);
}

function getRowPrice(row: CsvRow) {
  return firstValue(row, [
    "variant_price",
    "retail_price",
    "price",
    "selling_price",
    "sale_price",
    "product_price",
  ]);
}

function getRowStock(row: CsvRow) {
  return firstValue(row, [
    "variant_inventory_qty",
    "inventory_quantity",
    "inventory_qty",
    "stock",
    "quantity",
    "inventory",
  ]);
}

function getRowCurrency(row: CsvRow) {
  return (
    firstValue(row, [
      "currency",
      "variant_currency",
      "price_currency",
    ]) || "USD"
  ).toUpperCase();
}

function getRowOptionName(
  row: CsvRow,
  index: 1 | 2 | 3,
) {
  return firstValue(row, [
    `option${index}_name`,
    `option_${index}_name`,
    `option${index}`,
  ]);
}

function getRowOptionValue(
  row: CsvRow,
  index: 1 | 2 | 3,
) {
  return firstValue(row, [
    `option${index}_value`,
    `option_${index}_value`,
  ]);
}

function buildVariantFromCsvRow(
  row: CsvRow,
  rowIndex: number,
  fallbackPrice: number,
) {
  const sku = getRowSku(row);
  const price =
    numberValue(getRowPrice(row)) ||
    fallbackPrice;

  const stockText = getRowStock(row);
  const stock = stockText
    ? numberValue(stockText)
    : 0;

  const optionParts: string[] = [];

  for (const optionIndex of [1, 2, 3] as const) {
    const name = getRowOptionName(
      row,
      optionIndex,
    );

    const value = getRowOptionValue(
      row,
      optionIndex,
    );

    if (value) {
      optionParts.push(
        name
          ? `${name}: ${value}`
          : value,
      );
    }
  }

  if (!sku && !optionParts.length) {
    return null;
  }

  return {
    id: `csv-variant-${Date.now()}-${rowIndex}`,
    name:
      optionParts.length > 0
        ? optionParts.join(" / ")
        : "Default",
    value:
      optionParts.length > 0
        ? optionParts.join(" / ")
        : "Default",
    price: String(price),
    sku,
    stock: String(stock),
  } satisfies ProductVariant;
}

function buildCsvProduct(
  row: CsvRow,
  rowIndex: number,
): {
  payload: CreateProductInput;
  handle: string;
  variant: ProductVariant | null;
  images: string[];
} {
  const name = getRowName(row);

  if (!name) {
    throw new Error(
      "Product title/name is missing.",
    );
  }

  const supplierCost = numberValue(
    firstValue(row, [
      "wholesale_cost",
      "supplier_cost",
      "cost",
      "unit_cost",
      "purchase_price",
      "supplier_price",
    ]),
  );

  const shippingCost = numberValue(
    firstValue(row, [
      "shipping_cost",
      "supplier_shipping_cost",
      "shipping",
      "freight_cost",
    ]),
  );

  const otherCost = numberValue(
    firstValue(row, [
      "other_cost",
      "additional_cost",
      "fees",
      "fee",
    ]),
  );

  const price = numberValue(
    getRowPrice(row),
  );

  const recommendedPrice =
    calculateRecommendedPrice(
      String(supplierCost),
      String(shippingCost),
      String(otherCost),
    );

  const finalPrice =
    price > 0
      ? price
      : recommendedPrice;

  if (finalPrice <= 0) {
    throw new Error(
      "A valid retail/variant price or valid product costs are required.",
    );
  }

  const handle =
    getRowHandle(row) ||
    slugify(name);

  const sku =
    getRowSku(row) || undefined;

  const images = getRowImages(row);

  const description = firstValue(row, [
    "body_html",
    "body",
    "description",
    "product_description",
    "short_description",
  ]);

  const category =
    firstValue(row, [
      "type",
      "category",
      "product_type",
      "product_category",
    ]) || "Uncategorized";

  const supplierName =
    firstValue(row, [
      "vendor",
      "supplier_name",
      "supplier",
      "supplier",
      "brand",
    ]) || undefined;

  const supplierProductId =
    firstValue(row, [
      "supplier_product_id",
      "supplier_product",
      "spu",
      "product_id",
      "supplier_id",
    ]) || undefined;

  const warehouseCountry =
    firstValue(row, [
      "warehouse_country",
      "warehouse",
      "warehouse_location",
      "ship_from",
      "country_of_origin",
    ]) || undefined;

  const deliveryTime =
    firstValue(row, [
      "delivery_time",
      "delivery_estimate",
      "shipping_time",
      "estimated_delivery",
      "delivery",
    ]) || undefined;

  const processingTime =
    firstValue(row, [
      "processing_time",
      "processing",
      "handling_time",
    ]) || undefined;

  const stockText = getRowStock(row);

  const stock =
    stockText !== ""
      ? numberValue(stockText)
      : undefined;

  const lowStockText = firstValue(row, [
    "low_stock_threshold",
    "low_stock",
    "inventory_threshold",
  ]);

  const lowStockThreshold =
    lowStockText !== ""
      ? numberValue(lowStockText)
      : undefined;

  const currency = getRowCurrency(row);

  const variant = buildVariantFromCsvRow(
    row,
    rowIndex,
    finalPrice,
  );

  const published = firstValue(row, [
    "published",
    "published_at",
    "visible",
  ]);

  const status = firstValue(row, [
    "status",
    "product_status",
  ]);

  const active = parseProductStatus(
    status,
    published,
  );

  const payload: CreateProductInput = {
    name: name.trim(),
    slug: handle,
    sku,
    category,
    description,
    price: finalPrice,
    currency,
    image_url:
      images[0] ||
      firstValue(row, [
        "image_url",
        "image_src",
      ]) ||
      undefined,
    images,
    video_url:
      firstValue(row, [
        "video_url",
        "video",
        "product_video",
      ]) || undefined,
    supplier_name: supplierName,
    supplier_product_id:
      supplierProductId,
    warehouse_country:
      warehouseCountry,
    supplier_cost: supplierCost,
    shipping_cost: shippingCost,
    other_cost: otherCost,
    processing_time:
      processingTime,
    delivery_time:
      deliveryTime,
    stock,
    low_stock_threshold:
      lowStockThreshold,
    variants: variant
      ? [variant]
      : [],
    active: active ? 1 : 0,
  };

  return {
    payload,
    handle,
    variant,
    images,
  };
}

function mergeVariants(
  existing: ProductVariant[] = [],
  incoming: ProductVariant | null,
) {
  if (!incoming) return existing;

  const key =
    incoming.sku ||
    `${incoming.name}:${incoming.value}`;

  const existingIndex = existing.findIndex(
    (variant) =>
      (variant.sku || "") === key ||
      `${variant.name}:${variant.value}` === key,
  );

  if (existingIndex === -1) {
    return [...existing, incoming];
  }

  return existing.map(
    (variant, index) =>
      index === existingIndex
        ? {
            ...variant,
            ...incoming,
          }
        : variant,
  );
}

function mergeImages(
  existing: string[] = [],
  incoming: string[] = [],
) {
  return Array.from(
    new Set([
      ...existing,
      ...incoming,
    ]),
  ).filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/* CSV TEMPLATE                                                               */
/* -------------------------------------------------------------------------- */

function escapeCsv(value: string) {
  return `"${String(value).replace(
    /"/g,
    '""',
  )}"`;
}

function downloadCsvTemplate() {
  const headers = [
    "Handle",
    "Title",
    "Body (HTML)",
    "Vendor",
    "Type",
    "Tags",
    "Published",
    "Status",
    "Option1 Name",
    "Option1 Value",
    "Option2 Name",
    "Option2 Value",
    "Option3 Name",
    "Option3 Value",
    "Variant SKU",
    "Variant Price",
    "Variant Inventory Qty",
    "Image Src",
    "Image Alt Text",
    "Variant Image",
    "supplier_sku",
    "supplier_product_id",
    "warehouse_country",
    "wholesale_cost",
    "shipping_cost",
    "other_cost",
    "processing_time",
    "delivery_time",
    "low_stock_threshold",
    "currency",
  ];

  const example = [
    "elevated-cat-feeding-bowl",
    "Ergonomic 15 Degree Elevated Stainless Steel Cat Feeding Bowl",
    "<p>Premium elevated stainless steel feeding bowl.</p>",
    "My Store",
    "Pet Supplies",
    "cat,bowl,pet",
    "true",
    "active",
    "Size",
    "Medium",
    "",
    "",
    "",
    "",
    "SUPPLIER-SKU-001",
    "37.50",
    "25",
    "https://example.com/product-image.jpg",
    "Elevated stainless steel cat bowl",
    "",
    "SUPPLIER-SKU-001",
    "SUPPLIER-PRODUCT-001",
    "CN",
    "10.00",
    "5.00",
    "0",
    "1-3 business days",
    "7-15 business days",
    "5",
    "USD",
  ];

  const csv = [
    headers.map(escapeCsv).join(","),
    example.map(escapeCsv).join(","),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download =
    "global-product-import-template.csv";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

/* -------------------------------------------------------------------------- */
/* PRODUCT MODAL                                                              */
/* -------------------------------------------------------------------------- */

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function ProductModal({
  product,
  onClose,
  onSaved,
}: ProductModalProps) {
  const [form, setForm] =
    useState<ProductFormState>(() =>
      product
        ? productToForm(product)
        : emptyForm,
    );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageInput, setImageInput] =
    useState("");

  const imageFileInputRef =
    useRef<HTMLInputElement | null>(null);

  const objectUrlsRef =
    useRef<Set<string>>(new Set());

  const isEditing = Boolean(product);

  const totalCost = useMemo(
    () =>
      numberValue(form.supplierCost) +
      numberValue(form.shippingCost) +
      numberValue(form.otherCost),
    [
      form.supplierCost,
      form.shippingCost,
      form.otherCost,
    ],
  );

  const recommendedPrice = useMemo(
    () =>
      calculateRecommendedPrice(
        form.supplierCost,
        form.shippingCost,
        form.otherCost,
      ),
    [
      form.supplierCost,
      form.shippingCost,
      form.otherCost,
    ],
  );

  const selectedPrice =
    numberValue(form.price);

  const estimatedProfit =
    selectedPrice - totalCost;

  const estimatedMargin =
    selectedPrice > 0
      ? (estimatedProfit /
          selectedPrice) *
        100
      : 0;

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(
        (url) => URL.revokeObjectURL(url),
      );

      objectUrlsRef.current.clear();
    };
  }, []);

  function setField<K extends keyof ProductFormState>(
    field: K,
    value: ProductFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug:
        !current.slug ||
        current.slug ===
          slugify(current.name)
          ? slugify(value)
          : current.slug,
    }));
  }

  function handlePriceModeChange(
    mode: "manual" | "recommended",
  ) {
    setForm((current) => ({
      ...current,
      priceMode: mode,
      price:
        mode === "recommended"
          ? String(
              calculateRecommendedPrice(
                current.supplierCost,
                current.shippingCost,
                current.otherCost,
              ),
            )
          : current.price,
    }));
  }

  function addImageUrl() {
    const value = imageInput.trim();

    if (!value) return;

    setForm((current) => {
      const images = current.images.includes(
        value,
      )
        ? current.images
        : [
            ...current.images,
            value,
          ];

      return {
        ...current,
        images,
        imageUrl:
          current.imageUrl || value,
      };
    });

    setImageInput("");
  }

  function removeImage(index: number) {
    setForm((current) => {
      const removed =
        current.images[index];

      if (
        removed &&
        objectUrlsRef.current.has(removed)
      ) {
        URL.revokeObjectURL(removed);
        objectUrlsRef.current.delete(
          removed,
        );
      }

      const images =
        current.images.filter(
          (_, imageIndex) =>
            imageIndex !== index,
        );

      return {
        ...current,
        images,
        imageUrl:
          current.imageUrl === removed
            ? images[0] || ""
            : current.imageUrl,
      };
    });
  }

  function makeMainImage(image: string) {
    setForm((current) => ({
      ...current,
      imageUrl: image,
      images: [
        image,
        ...current.images.filter(
          (item) => item !== image,
        ),
      ],
    }));
  }

  function handleImageFiles(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(
      event.target.files || [],
    );

    if (!files.length) return;

    const urls = files.map((file) => {
      const url =
        URL.createObjectURL(file);

      objectUrlsRef.current.add(url);

      return url;
    });

    setForm((current) => {
      const images = [
        ...current.images,
        ...urls,
      ];

      return {
        ...current,
        images,
        imageUrl:
          current.imageUrl ||
          urls[0] ||
          "",
      };
    });

    event.target.value = "";
  }

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError(
        "Product name is required.",
      );
      return;
    }

    if (!form.category.trim()) {
      setError(
        "Category is required.",
      );
      return;
    }

    if (selectedPrice <= 0) {
      setError(
        "Enter a valid selling price.",
      );
      return;
    }

    if (
      numberValue(form.supplierCost) <
        0 ||
      numberValue(form.shippingCost) <
        0 ||
      numberValue(form.otherCost) <
        0
    ) {
      setError(
        "Product costs cannot be negative.",
      );
      return;
    }

    setSaving(true);

    try {
      const images =
        form.images.filter(Boolean);

      const primaryImage =
        form.imageUrl ||
        images[0] ||
        "";

      const variantSku =
        form.sku.trim() ||
        form.variants[0]?.sku ||
        "";

      const variants: ProductVariant[] =
        form.variants.length > 0
          ? form.variants
          : variantSku
            ? [
                {
                  id: `variant-${Date.now()}`,
                  name: "Default",
                  value: "Default",
                  price: String(
                    selectedPrice,
                  ),
                  sku: variantSku,
                  stock:
                    form.stock || "0",
                },
              ]
            : [];

      const payload: CreateProductInput = {
        name: form.name.trim(),
        slug:
          form.slug.trim() ||
          slugify(form.name),
        category:
          form.category.trim(),
        description:
          form.description.trim(),
        price: selectedPrice,
        currency:
          form.currency || "USD",
        image_url:
          primaryImage || undefined,
        images,
        video_url:
          form.videoUrl.trim() ||
          undefined,
        supplier_name:
          form.supplierName.trim() ||
          undefined,
        supplier_product_id:
          form.supplierProductId.trim() ||
          undefined,
        warehouse_country:
          form.warehouseCountry.trim() ||
          undefined,
        supplier_cost:
          numberValue(
            form.supplierCost,
          ),
        shipping_cost:
          numberValue(
            form.shippingCost,
          ),
        other_cost:
          numberValue(
            form.otherCost,
          ),
        processing_time:
          form.processingTime.trim() ||
          undefined,
        delivery_time:
          form.deliveryTime.trim() ||
          undefined,
        sku:
          form.sku.trim() ||
          undefined,
        stock:
          form.stock.trim() === ""
            ? undefined
            : numberValue(form.stock),
        low_stock_threshold:
          form.lowStockThreshold.trim() ===
          ""
            ? undefined
            : numberValue(
                form.lowStockThreshold,
              ),
        variants,
      };

      if (product) {
        await updateProduct(
          product.id,
          {
            ...payload,
            active: form.active
              ? 1
              : 0,
          },
        );
      } else {
        const created =
          await createProduct(payload);

        if (
          !form.active &&
          created?.id
        ) {
          await updateProduct(
            created.id,
            {
              active: 0,
            },
          );
        }
      }

      await onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save product.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {isEditing
                ? "Edit product"
                : "Add product"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add your supplier information,
              images, costs and selling price.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto p-6"
        >
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
                  Product information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="md:col-span-2">
                    <span className="mb-1.5 block text-sm font-medium">
                      Product name
                    </span>

                    <input
                      value={form.name}
                      onChange={(event) =>
                        handleNameChange(
                          event.target.value,
                        )
                      }
                      placeholder="Ergonomic 15° Elevated Stainless Steel Cat Feeding Bowl"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      SKU
                    </span>

                    <input
                      value={form.sku}
                      onChange={(event) =>
                        setField(
                          "sku",
                          event.target.value,
                        )
                      }
                      placeholder="SUPEHDF00178-A0"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      Category
                    </span>

                    <input
                      value={form.category}
                      onChange={(event) =>
                        setField(
                          "category",
                          event.target.value,
                        )
                      }
                      placeholder="Pet Supplies"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>

                  <label className="md:col-span-2">
                    <span className="mb-1.5 block text-sm font-medium">
                      Description
                    </span>

                    <textarea
                      value={
                        form.description
                      }
                      onChange={(event) =>
                        setField(
                          "description",
                          event.target.value,
                        )
                      }
                      rows={5}
                      placeholder="Describe the product for customers..."
                      className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Product images
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Upload images or add image URLs.
                      The first/main image is used as
                      the storefront thumbnail.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      imageFileInputRef.current?.click()
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    <Upload size={16} />
                    Upload images
                  </button>

                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFiles}
                    className="hidden"
                  />
                </div>

                <div className="mb-4 flex gap-2">
                  <input
                    value={imageInput}
                    onChange={(event) =>
                      setImageInput(
                        event.target.value,
                      )
                    }
                    placeholder="Or paste an image URL"
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 outline-none dark:border-slate-700 dark:bg-slate-900"
                  />

                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="rounded-xl border border-slate-300 px-4 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Add
                  </button>
                </div>

                {form.images.length ===
                0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      imageFileInputRef.current?.click()
                    }
                    className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-slate-500 dark:border-slate-700"
                  >
                    <ImagePlus size={32} />

                    <span className="mt-2 text-sm font-medium">
                      Upload product images
                    </span>

                    <span className="mt-1 text-xs">
                      PNG, JPG, WEBP and other
                      browser-supported formats
                    </span>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {form.images.map(
                      (
                        image,
                        index,
                      ) => (
                        <div
                          key={`${image}-${index}`}
                          className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                        >
                          <img
                            src={image}
                            alt={`Product ${
                              index + 1
                            }`}
                            className="aspect-square w-full object-cover"
                            onError={(
                              event,
                            ) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />

                          <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/60 p-2 opacity-0 transition group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() =>
                                makeMainImage(
                                  image,
                                )
                              }
                              className="flex-1 rounded-lg bg-white px-2 py-1 text-xs font-medium text-slate-900"
                            >
                              {form.imageUrl ===
                              image
                                ? "Main image"
                                : "Make main"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeImage(
                                  index,
                                )
                              }
                              className="rounded-lg bg-red-500 px-2 py-1 text-xs text-white"
                            >
                              <Trash2
                                size={13}
                              />
                            </button>
                          </div>

                          {form.imageUrl ===
                            image && (
                            <div className="absolute left-2 top-2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white">
                              MAIN
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
                  Supplier & fulfillment
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      Supplier
                    </span>

                    <input
                      value={
                        form.supplierName
                      }
                      onChange={(event) =>
                        setField(
                          "supplierName",
                          event.target.value,
                        )
                      }
                      placeholder="TeemDrop"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      Supplier product ID / SPU
                    </span>

                    <input
                      value={
                        form.supplierProductId
                      }
                      onChange={(event) =>
                        setField(
                          "supplierProductId",
                          event.target.value,
                        )
                      }
                      placeholder="SUPEHDF00178"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      Warehouse country
                    </span>

                    <input
                      value={
                        form.warehouseCountry
                      }
                      onChange={(event) =>
                        setField(
                          "warehouseCountry",
                          event.target.value,
                        )
                      }
                      placeholder="China / CN"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      Delivery time
                    </span>

                    <input
                      value={
                        form.deliveryTime
                      }
                      onChange={(event) =>
                        setField(
                          "deliveryTime",
                          event.target.value,
                        )
                      }
                      placeholder="7–15 business days"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      Processing time
                    </span>

                    <input
                      value={
                        form.processingTime
                      }
                      onChange={(event) =>
                        setField(
                          "processingTime",
                          event.target.value,
                        )
                      }
                      placeholder="1–3 business days"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      Video URL
                    </span>

                    <input
                      value={form.videoUrl}
                      onChange={(event) =>
                        setField(
                          "videoUrl",
                          event.target.value,
                        )
                      }
                      placeholder="Optional product video URL"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
                  Product costs
                </h3>

                <div className="space-y-4">
                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      Supplier cost
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.supplierCost
                      }
                      onChange={(event) =>
                        setField(
                          "supplierCost",
                          event.target.value,
                        )
                      }
                      placeholder="1.72"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      Supplier shipping cost
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.shippingCost
                      }
                      onChange={(event) =>
                        setField(
                          "shippingCost",
                          event.target.value,
                        )
                      }
                      placeholder="13.61"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      Other cost
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.otherCost
                      }
                      onChange={(event) =>
                        setField(
                          "otherCost",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>

                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        Total product cost
                      </span>

                      <strong>
                        {money(
                          totalCost,
                          form.currency,
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
                  Selling price
                </h3>

                <div className="mb-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handlePriceModeChange(
                        "manual",
                      )
                    }
                    className={`rounded-xl border px-3 py-3 text-left text-sm ${
                      form.priceMode ===
                      "manual"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    <strong className="block">
                      Manual price
                    </strong>

                    <span className="text-xs opacity-70">
                      I choose the price
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handlePriceModeChange(
                        "recommended",
                      )
                    }
                    className={`rounded-xl border px-3 py-3 text-left text-sm ${
                      form.priceMode ===
                      "recommended"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    <strong className="block">
                      Recommended
                    </strong>

                    <span className="text-xs opacity-70">
                      2.5× total cost
                    </span>
                  </button>
                </div>

                <label>
                  <span className="mb-1.5 block text-sm font-medium">
                    Retail price
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      setField(
                        "price",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-3 text-lg font-semibold dark:border-slate-700 dark:bg-slate-900"
                  />
                </label>

                <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Recommended
                    </span>

                    <strong>
                      {money(
                        recommendedPrice,
                        form.currency,
                      )}
                    </strong>
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-slate-500">
                      Estimated profit
                    </span>

                    <strong>
                      {money(
                        estimatedProfit,
                        form.currency,
                      )}
                    </strong>
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-slate-500">
                      Estimated margin
                    </span>

                    <strong>
                      {estimatedMargin.toFixed(
                        1,
                      )}
                      %
                    </strong>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
                  Inventory
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      Stock
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock}
                      onChange={(event) =>
                        setField(
                          "stock",
                          event.target.value,
                        )
                      }
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      Low-stock threshold
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        form.lowStockThreshold
                      }
                      onChange={(event) =>
                        setField(
                          "lowStockThreshold",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Store visibility
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Active products can appear on
                      the storefront.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setField(
                        "active",
                        !form.active,
                      )
                    }
                    className={`relative h-6 w-11 rounded-full transition ${
                      form.active
                        ? "bg-slate-900"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                        form.active
                          ? "left-6"
                          : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </section>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium dark:border-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Create product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PRODUCTS PAGE                                                              */
/* -------------------------------------------------------------------------- */

export default function Products() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>("all");

  const [
    stockFilter,
    setStockFilter,
  ] =
    useState<StockFilter>("all");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all");

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<string[]>([]);

  const [
    editingProduct,
    setEditingProduct,
  ] = useState<Product | null>(null);

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    menuId,
    setMenuId,
  ] = useState<string | null>(null);

  const csvInputRef =
    useRef<HTMLInputElement | null>(null);

  const [
    csvImporting,
    setCsvImporting,
  ] = useState(false);

  const [
    csvMessage,
    setCsvMessage,
  ] = useState("");

  const [
    importResult,
    setImportResult,
  ] = useState<ImportResult | null>(
    null,
  );

  const loadProducts =
    useCallback(async () => {
      try {
        setLoading(true);

        const result =
          await getAdminProducts();

        setProducts(
          Array.isArray(result)
            ? result
            : [],
        );
      } catch (error) {
        console.error(
          "Failed to load products:",
          error,
        );

        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, []);

  async function refreshProducts() {
    setRefreshing(true);

    try {
      const result =
        await getAdminProducts();

      setProducts(
        Array.isArray(result)
          ? result
          : [],
      );
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  /*
   * Safer menu handling:
   * - closes on Escape
   * - closes when clicking outside
   * - cleans up listeners
   * - does not manipulate DOM manually
   */
  useEffect(() => {
    if (!menuId) return;

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setMenuId(null);
      }
    }

    function handlePointerDown(
      event: PointerEvent,
    ) {
      const target =
        event.target as HTMLElement | null;

      if (
        target?.closest(
          "[data-product-action-menu]",
        )
      ) {
        return;
      }

      setMenuId(null);
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
    };
  }, [menuId]);

  const categories = useMemo(() => {
    const values = products
      .map(
        (product) => product.category,
      )
      .filter(Boolean);

    return Array.from(
      new Set(values),
    ).sort();
  }, [products]);

  const filteredProducts =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      return products.filter(
        (product) => {
          const matchesSearch =
            !query ||
            product.name
              .toLowerCase()
              .includes(query) ||
            product.sku
              ?.toLowerCase()
              .includes(query) ||
            product.supplier_name
              ?.toLowerCase()
              .includes(query) ||
            product.category
              ?.toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter === "all" ||
            (statusFilter ===
              "active" &&
              Number(
                product.active,
              ) === 1) ||
            (statusFilter ===
              "inactive" &&
              Number(
                product.active,
              ) !== 1);

          const matchesStock =
            stockFilter === "all" ||
            getStockState(product) ===
              stockFilter;

          const matchesCategory =
            categoryFilter === "all" ||
            product.category ===
              categoryFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesStock &&
            matchesCategory
          );
        },
      );
    }, [
      products,
      search,
      statusFilter,
      stockFilter,
      categoryFilter,
    ]);

  function toggleSelected(
    id: string,
  ) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter(
            (item) => item !== id,
          )
        : [
            ...current,
            id,
          ],
    );
  }

  function toggleAllVisible() {
    const visibleIds =
      filteredProducts.map(
        (product) => product.id,
      );

    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) =>
        selectedIds.includes(id),
      );

    setSelectedIds((current) =>
      allSelected
        ? current.filter(
            (id) =>
              !visibleIds.includes(id),
          )
        : Array.from(
            new Set([
              ...current,
              ...visibleIds,
            ]),
          ),
    );
  }

  async function handleDelete(
    product: Product,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${product.name}"? This cannot be undone.`,
      );

    if (!confirmed) return;

    try {
      await deleteProduct(
        product.id,
      );

      setProducts((current) =>
        current.filter(
          (item) =>
            item.id !== product.id,
        ),
      );

      setSelectedIds((current) =>
        current.filter(
          (id) =>
            id !== product.id,
        ),
      );
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to delete product.",
      );
    }
  }

  async function toggleActive(
    product: Product,
  ) {
    const nextActive =
      Number(product.active) === 1
        ? 0
        : 1;

    try {
      await updateProduct(
        product.id,
        {
          active: nextActive,
        },
      );

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                active:
                  nextActive,
              }
            : item,
        ),
      );
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to update product.",
      );
    }
  }

  async function bulkUpdateActive(
    active: number,
  ) {
    if (!selectedIds.length)
      return;

    try {
      await Promise.all(
        selectedIds.map((id) =>
          updateProduct(id, {
            active,
          }),
        ),
      );

      setProducts((current) =>
        current.map((product) =>
          selectedIds.includes(
            product.id,
          )
            ? {
                ...product,
                active,
              }
            : product,
        ),
      );

      setSelectedIds([]);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to update products.",
      );
    }
  }

  async function bulkDelete() {
    if (!selectedIds.length)
      return;

    const confirmed =
      window.confirm(
        `Delete ${selectedIds.length} selected product(s)?`,
      );

    if (!confirmed) return;

    try {
      await Promise.all(
        selectedIds.map((id) =>
          deleteProduct(id),
        ),
      );

      setProducts((current) =>
        current.filter(
          (product) =>
            !selectedIds.includes(
              product.id,
            ),
        ),
      );

      setSelectedIds([]);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to delete selected products.",
      );
    }
  }

  /* ---------------------------------------------------------------------- */
  /* UPGRADED CSV IMPORT                                                    */
  /* ---------------------------------------------------------------------- */

  async function handleCsvImport(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setCsvMessage("");
    setImportResult(null);
    setCsvImporting(true);

    try {
      if (
        !file.name
          .toLowerCase()
          .endsWith(".csv")
      ) {
        throw new Error(
          "Please select a CSV file.",
        );
      }

      const text =
        await file.text();

      const rows = parseCsv(text);

      if (!rows.length) {
        throw new Error(
          "The CSV file contains no product rows.",
        );
      }

      /*
       * Existing products are loaded once.
       *
       * Matching priority:
       * 1. Handle/slug
       * 2. SKU
       * 3. Supplier product ID
       *
       * This makes repeated Shopify-style rows
       * behave much better than simply POSTing
       * every row as a new product.
       */
      const existingProducts =
        Array.isArray(products) &&
        products.length
          ? products
          : await getAdminProducts();

      const byHandle =
        new Map<string, Product>();

      const bySku =
        new Map<string, Product>();

      const bySupplierId =
        new Map<string, Product>();

      existingProducts.forEach(
        (product) => {
          if (product.slug) {
            byHandle.set(
              product.slug
                .toLowerCase()
                .trim(),
              product,
            );
          }

          if (product.sku) {
            bySku.set(
              product.sku
                .toLowerCase()
                .trim(),
              product,
            );
          }

          if (
            product.supplier_product_id
          ) {
            bySupplierId.set(
              product
                .supplier_product_id
                .toLowerCase()
                .trim(),
              product,
            );
          }
        },
      );

      const result: ImportResult = {
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      };

      /*
       * Products are grouped by Handle/slug.
       *
       * Shopify-style CSV files commonly use
       * multiple rows for variants/images.
       */
      const groups =
        new Map<
          string,
          {
            rows: CsvRow[];
            firstRowIndex: number;
          }
        >();

      rows.forEach(
        (row, index) => {
          const name =
            getRowName(row);

          const handle =
            getRowHandle(row) ||
            slugify(name);

          const key =
            handle ||
            `row-${index}`;

          const existing =
            groups.get(key);

          if (existing) {
            existing.rows.push(row);
          } else {
            groups.set(key, {
              rows: [row],
              firstRowIndex:
                index,
            });
          }
        },
      );

      for (
        const group of groups.values()
      ) {
        const firstRow =
          group.rows[0];

        const rowNumber =
          group.firstRowIndex +
          2;

        try {
          const firstBuilt =
            buildCsvProduct(
              firstRow,
              group.firstRowIndex,
            );

          let payload =
            firstBuilt.payload;

          let allImages =
            firstBuilt.images;

          let variants =
            payload.variants || [];

          /*
           * Merge additional rows.
           *
           * Repeated Shopify rows can contain:
           * - another variant
           * - another image
           * - variant-specific SKU
           * - variant-specific price
           * - variant inventory
           */
          for (
            let index = 1;
            index < group.rows.length;
            index += 1
          ) {
            const additionalRow =
              group.rows[index];

            const built =
              buildCsvProduct(
                additionalRow,
                group.firstRowIndex +
                  index,
              );

            allImages =
              mergeImages(
                allImages,
                built.images,
              );

            variants =
              mergeVariants(
                variants,
                built.variant,
              );

            if (
              !payload.description &&
              built.payload.description
            ) {
              payload = {
                ...payload,
                description:
                  built.payload
                    .description,
              };
            }

            if (
              !payload.category &&
              built.payload.category
            ) {
              payload = {
                ...payload,
                category:
                  built.payload
                    .category,
              };
            }

            if (
              !payload.supplier_name &&
              built.payload.supplier_name
            ) {
              payload = {
                ...payload,
                supplier_name:
                  built.payload
                    .supplier_name,
              };
            }

            if (
              !payload.supplier_product_id &&
              built.payload
                .supplier_product_id
            ) {
              payload = {
                ...payload,
                supplier_product_id:
                  built.payload
                    .supplier_product_id,
              };
            }

            if (
              payload.stock == null &&
              built.payload.stock != null
            ) {
              payload = {
                ...payload,
                stock:
                  built.payload.stock,
              };
            }
          }

          payload = {
            ...payload,
            images: allImages,
            image_url:
              allImages[0] ||
              payload.image_url,
            variants,
          };

          const normalizedHandle =
            firstBuilt.handle
              .toLowerCase()
              .trim();

          const sku =
            payload.sku
              ?.toLowerCase()
              .trim();

          const supplierId =
            payload
              .supplier_product_id
              ?.toLowerCase()
              .trim();

          const existing =
            byHandle.get(
              normalizedHandle,
            ) ||
            (sku
              ? bySku.get(sku)
              : undefined) ||
            (supplierId
              ? bySupplierId.get(
                  supplierId,
                )
              : undefined);

          if (existing) {
            /*
             * Update existing product instead of
             * failing with duplicate SKU/slug.
             */
            const updatedPayload: Partial<
              CreateProductInput
            > & {
              active?: number;
            } = {
              ...payload,
              active:
                payload.active ?? 1,
            };

            const updated =
              await updateProduct(
                existing.id,
                updatedPayload,
              );

            const finalProduct =
              updated || {
                ...existing,
                ...payload,
              };

            byHandle.set(
              normalizedHandle,
              finalProduct,
            );

            if (finalProduct.sku) {
              bySku.set(
                finalProduct.sku
                  .toLowerCase()
                  .trim(),
                finalProduct,
              );
            }

            if (
              finalProduct
                .supplier_product_id
            ) {
              bySupplierId.set(
                finalProduct
                  .supplier_product_id
                  .toLowerCase()
                  .trim(),
                finalProduct,
              );
            }

            result.updated += 1;
          } else {
            const created =
              await createProduct(
                payload,
              );

            result.created += 1;

            if (created) {
              byHandle.set(
                normalizedHandle,
                created,
              );

              if (created.sku) {
                bySku.set(
                  created.sku
                    .toLowerCase()
                    .trim(),
                  created,
                );
              }

              if (
                created
                  .supplier_product_id
              ) {
                bySupplierId.set(
                  created
                    .supplier_product_id
                    .toLowerCase()
                    .trim(),
                  created,
                );
              }
            }
          }
        } catch (error) {
          result.failed += 1;

          const message =
            error instanceof Error
              ? error.message
              : "Unable to import product.";

          result.errors.push(
            `Row ${rowNumber}: ${message}`,
          );
        }
      }

      await loadProducts();

      setImportResult(result);

      const summaryParts = [
        `Created ${result.created}`,
        `updated ${result.updated}`,
        `skipped ${result.skipped}`,
        `failed ${result.failed}`,
      ];

      setCsvMessage(
        `Import complete — ${summaryParts.join(
          ", ",
        )}.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to import CSV.";

      setCsvMessage(message);

      setImportResult({
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 1,
        errors: [message],
      });
    } finally {
      setCsvImporting(false);

      if (csvInputRef.current) {
        csvInputRef.current.value =
          "";
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Products
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your Global store products,
            pricing, suppliers and inventory.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={
              downloadCsvTemplate
            }
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            CSV template
          </button>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <Upload size={17} />

            {csvImporting
              ? "Importing..."
              : "Import CSV"}

            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={
                handleCsvImport
              }
              disabled={csvImporting}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() =>
              void refreshProducts()
            }
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingProduct(
                null,
              );
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus size={18} />
            Add product
          </button>
        </div>
      </div>

      {csvMessage && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-700 dark:text-slate-300">
              {csvMessage}
            </span>

            <button
              type="button"
              onClick={() =>
                setCsvMessage("")
              }
            >
              <X size={16} />
            </button>
          </div>

          {importResult &&
            importResult.errors.length >
              0 && (
              <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">
                  Import errors
                </p>

                <div className="max-h-40 space-y-1 overflow-y-auto text-xs text-red-600">
                  {importResult.errors.map(
                    (
                      error,
                      index,
                    ) => (
                      <div
                        key={`${error}-${index}`}
                      >
                        {error}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500">
            Total products
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {products.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500">
            Active
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              products.filter(
                (product) =>
                  Number(
                    product.active,
                  ) === 1,
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500">
            Low stock
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              products.filter(
                (product) =>
                  getStockState(
                    product,
                  ) === "low",
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500">
            Out of stock
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              products.filter(
                (product) =>
                  getStockState(
                    product,
                  ) === "out",
              ).length
            }
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 xl:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search products, SKU or supplier..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 outline-none dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as StatusFilter,
              )
            }
            className="rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="all">
              All status
            </option>
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
            </option>
          </select>

          <select
            value={stockFilter}
            onChange={(event) =>
              setStockFilter(
                event.target
                  .value as StockFilter,
              )
            }
            className="rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="all">
              All stock
            </option>
            <option value="healthy">
              Healthy
            </option>
            <option value="low">
              Low stock
            </option>
            <option value="out">
              Out of stock
            </option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value,
              )
            }
            className="rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="all">
              All categories
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ),
            )}
          </select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <span className="mr-2 text-sm font-medium">
              {selectedIds.length}{" "}
              selected
            </span>

            <button
              type="button"
              onClick={() =>
                void bulkUpdateActive(
                  1,
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700"
            >
              Activate
            </button>

            <button
              type="button"
              onClick={() =>
                void bulkUpdateActive(
                  0,
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700"
            >
              Deactivate
            </button>

            <button
              type="button"
              onClick={() =>
                void bulkDelete()
              }
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white"
            >
              Delete
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <RefreshCw
              size={24}
              className="animate-spin text-slate-400"
            />
          </div>
        ) : filteredProducts.length ===
          0 ? (
          <div className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
              <Package
                size={28}
                className="text-slate-400"
              />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              No products found
            </h3>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              Your Products page is
              connected to the real product
              database. Add your first
              product or import your Master
              Inventory CSV.
            </p>

            <button
              type="button"
              onClick={() => {
                setEditingProduct(
                  null,
                );
                setShowModal(true);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              <Plus size={17} />
              Add your first product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={
                        filteredProducts.length >
                          0 &&
                        filteredProducts.every(
                          (
                            product,
                          ) =>
                            selectedIds.includes(
                              product.id,
                            ),
                        )
                      }
                      onChange={
                        toggleAllVisible
                      }
                    />
                  </th>

                  <th className="px-4 py-3">
                    Product
                  </th>

                  <th className="px-4 py-3">
                    Category
                  </th>

                  <th className="px-4 py-3">
                    Price
                  </th>

                  <th className="px-4 py-3">
                    Inventory
                  </th>

                  <th className="px-4 py-3">
                    Supplier
                  </th>

                  <th className="px-4 py-3">
                    Profit
                  </th>

                  <th className="px-4 py-3">
                    Status
                  </th>

                  <th className="px-4 py-3" />
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map(
                  (product) => {
                    const stockState =
                      getStockState(
                        product,
                      );

                    const image =
                      product.image_url ||
                      product.images?.[0];

                    return (
                      <tr
                        key={
                          product.id
                        }
                        className="border-b border-slate-100 last:border-0 dark:border-slate-900"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(
                              product.id,
                            )}
                            onChange={() =>
                              toggleSelected(
                                product.id,
                              )
                            }
                          />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                              {image ? (
                                <img
                                  src={
                                    image
                                  }
                                  alt={
                                    product.name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package
                                  size={
                                    20
                                  }
                                  className="text-slate-400"
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[260px] truncate font-medium text-slate-900 dark:text-white">
                                {
                                  product.name
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {product.sku ||
                                  "No SKU"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {product.category ||
                            "—"}
                        </td>

                        <td className="px-4 py-4 text-sm font-medium">
                          {money(
                            numberValue(
                              product.price,
                            ),
                            product.currency,
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <strong>
                              {product.stock ??
                                0}
                            </strong>

                            <span className="ml-1 text-slate-500">
                              units
                            </span>
                          </div>

                          <span
                            className={`mt-1 inline-block text-xs ${
                              stockState ===
                              "healthy"
                                ? "text-emerald-600"
                                : stockState ===
                                    "low"
                                  ? "text-amber-600"
                                  : "text-red-600"
                            }`}
                          >
                            {stockState ===
                            "healthy"
                              ? "Healthy"
                              : stockState ===
                                  "low"
                                ? "Low stock"
                                : "Out of stock"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {product.supplier_name ||
                            "—"}
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-sm font-medium">
                            {money(
                              numberValue(
                                product.profit_per_unit,
                              ),
                              product.currency,
                            )}
                          </div>

                          <div className="text-xs text-slate-500">
                            {numberValue(
                              product.profit_margin,
                            ).toFixed(
                              1,
                            )}
                            %
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                              Number(
                                product.active,
                              ) === 1
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {Number(
                              product.active,
                            ) === 1
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td
                          className="relative px-4 py-4 text-right"
                          data-product-action-menu
                        >
                          <button
                            type="button"
                            aria-label={`Actions for ${product.name}`}
                            aria-expanded={
                              menuId ===
                              product.id
                            }
                            onClick={(
                              event,
                            ) => {
                              event.stopPropagation();

                              setMenuId(
                                (current) =>
                                  current ===
                                  product.id
                                    ? null
                                    : product.id,
                              );
                            }}
                            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <MoreHorizontal
                              size={
                                18
                              }
                            />
                          </button>

                          {menuId ===
                            product.id && (
                            <div
                              className="absolute right-4 top-12 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1 text-left shadow-xl dark:border-slate-800 dark:bg-slate-950"
                              data-product-action-menu
                              onPointerDown={(
                                event,
                              ) =>
                                event.stopPropagation()
                              }
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct(
                                    product,
                                  );

                                  setShowModal(
                                    true,
                                  );

                                  setMenuId(
                                    null,
                                  );
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Edit3
                                  size={
                                    15
                                  }
                                />

                                Edit product
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setMenuId(
                                    null,
                                  );

                                  void toggleActive(
                                    product,
                                  );
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Check
                                  size={
                                    15
                                  }
                                />

                                {Number(
                                  product.active,
                                ) === 1
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setMenuId(
                                    null,
                                  );

                                  void handleDelete(
                                    product,
                                  );
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              >
                                <Trash2
                                  size={
                                    15
                                  }
                                />

                                Delete product
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ProductModal
          product={
            editingProduct
          }
          onClose={() => {
            setShowModal(false);
            setEditingProduct(
              null,
            );
          }}
          onSaved={loadProducts}
        />
      )}
    </div>
  );
}