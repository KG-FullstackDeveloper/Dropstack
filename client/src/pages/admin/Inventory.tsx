import {
  AlertTriangle,
  Box,
  Package,
  Search,
  TrendingDown,
  Warehouse,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product } from "../../types/product";
import { getAdminProducts } from "../../services/adminApi";
import { formatCurrency } from "../../utils/currency";
import { useToast } from "../../components/admin/Toast";

type StockFilter = "all" | "healthy" | "low" | "out";

function getStockStatus(product: Product) {
  const stock = Number(product.stock ?? 0);
  const threshold = Number(product.low_stock_threshold ?? 0);

  if (stock <= 0) return "out";
  if (threshold > 0 && stock <= threshold) return "low";

  return "healthy";
}

function StockBadge({ product }: { product: Product }) {
  const status = getStockStatus(product);
  const stock = Number(product.stock ?? 0);

  if (status === "out") {
    return (
      <span className="inline-flex rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
        Out of stock
      </span>
    );
  }

  if (status === "low") {
    return (
      <span className="inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
        Low stock · {stock}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      {stock} in stock
    </span>
  );
}

export default function Inventory() {
  const { addToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] =
    useState<StockFilter>("all");

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getAdminProducts();

      setProducts(result as Product[]);
    } catch (err) {
      console.error(err);
      addToast("Unable to load inventory.", "error");
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
      (product) => getStockStatus(product) === "low",
    ).length;

    const outOfStock = products.filter(
      (product) => getStockStatus(product) === "out",
    ).length;

    const inventoryCost = products.reduce(
      (sum, product) =>
        sum +
        Number(product.stock ?? 0) *
          Number(product.supplier_cost ?? 0),
      0,
    );

    return {
      products: products.length,
      activeProducts: activeProducts.length,
      totalUnits,
      lowInventory,
      outOfStock,
      inventoryCost,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
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
        getStockStatus(product) === stockFilter;

      return matchesSearch && matchesStock;
    });
  }, [products, search, stockFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Operations
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Inventory
            </h1>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Monitor stock levels, product availability,
              and inventory value.
            </p>
          </div>

          <button
            type="button"
            onClick={loadInventory}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {loading ? "Refreshing..." : "Refresh inventory"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card
            icon={Package}
            title="Products"
            value={
              loading
                ? "..."
                : stats.products.toLocaleString()
            }
          />

          <Card
            icon={Box}
            title="Active products"
            value={
              loading
                ? "..."
                : stats.activeProducts.toLocaleString()
            }
          />

          <Card
            icon={Warehouse}
            title="Units in stock"
            value={
              loading
                ? "..."
                : stats.totalUnits.toLocaleString()
            }
          />

          <Card
            icon={AlertTriangle}
            title="Low inventory"
            value={
              loading
                ? "..."
                : stats.lowInventory.toLocaleString()
            }
            warning
          />

          <Card
            icon={TrendingDown}
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

        {/* Inventory panel */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold">
                Inventory overview
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {loading
                  ? "Loading inventory..."
                  : `${filteredProducts.length} product${
                      filteredProducts.length === 1
                        ? ""
                        : "s"
                    } shown`}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:w-[320px] dark:border-slate-700 dark:bg-slate-950">
                <Search
                  size={18}
                  className="shrink-0 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search products or SKU..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <select
                value={stockFilter}
                onChange={(event) =>
                  setStockFilter(
                    event.target.value as StockFilter,
                  )
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
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
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />

                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Loading inventory...
                </p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Package
                  size={28}
                  className="text-slate-400"
                />
              </div>

              <h3 className="mt-4 font-semibold">
                {products.length === 0
                  ? "No inventory yet"
                  : "No products match your filters"}
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {products.length === 0
                  ? "Products will appear here after they are added to your catalog."
                  : "Try changing your search or stock filter."}
              </p>

              {(search || stockFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStockFilter("all");
                  }}
                  className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                  <tr>
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
                      Stock
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
                  {filteredProducts.map((product) => {
                    const stock = Number(
                      product.stock ?? 0,
                    );

                    const threshold = Number(
                      product.low_stock_threshold ?? 0,
                    );

                    const inventoryValue =
                      stock *
                      Number(
                        product.supplier_cost ?? 0,
                      );

                    const image =
                      product.image_url ||
                      product.images?.[0];

                    return (
                      <tr
                        key={product.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                      >
                        {/* Product */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                              {image ? (
                                <img
                                  src={image}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Package
                                    size={20}
                                    className="text-slate-400"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[280px] truncate font-semibold">
                                {product.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {product.category ||
                                  "Uncategorized"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-300">
                          {product.sku || "—"}
                        </td>

                        {/* Supplier */}
                        <td className="px-6 py-5">
                          <p className="max-w-[180px] truncate text-sm font-medium">
                            {product.supplier_name ||
                              "No supplier"}
                          </p>

                          {product.warehouse_country && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {product.warehouse_country}
                            </p>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold">
                            {stock.toLocaleString()}
                          </p>

                          <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full ${
                                stock <= 0
                                  ? "w-0"
                                  : threshold > 0 &&
                                      stock <=
                                        threshold
                                    ? "w-1/3 bg-amber-500"
                                    : "w-full bg-emerald-500"
                              }`}
                            />
                          </div>
                        </td>

                        {/* Threshold */}
                        <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-300">
                          {threshold > 0
                            ? threshold
                            : "Not set"}
                        </td>

                        {/* Inventory value */}
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold">
                            {formatCurrency(
                              inventoryValue,
                              product.currency ||
                                "USD",
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Cost per unit{" "}
                            {formatCurrency(
                              Number(
                                product.supplier_cost ||
                                  0,
                              ),
                              product.currency ||
                                "USD",
                            )}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-start gap-2">
                            <StockBadge
                              product={product}
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
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inventory warning */}
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
                        stats.outOfStock === 1
                          ? ""
                          : "s"
                      } out of stock.`}

                    {stats.outOfStock > 0 &&
                      stats.lowInventory > 0 &&
                      " "}

                    {stats.lowInventory > 0 &&
                      `${stats.lowInventory} product${
                        stats.lowInventory === 1
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

function Card({
  icon: Icon,
  title,
  value,
  warning = false,
}: {
  icon: typeof Package;
  title: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          warning
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        }`}
      >
        <Icon size={20} />
      </div>

      <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}