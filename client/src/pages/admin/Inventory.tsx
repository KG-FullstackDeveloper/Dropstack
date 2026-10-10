import {
AlertTriangle,
ArrowDown,
ArrowUp,
Box,
History,
Minus,
Package,
Plus,
RefreshCw,
Search,
TrendingUp,
X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
adjustInventory,
getAdminProducts,
getInventoryHistory,
type InventoryAdjustmentMode,
type InventoryAdjustmentReason,
type InventoryMovement,
} from "../../services/adminApi";
import type { Product } from "../../types/product";
import { formatCurrency } from "../../utils/currency";

type InventoryProduct = Product & {
image_url?: string | null;
imageUrl?: string | null;
image?: string | null;
images?: string[] | string | null;
supplier?: string | null;
supplier_name?: string | null;
supplierName?: string | null;
stock?: number | null;
quantity?: number | null;
inventory?: number | null;
low_stock_threshold?: number | null;
lowStockThreshold?: number | null;
supplier_cost?: number | null;
supplierCost?: number | null;
cost?: number | null;
price?: number | null;
currency?: string | null;
status?: string | null;
};

type SortField =
| "name"
| "stock"
| "supplier_cost"
| "price"
| "inventory_value";

type SortDirection = "asc" | "desc";

const INVENTORY_REASONS: InventoryAdjustmentReason[] = [
"Restock",
"Sale",
"Damaged",
"Returned",
"Correction",
"Other",
];

function getNumber(...values: unknown[]): number {
for (const value of values) {
if (typeof value === "number" && Number.isFinite(value)) {
return value;
}

if (typeof value === "string" && value.trim()) {
  const parsed = Number(value);

  if (Number.isFinite(parsed)) {
    return parsed;
  }
}

}

return 0;
}

function getStock(product: InventoryProduct): number {
return getNumber(
product.stock,
product.quantity,
product.inventory,
);
}

function getSupplierCost(product: InventoryProduct): number {
return getNumber(
product.supplier_cost,
product.supplierCost,
product.cost,
);
}

function getPrice(product: InventoryProduct): number {
return getNumber(product.price);
}

function getThreshold(product: InventoryProduct): number {
return getNumber(
product.low_stock_threshold,
product.lowStockThreshold,
5,
);
}

function getImages(product: InventoryProduct): string[] {
const result: string[] = [];

const add = (value: unknown) => {
if (typeof value !== "string") {
return;
}

const trimmed = value.trim();

if (!trimmed) {
  return;
}

if (trimmed.startsWith("[")) {
  try {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      parsed.forEach(add);
      return;
    }
  } catch {
    // Treat invalid JSON as a normal image value.
  }
}

if (
  trimmed.includes(",") &&
  !trimmed.startsWith("data:")
) {
  trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => result.push(item));

  return;
}

result.push(trimmed);

};

add(product.image_url);
add(product.imageUrl);
add(product.image);
add(product.images);

return [...new Set(result)];
}

function getImageUrl(image: string): string {
if (
image.startsWith("http://") ||
image.startsWith("https://") ||
image.startsWith("data:") ||
image.startsWith("blob:") ||
image.startsWith("/")
) {
return image;
}

return "/" + image;
}

function getProductImage(
product: InventoryProduct,
): string | null {
const images = getImages(product);

return images.length > 0
? getImageUrl(images[0])
: null;
}

function getStockStatus(
stock: number,
threshold: number,
): "out" | "low" | "healthy" {
if (stock <= 0) {
return "out";
}

if (stock <= threshold) {
return "low";
}

return "healthy";
}

function StockBadge({
stock,
threshold,
}: {
stock: number;
threshold: number;
}) {
const status = getStockStatus(
stock,
threshold,
);

if (status === "out") {
return (
<span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
Out of stock
</span>
);
}

if (status === "low") {
return (
<span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
Low stock
</span>
);
}

return (
<span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
In stock
</span>
);
}

function StockIndicator({
stock,
threshold,
}: {
stock: number;
threshold: number;
}) {
const status = getStockStatus(
stock,
threshold,
);

const width =
status === "out"
? 4
: status === "low"
? Math.max(
12,
Math.min(
45,
(stock / Math.max(threshold, 1)) *
45,
),
)
: Math.min(
100,
Math.max(55, stock),
);

return (
<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
<div
className={
"h-full rounded-full " +
(status === "out"
? "bg-red-500"
: status === "low"
? "bg-amber-500"
: "bg-emerald-500")
}
style={{
width: width + "%",
}}
/>
</div>
);
}

