import {
  AlertTriangle,
  Box,
  ChevronDown,
  Package,
  RefreshCw,
  Search,
  TrendingDown,
  Warehouse,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product } from "../../types/product";
import { getAdminProducts } from "../../services/adminApi";
import { formatCurrency } from "../../utils/currency";
import { useToast } from "../../components/admin/Toast";

type StockFilter =
  | "all"
  | "healthy"
  | "low"
  | "out";

type SortOption =
  | "stock"
  | "name"
  | "value"
  | "low";

function getStockStatus(product: Product) {
  const stock = Number(product.stock ?? 0);
  const threshold = Number(
    product.low_stock_threshold ?? 0,
  );

  if (stock <= 0) return "out";

  if (threshold > 0 && stock <= threshold) {
    return "low";
  }

  return "healthy";
}

function getStatusLabel(product: Product) {
  const status = getStockStatus(product);
  const stock = Number(product.stock ?? 0);

  if (status === "out") {
    return "Out of stock";
  }

  if (status === "low") {
    return `Low stock · ${stock}`;
  }

  return `${stock} in stock`;
}

function StockBadge({
  product,
}: {
  product: Product;
}) {
  const status = getStockStatus(product);

  if (status === "out") {
    return (
      <span className="inline-flex rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
        Out of stock
      </span>
    );
  }

  if (status === "low") {
    return (
      <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
        {getStatusLabel(product)}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      In stock
    </span>
  );
}

function StockIndicator({
  product,
}: {
  product: Product;
}) {
  const stock = Number(product.stock ?? 0);
  const threshold = Number(
    product.low_stock_threshold ?? 0,
  );

  if (stock <= 0) {
    return (
      <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full w-0 rounded-full" />
      </div>
    );
  }

  if (threshold > 0) {
    const percentage = Math.min(
      100,
      Math.max(
        8,
        (stock / Math.max(threshold * 3, stock)) *
          100,
      ),
    );

    return (
      <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-amber-500"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div className="h-full w-full rounded-full bg-emerald-500" />
    </div>
  );
}

export default function Inventory() {
  const { addToast } = useToast();

  const [products, setProducts] = useState<Product[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] =
    useState<StockFilter>("all");
  const [sortBy, setSortBy] =
    useState<SortOption>("stock");

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getAdminProducts();

      setProducts(result as Product[]);
    } catch (err) {
      console.error(err);
      addToast(
        "Unable to load inventory.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const stats = useMemo(() => {
    const activeProducts = products.filter(
      (product) => Number(product.active) === 1,
    );

    const totalUnits = products.reduce(
      (sum, product) =>
        sum + Number(product.stock ?? 0),
      0,
    );

    const lowInventory = products.filter(
      (product) =>
        getStockStatus(product) === "low",
    ).length;

    const outOfStock = products.filter(
      (product) =>
        getStockStatus(product) === "out",
    ).length;

    const inventoryCost = products.reduce(
      (sum, product) =>
        sum +
        Number(product.stock ?? 0) *
          Number(product.supplier_cost ?? 0),
      0,
    );

    const retailValue = products.reduce(
      (sum, product) =>
        sum +
        Number(product.stock ?? 0) *
          Number(product.price ?? 0),
      0,
    );

    const inventoryUnitsAtRisk = products
      .filter(
        (product) =>
          getStockStatus(product) === "low" ||
          getStockStatus(product) === "out",
      )
      .reduce(
        (sum, product) =>
          sum + Number(product.stock ?? 0),
        0,
      );

    return {
      products: products.length,
      activeProducts: activeProducts.length,
      totalUnits,
      lowInventory,
      outOfStock,
      inventoryCost,
      retailValue,
      inventoryUnitsAtRisk,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesSearch =
        !query ||
        [
          product.name,
          product.category,
          product.sku,
          product.slug,
          product.supplier_name,
          product.warehouse_country,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query),
          );

      const matchesStock =
        stockFilter === "all" ||
        getStockStatus(product) ===
          stockFilter;

      return matchesSearch && matchesStock;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "value") {
        const aValue =
          Number(a.stock ?? 0) *
          Number(a.supplier_cost ?? 0);

        const bValue =
          Number(b.stock ?? 0) *
          Number(b.supplier_cost ?? 0);

        return bValue - aValue;
      }

      if (sortBy === "low") {
        const aStatus = getStockStatus(a);
        const bStatus = getStockStatus(b);

        const rank: Record<string, number> = {
          out: 0,
          low: 1,
          healthy: 2,
        };

        return (
          rank[aStatus] - rank[bStatus]
        );
      }

      return (
        Number(a.stock ?? 0) -
        Number(b.stock ?? 0)
      );
    });
  }, [
    products,
    search,
    stockFilter,
    sortBy,
  ]);

  const clearFilters = () => {
    setSearch("");
    setStockFilter("all");
    setSortBy("stock");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Operations
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Inventory
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                Monitor product availability,
                stock levels, and inventory value.
              </p>
            </div>

            <button
              type="button"
              onClick={loadInventory}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              {loading
                ? "Refreshing..."
                : "Refresh inventory"}
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<Package size={19} />}
            title="Products"
            value={
              loading
                ? "..."
                : stats.products.toLocaleString()
            }
          />

          <StatCard
            icon={<Box size={19} />}
            title="Active products"
            value={
              loading
                ? "..."
                : stats.activeProducts.toLocaleString()
            }
          />

          <StatCard
            icon={<Warehouse size={19} />}
            title="Units in stock"
            value={
              loading
                ? "..."
                : stats.totalUnits.toLocaleString()
            }
          />

          <StatCard
            icon={<AlertTriangle size={19} />}
            title="Low / out of stock"
            value={
              loading
                ? "..."
                : (
                    stats.lowInventory +
                    stats.outOfStock
                  ).toLocaleString()
            }
            warning={
              stats.lowInventory +
                stats.outOfStock >
              0
            }
          />

          <StatCard
            icon={<TrendingDown size={19} />}
            title="Inventory cost"
            value={
              loading
                ? "..."
                : formatCurrency(
                    stats.inventoryCost,
                    "USD",
                  )
            }
          />
        </div>

        {/* Inventory value overview */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <ValueCard
            title="Cost value"
            value={
              loading
                ? "..."
                : formatCurrency(
                    stats.inventoryCost,
                    "USD",
                  )
            }
            description="Supplier cost of current stock"
          />

          <ValueCard
            title="Potential retail value"
            value={
              loading
                ? "..."
                : formatCurrency(
                    stats.retailValue,
                    "USD",
                  )
            }
            description="Current stock × selling price"
          />

          <ValueCard
            title="Units requiring attention"
            value={
              loading
                ? "..."
                : stats.inventoryUnitsAtRisk.toLocaleString()
            }
            description="Units currently in low-stock products"
          />
        </div>

        {/* Inventory table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="font-bold">
                  Inventory overview
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {loading
                    ? "Loading inventory..."
                    : `${filteredProducts.length} of ${products.length} products`}
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-950 md:w-[320px]">
                  <Search
                    size={17}
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search products or SKU..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearch("")
                      }
                      className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <Select
                  value={stockFilter}
                  onChange={(value) =>
                    setStockFilter(
                      value as StockFilter,
                    )
                  }
                >
                  <option value="all">
                    All inventory
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
                  value={sortBy}
                  onChange={(value) =>
                    setSortBy(
                      value as SortOption,
                    )
                  }
                >
                  <option value="stock">
                    Lowest stock
                  </option>
                  <option value="low">
                    Needs attention
                  </option>
                  <option value="value">
                    Highest value
                  </option>
                  <option value="name">
                    Product name
                  </option>
                </Select>
              </div>
            </div>

            {(search ||
              stockFilter !== "all" ||
              sortBy !== "stock") && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  Filters active
                </span>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <LoadingState />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              hasProducts={products.length > 0}
              clearFilters={clearFilters}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/60">
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="px-6 py-4">
                      Product
                    </th>
                    <th className="px-6 py-4">
                      SKU
                    </th>
                    <th className="px-6 py-4">
                      Supplier
                    </th>
                    <th className="px-6 py-4">
                      Available
                    </th>
                    <th className="px-6 py-4">
                      Threshold
                    </th>
                    <th className="px-6 py-4">
                      Inventory value
                    </th>
                    <th className="px-6 py-4">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map(
                    (product) => {
                      const stock = Number(
                        product.stock ?? 0,
                      );

                      const threshold =
                        Number(
                          product.low_stock_threshold ??
                            0,
                        );

                      const inventoryValue =
                        stock *
                        Number(
                          product.supplier_cost ??
                            0,
                        );

                      const image =
                        product.image_url ||
                        product.images?.[0];

                      return (
                        <tr
                          key={product.id}
                          className="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={
                                      product.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Package
                                      size={19}
                                      className="text-slate-400"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[270px] truncate text-sm font-semibold">
                                  {product.name}
                                </p>

                                <p className="mt-1 max-w-[270px] truncate text-xs text-slate-500 dark:text-slate-400">
                                  {product.category ||
                                    "Uncategorized"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                              {product.sku ||
                                "—"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <p className="max-w-[180px] truncate text-sm font-medium">
                              {product.supplier_name ||
                                "No supplier"}
                            </p>

                            {product.warehouse_country && (
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {
                                  product.warehouse_country
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm font-bold">
                              {stock.toLocaleString()}
                            </p>

                            <StockIndicator
                              product={
                                product
                              }
                            />
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                              {threshold > 0
                                ? threshold.toLocaleString()
                                : "Not set"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold">
                              {formatCurrency(
                                inventoryValue,
                                product.currency ||
                                  "USD",
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {formatCurrency(
                                Number(
                                  product.supplier_cost ||
                                    0,
                                ),
                                product.currency ||
                                  "USD",
                              )}{" "}
                              / unit
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-col items-start gap-2">
                              <StockBadge
                                product={
                                  product
                                }
                              />

                              {Number(
                                product.active,
                              ) === 1 ? (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                  Active
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Inactive
                                </span>
                              )}
                            </div>
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

        {/* Warning */}
        {!loading &&
          (stats.lowInventory > 0 ||
            stats.outOfStock > 0) && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex gap-3">
                <AlertTriangle
                  size={20}
                  className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                />

                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-300">
                    Inventory needs attention
                  </h3>

                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
                    {stats.outOfStock > 0 &&
                      `${stats.outOfStock} product${
                        stats.outOfStock ===
                        1
                          ? ""
                          : "s"
                      } out of stock.`}

                    {stats.outOfStock > 0 &&
                      stats.lowInventory > 0 &&
                      " "}

                    {stats.lowInventory > 0 &&
                      `${stats.lowInventory} product${
                        stats.lowInventory ===
                        1
                          ? ""
                          : "s"
                      } running low.`}
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  warning = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          warning
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        }`}
      >
        {icon}
      </div>

      <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
        {title}
      </p>

      <p className="mt-1.5 text-2xl font-bold tracking-tight">
        {value}
      </p>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-semibold">
        {title}
      </p>

      <p className="mt-3 text-2xl font-bold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
    <div className="relative">
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium outline-none dark:border-slate-700 dark:bg-slate-950 md:min-w-[160px]"
      >
        {children}
      </select>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[360px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />

        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Loading inventory...
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  hasProducts,
  clearFilters,
}: {
  hasProducts: boolean;
  clearFilters: () => void;
}) {
  return (
    <div className="p-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <Package
          size={27}
          className="text-slate-400"
        />
      </div>

      <h3 className="mt-4 font-semibold">
        {hasProducts
          ? "No products match your filters"
          : "No inventory yet"}
      </h3>

      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
        {hasProducts
          ? "Try changing your search or inventory filters."
          : "Products will appear here after they are added to your catalog."}
      </p>

      {hasProducts && (
        <button
          type="button"
          onClick={clearFilters}
          className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}