function StatCard({
title,
value,
description,
icon,
}: {
title: string;
value: string;
description: string;
icon: React.ReactNode;
}) {
return (
<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
<div className="flex items-start justify-between gap-4">
<div>
<p className="text-sm font-medium text-slate-500">
{title}
</p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>

    <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
      {icon}
    </div>
  </div>
</div>

);
}

function ValueCard({
title,
value,
description,
}: {
title: string;
value: string;
description: string;
}) {
return (
<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
<p className="text-sm font-medium text-slate-500">
{title}
</p>

  <p className="mt-2 text-xl font-bold text-slate-900">
    {value}
  </p>

  <p className="mt-1 text-xs text-slate-500">
    {description}
  </p>
</div>

);
}

function Select({
value,
onChange,
children,
}: {
value: string;
onChange: (value: string) => void;
children: React.ReactNode;
}) {
return (
<select
value={value}
onChange={(event) =>
onChange(event.target.value)
}
className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus focus focus"
>
{children}
</select>
);
}

function formatMovementDate(
value: string | null | undefined,
): string {
if (!value) {
return "—";
}

const date = new Date(value);

if (Number.isNaN(date.getTime())) {
return value;
}

return date.toLocaleString();
}

function getMovementChangeLabel(
movement: InventoryMovement,
): string {
if (movement.change_amount > 0) {
return "+" + movement.change_amount;
}

return String(movement.change_amount);
}

function getMovementChangeClass(
movement: InventoryMovement,
): string {
if (movement.change_amount > 0) {
return "text-emerald-600";
}

if (movement.change_amount < 0) {
return "text-red-600";
}

return "text-slate-600";
}

export default function Inventory() {
const [products, setProducts] =
useState<InventoryProduct[]>([]);

const [loading, setLoading] =
useState(true);

const [refreshing, setRefreshing] =
useState(false);

const [search, setSearch] =
useState("");

const [stockFilter, setStockFilter] =
useState("all");

const [sortField, setSortField] =
useState<SortField>("name");

const [sortDirection, setSortDirection] =
useState<SortDirection>("asc");

const [history, setHistory] =
useState<InventoryMovement[]>([]);

const [historyLoading, setHistoryLoading] =
useState(false);

const [historyOpen, setHistoryOpen] =
useState(false);

const [adjustProduct, setAdjustProduct] =
useState<InventoryProduct | null>(null);

const [adjustMode, setAdjustMode] =
useState<InventoryAdjustmentMode>("add");

const [adjustAmount, setAdjustAmount] =
useState("");

const [adjustReason, setAdjustReason] =
useState<InventoryAdjustmentReason>("Restock");

const [adjustNote, setAdjustNote] =
useState("");

const [adjusting, setAdjusting] =
useState(false);

const [adjustError, setAdjustError] =
useState("");

const [successMessage, setSuccessMessage] =
useState("");

const loadInventory = async (
showRefresh = false,
) => {
try {
if (showRefresh) {
setRefreshing(true);
} else {
setLoading(true);
}

  const result =
    await getAdminProducts();

  setProducts(
    Array.isArray(result)
      ? (result as InventoryProduct[])
      : [],
  );
} catch (error) {
  console.error(
    "Failed to load inventory:",
    error,
  );
} finally {
  setLoading(false);
  setRefreshing(false);
}

};

const loadHistory = async () => {
try {
setHistoryLoading(true);

  const result =
    await getInventoryHistory(200);

  setHistory(
    Array.isArray(result)
      ? result
      : [],
  );
} catch (error) {
  console.error(
    "Failed to load inventory history:",
    error,
  );
} finally {
  setHistoryLoading(false);
}

};

useEffect(() => {
void loadInventory();
void loadHistory();
}, []);

const stats = useMemo(() => {
const totalProducts =
products.length;

const activeProducts =
  products.filter((product) => {
    const status = String(
      product.status ?? "",
    ).toLowerCase();

    return (
      status !== "inactive" &&
      status !== "archived"
    );
  }).length;

const totalUnits =
  products.reduce(
    (total, product) =>
      total + getStock(product),
    0,
  );

const lowStockProducts =
  products.filter((product) => {
    const stock =
      getStock(product);

    const threshold =
      getThreshold(product);

    return (
      stock > 0 &&
      stock <= threshold
    );
  }).length;

const outOfStockProducts =
  products.filter(
    (product) =>
      getStock(product) <= 0,
  ).length;

const inventoryCost =
  products.reduce(
    (total, product) =>
      total +
      getStock(product) *
        getSupplierCost(product),
    0,
  );

const retailValue =
  products.reduce(
    (total, product) =>
      total +
      getStock(product) *
        getPrice(product),
    0,
  );

const unitsRequiringAttention =
  products.reduce(
    (total, product) => {
      const stock =
        getStock(product);

      const threshold =
        getThreshold(product);

      return stock <= threshold
        ? total +
            Math.max(0, stock)
        : total;
    },
    0,
  );

return {
  totalProducts,
  activeProducts,
  totalUnits,
  lowStockProducts,
  outOfStockProducts,
  inventoryCost,
  retailValue,
  unitsRequiringAttention,
};

}, [products]);

const filteredProducts =
useMemo(() => {
const query =
search.trim().toLowerCase();

  const filtered =
    products.filter(
      (product) => {
        const name = String(
          product.name ?? "",
        ).toLowerCase();

        const sku = String(
          (
            product as InventoryProduct & {
              sku?: string | null;
            }
          ).sku ?? "",
        ).toLowerCase();

        const supplier =
          String(
            product.supplier ??
              product.supplier_name ??
              product.supplierName ??
              "",
          ).toLowerCase();

        const matchesSearch =
          !query ||
          name.includes(query) ||
          sku.includes(query) ||
          supplier.includes(query);

        if (!matchesSearch) {
          return false;
        }

        const stock =
          getStock(product);

        const threshold =
          getThreshold(product);

        if (stockFilter === "out") {
          return stock <= 0;
        }

        if (stockFilter === "low") {
          return (
            stock > 0 &&
            stock <= threshold
          );
        }

        if (
          stockFilter === "healthy"
        ) {
          return stock > threshold;
        }

        return true;
      },
    );

  return [...filtered].sort(
    (a, b) => {
      let aValue:
        | string
        | number;

      let bValue:
        | string
        | number;

      switch (sortField) {
        case "stock":
          aValue = getStock(a);
          bValue = getStock(b);
          break;

        case "supplier_cost":
          aValue =
            getSupplierCost(a);
          bValue =
            getSupplierCost(b);
          break;

        case "price":
          aValue = getPrice(a);
          bValue = getPrice(b);
          break;

        case "inventory_value":
          aValue =
            getStock(a) *
            getSupplierCost(a);

          bValue =
            getStock(b) *
            getSupplierCost(b);
          break;

        default:
          aValue = String(
            a.name ?? "",
          ).toLowerCase();

          bValue = String(
            b.name ?? "",
          ).toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection ===
          "asc"
          ? -1
          : 1;
      }

      if (aValue > bValue) {
        return sortDirection ===
          "asc"
          ? 1
          : -1;
      }

      return 0;
    },
  );
}, [
  products,
  search,
  stockFilter,
  sortField,
  sortDirection,
]);

const toggleSort = (
field: SortField,
) => {
if (sortField === field) {
setSortDirection(
(current) =>
current === "asc"
? "desc"
: "asc",
);

  return;
}

setSortField(field);
setSortDirection("asc");

};

const openAdjustModal = (
product: InventoryProduct,
) => {
setAdjustProduct(product);
setAdjustMode("add");
setAdjustAmount("");
setAdjustReason("Restock");
setAdjustNote("");
setAdjustError("");
setSuccessMessage("");
};

const closeAdjustModal = () => {
if (adjusting) {
return;
}

setAdjustProduct(null);
setAdjustAmount("");
setAdjustError("");

};

const handleAdjust = async () => {
if (!adjustProduct) {
return;
}

const amount =
  Number(adjustAmount);

if (
  !Number.isFinite(amount) ||
  amount < 0 ||
  !Number.isInteger(amount)
) {
  setAdjustError(
    "Enter a valid whole number.",
  );
  return;
}

if (
  adjustMode !== "set" &&
  amount <= 0
) {
  setAdjustError(
    "Enter an amount greater than zero.",
  );
  return;
}

const currentStock =
  getStock(adjustProduct);

if (
  adjustMode === "remove" &&
  amount > currentStock
) {
  setAdjustError(
    "You cannot remove more stock than is currently available.",
  );
  return;
}

if (
  adjustMode === "set" &&
  amount < 0
) {
  setAdjustError(
    "Stock cannot be negative.",
  );
  return;
}

try {
  setAdjusting(true);
  setAdjustError("");

  await adjustInventory({
    productId: String(
      adjustProduct.id,
    ),
    mode: adjustMode,
    amount,
    reason: adjustReason,
    note:
      adjustNote.trim() || undefined,
  });

  setSuccessMessage(
    "Inventory updated successfully.",
  );

  setAdjustProduct(null);
  setAdjustAmount("");
  setAdjustNote("");

  await Promise.all([
    loadInventory(true),
    loadHistory(),
  ]);
} catch (error) {
  console.error(
    "Failed to adjust inventory:",
    error,
  );

  setAdjustError(
    error instanceof Error
      ? error.message
      : "Failed to update inventory.",
  );
} finally {
  setAdjusting(false);
}

};

const openHistory = async () => {
setHistoryOpen(true);

if (history.length === 0) {
  await loadHistory();
}

};

if (loading) {
return (
<div className="flex min-h-[300px] items-center justify-center p-6">
<div className="flex items-center gap-3 text-sm text-slate-500">
<RefreshCw className="h-4 w-4 animate-spin" />
Loading inventory...
</div>
</div>
);
}

return (
<div className="space-y-6 p-6">
{successMessage && (
<div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
<span>{successMessage}</span>

      <button
        type="button"
        onClick={() =>
          setSuccessMessage("")
        }
        className="rounded-lg p-1 hover:bg-emerald-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )}

  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Inventory
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Monitor stock levels, adjust inventory,
        and review inventory history.
      </p>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() =>
          void openHistory()
        }
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <History className="h-4 w-4" />
        History
      </button>

      <button
        type="button"
        onClick={() =>
          void loadInventory(true)
        }
        disabled={refreshing}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
      >
        <RefreshCw
          className={
            "h-4 w-4 " +
            (refreshing
              ? "animate-spin"
              : "")
          }
        />
        Refresh
      </button>
    </div>
  </div>

  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <StatCard
      title="Products"
      value={String(
        stats.totalProducts,
      )}
      description="Total products in your catalog"
      icon={
        <Package className="h-5 w-5" />
      }
    />

    <StatCard
      title="Active products"
      value={String(
        stats.activeProducts,
      )}
      description="Currently available products"
      icon={
        <Box className="h-5 w-5" />
      }
    />

    <StatCard
      title="Units in stock"
      value={stats.totalUnits.toLocaleString()}
      description="Total physical units"
      icon={
        <TrendingUp className="h-5 w-5" />
      }
    />

    <StatCard
      title="Low / out of stock"
      value={
        String(
          stats.lowStockProducts,
        ) +
        " / " +
        String(
          stats.outOfStockProducts,
        )
      }
      description="Products requiring attention"
      icon={
        <AlertTriangle className="h-5 w-5" />
      }
    />
  </div>

  <div className="grid gap-4 md:grid-cols-3">
    <ValueCard
      title="Inventory cost value"
      value={formatCurrency(
        stats.inventoryCost,
        "USD",
      )}
      description="Supplier cost of current stock"
    />

    <ValueCard
      title="Potential retail value"
      value={formatCurrency(
        stats.retailValue,
        "USD",
      )}
      description="Estimated value at current prices"
    />

    <ValueCard
      title="Units requiring attention"
      value={stats.unitsRequiringAttention.toLocaleString()}
      description="Units at or below threshold"
    />
  </div>

  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative min-w-0 flex-1 xl:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search products, SKU, or supplier..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={stockFilter}
            onChange={setStockFilter}
          >
            <option value="all">
              All stock
            </option>

            <option value="healthy">
              In stock
            </option>

            <option value="low">
              Low stock
            </option>

            <option value="out">
              Out of stock
            </option>
          </Select>

          <Select
            value={sortField}
            onChange={(value) =>
              setSortField(
                value as SortField,
              )
            }
          >
            <option value="name">
              Sort: Name
            </option>

            <option value="stock">
              Sort: Stock
            </option>

            <option value="supplier_cost">
              Sort: Cost
            </option>

            <option value="price">
              Sort: Price
            </option>

            <option value="inventory_value">
              Sort: Inventory value
            </option>
          </Select>

          <button
            type="button"
            onClick={() =>
              setSortDirection(
                (current) =>
                  current ===
                  "asc"
                    ? "desc"
                    : "asc",
              )
            }
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-slate-600 hover:bg-slate-50"
          >
            {sortDirection ===
            "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>

    {filteredProducts.length ===
    0 ? (
      <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
        <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
          <Package className="h-8 w-8" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-slate-900">
          {search
            ? "No products found"
            : "No inventory yet"}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {search
            ? "Try a different product name, SKU, or supplier."
            : "Products added to your store will appear here."}
        </p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-left">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Product
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <button
                  type="button"
                  onClick={() =>
                    toggleSort(
                      "stock",
                    )
                  }
                  className="inline-flex items-center gap-1"
                >
                  Stock

                  {sortField ===
                    "stock" &&
                    (sortDirection ===
                    "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5" />
                    ))}
                </button>
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Supplier
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cost
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Price
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Inventory value
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map(
              (product) => {
                const stock =
                  getStock(product);

                const threshold =
                  getThreshold(
                    product,
                  );

                const supplierCost =
                  getSupplierCost(
                    product,
                  );

                const price =
                  getPrice(product);

                const image =
                  getProductImage(
                    product,
                  );

                const inventoryValue =
                  stock *
                  supplierCost;

                const currency =
                  product.currency ||
                  "USD";

                const supplier =
                  product.supplier ??
                  product.supplier_name ??
                  product.supplierName ??
                  "—";

                return (
                  <tr
                    key={String(
                      product.id,
                    )}
                    className="transition hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          {image ? (
                            <img
                              src={image}
                              alt={String(
                                product.name ??
                                  "Product",
                              )}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              onError={(
                                event,
                              ) => {
                                event.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {product.name ||
                              "Unnamed product"}
                          </p>

                          {(
                            product as InventoryProduct & {
                              sku?: string | null;
                            }
                          ).sku && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              SKU:{" "}
                              {
                                (
                                  product as InventoryProduct & {
                                    sku?: string | null;
                                  }
                                ).sku
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="w-28">
                        <p className="text-sm font-semibold text-slate-900">
                          {stock.toLocaleString()}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Threshold:{" "}
                          {threshold}
                        </p>

                        <StockIndicator
                          stock={
                            stock
                          }
                          threshold={
                            threshold
                          }
                        />
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {supplier}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(
                        supplierCost,
                        currency,
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(
                        price,
                        currency,
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-slate-900">
                        {formatCurrency(
                          inventoryValue,
                          currency,
                        )}
                      </div>

                      <div className="mt-0.5 text-xs text-slate-500">
                        {stock.toLocaleString()}{" "}
                        units
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StockBadge
                        stock={
                          stock
                        }
                        threshold={
                          threshold
                        }
                      />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          openAdjustModal(
                            product,
                          )
                        }
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    )}

    {filteredProducts.length >
      0 && (
      <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
        Showing{" "}
        {filteredProducts.length}{" "}
        of {products.length}{" "}
        products
      </div>
    )}
  </div>

  {adjustProduct && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Adjust stock
            </h2>

            <p className="mt-0.5 text-sm text-slate-500">
              {adjustProduct.name ||
                "Unnamed product"}
            </p>
          </div>

          <button
            type="button"
            onClick={
              closeAdjustModal
            }
            disabled={adjusting}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Current stock
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {getStock(
                adjustProduct,
              ).toLocaleString()}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Adjustment
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  setAdjustMode("add")
                }
                className={
                  "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium " +
                  (adjustMode === "add"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
                }
              >
                <Plus className="h-4 w-4" />
                Add
              </button>

              <button
                type="button"
                onClick={() =>
                  setAdjustMode(
                    "remove",
                  )
                }
                className={
                  "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium " +
                  (adjustMode ===
                  "remove"
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
                }
              >
                <Minus className="h-4 w-4" />
                Remove
              </button>

              <button
                type="button"
                onClick={() =>
                  setAdjustMode(
                    "set",
                  )
                }
                className={
                  "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium " +
                  (adjustMode === "set"
                    ? "border-slate-400 bg-slate-100 text-slate-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
                }
              >
                Set
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="inventory-adjust-amount"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {adjustMode === "set"
                ? "New stock quantity"
                : "Quantity"}
            </label>

            <input
              id="inventory-adjust-amount"
              type="number"
              min="0"
              step="1"
              value={adjustAmount}
              onChange={(event) =>
                setAdjustAmount(
                  event.target.value,
                )
              }
              placeholder="0"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="inventory-adjust-reason"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Reason
            </label>

            <select
              id="inventory-adjust-reason"
              value={adjustReason}
              onChange={(event) =>
                setAdjustReason(
                  event.target
                    .value as InventoryAdjustmentReason,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              {INVENTORY_REASONS.map(
                (reason) => (
                  <option
                    key={reason}
                    value={reason}
                  >
                    {reason}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="inventory-adjust-note"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Note
              <span className="ml-1 font-normal text-slate-400">
                optional
              </span>
            </label>

            <textarea
              id="inventory-adjust-note"
              value={adjustNote}
              onChange={(event) =>
                setAdjustNote(
                  event.target.value,
                )
              }
              rows={3}
              placeholder="Add a note about this adjustment..."
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          {adjustError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {adjustError}
            </div>
          )}

          {adjustAmount &&
            Number.isInteger(
              Number(
                adjustAmount,
              ),
            ) &&
            Number(
              adjustAmount,
            ) >= 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">
                  New stock preview
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {Math.max(
                    0,
                    adjustMode ===
                      "add"
                      ? getStock(
                          adjustProduct,
                        ) +
                          Number(
                            adjustAmount,
                          )
                      : adjustMode ===
                          "remove"
                        ? getStock(
                            adjustProduct,
                          ) -
                          Number(
                            adjustAmount,
                          )
                        : Number(
                            adjustAmount,
                          ),
                  ).toLocaleString()}
                </p>
              </div>
            )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={
              closeAdjustModal
            }
            disabled={adjusting}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() =>
              void handleAdjust()
            }
            disabled={adjusting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {adjusting && (
              <RefreshCw className="h-4 w-4 animate-spin" />
            )}

            {adjusting
              ? "Updating..."
              : "Update stock"}
          </button>
        </div>
      </div>
    </div>
  )}

  {historyOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Inventory history
            </h2>

            <p className="mt-0.5 text-sm text-slate-500">
              Every manual stock adjustment made to Global Inventory.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setHistoryOpen(false)
            }
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {historyLoading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading history...
              </div>
            </div>
          ) : history.length ===
            0 ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center">
              <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
                <History className="h-8 w-8" />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-900">
                No inventory movements yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Stock adjustments will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Product
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Previous
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Change
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      New stock
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reason
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Note
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Admin
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {history.map(
                    (movement) => (
                      <tr
                        key={String(
                          movement.id,
                        )}
                        className="hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                          {formatMovementDate(
                            movement.created_at,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {movement.product_name ||
                              "Unknown product"}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {movement.product_id}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {movement.previous_stock.toLocaleString()}
                        </td>

                        <td
                          className={
                            "px-5 py-4 text-sm font-semibold " +
                            getMovementChangeClass(
                              movement,
                            )
                          }
                        >
                          {getMovementChangeLabel(
                            movement,
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                          {movement.new_stock.toLocaleString()}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {movement.reason}
                          </span>
                        </td>

                        <td className="max-w-[220px] px-5 py-4 text-xs text-slate-500">
                          <span className="block truncate">
                            {movement.note ||
                              "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-500">
                          {movement.admin_id ||
                            "Admin"}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-between border-t border-slate-200 px-5 py-3">
          <p className="text-xs text-slate-500">
            Showing{" "}
            {history.length}{" "}
            movement
            {history.length === 1
              ? ""
              : "s"}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadHistory()
            }
            disabled={
              historyLoading
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={
                "h-3.5 w-3.5 " +
                (historyLoading
                  ? "animate-spin"
                  : "")
              }
            />
            Refresh history
          </button>
        </div>
      </div>
    </div>
  )}
</div>

);
}