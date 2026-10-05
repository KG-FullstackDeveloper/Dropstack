import { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
} from "../../services/adminApi";
import type { Product } from "../../types/product";
import ProductModal from "../../components/admin/ProductModal";

type StatusFilter = "all" | "active" | "inactive";
type StockFilter = "all" | "healthy" | "low" | "out";

function formatMoney(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  } catch {
    return `${currency} ${Number(value || 0).toFixed(2)}`;
  }
}

function getStockStatus(product: Product) {
  const stock = Number(product.stock ?? 0);
  const threshold = Number(product.low_stock_threshold ?? 0);

  if (stock <= 0) return "out";
  if (threshold > 0 && stock <= threshold) return "low";
  return "healthy";
}

function stockLabel(product: Product) {
  const stock = Number(product.stock ?? 0);

  if (stock <= 0) return "Out of stock";

  const threshold = Number(product.low_stock_threshold ?? 0);

  if (threshold > 0 && stock <= threshold) {
    return `${stock} low`;
  }

  return `${stock} in stock`;
}

function StatusBadge({ active }: { active: number }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-slate-500/10 text-slate-500 dark:text-slate-400"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function StockBadge({ product }: { product: Product }) {
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
        {stockLabel(product)}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      {stockLabel(product)}
    </span>
  );
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");
  const [stockFilter, setStockFilter] =
    useState<StockFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(
    null,
  );

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const result = await getAdminProducts();

      setProducts((result || []) as Product[]);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load products.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter(Boolean),
      ),
    ).sort();
  }, [products]);

  const stats = useMemo(() => {
    const total = products.length;

    const active = products.filter(
      (product) => Number(product.active) === 1,
    ).length;

    const lowStock = products.filter(
      (product) => getStockStatus(product) === "low",
    ).length;

    const outOfStock = products.filter(
      (product) => getStockStatus(product) === "out",
    ).length;

    const inventoryCost = products.reduce(
      (totalCost, product) =>
        totalCost +
        Number(product.stock ?? 0) *
          Number(product.supplier_cost ?? 0),
      0,
    );

    return {
      total,
      active,
      lowStock,
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
          product.slug,
          product.sku,
          product.supplier_name,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query),
          );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          Number(product.active) === 1) ||
        (statusFilter === "inactive" &&
          Number(product.active) !== 1);

      const matchesStock =
        stockFilter === "all" ||
        getStockStatus(product) === stockFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        product.category === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStock &&
        matchesCategory
      );
    });
  }, [
    products,
    search,
    statusFilter,
    stockFilter,
    categoryFilter,
  ]);

  function openCreateModal() {
    setEditingProduct(null);
    setShowModal(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setShowModal(true);
  }

  function handleSaved(savedProduct: Product) {
    setProducts((current) => {
      const exists = current.some(
        (product) => product.id === savedProduct.id,
      );

      if (exists) {
        return current.map((product) =>
          product.id === savedProduct.id
            ? savedProduct
            : product,
        );
      }

      return [savedProduct, ...current];
    });

    setShowModal(false);
    setEditingProduct(null);
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(product.id);
      setError("");

      await deleteProduct(product.id);

      setProducts((current) =>
        current.filter(
          (item) => item.id !== product.id,
        ),
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete product.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Products
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage your catalog, inventory, pricing, variants,
              and suppliers.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <span className="text-lg leading-none">+</span>
            Add product
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-semibold hover:opacity-70"
            >
              ×
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total products
            </p>
            <p className="mt-2 text-2xl font-bold">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Active
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.active}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Low stock
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.lowStock}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Out of stock
            </p>
            <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.outOfStock}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Inventory cost
            </p>
            <p className="mt-2 text-2xl font-bold">
              {formatMoney(stats.inventoryCost)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative min-w-0 flex-1">
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search products, SKU, category, supplier..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as StatusFilter,
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={stockFilter}
              onChange={(event) =>
                setStockFilter(
                  event.target.value as StockFilter,
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="all">All stock</option>
              <option value="healthy">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="all">All categories</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing {filteredProducts.length} of{" "}
              {products.length} products
            </span>

            {(search ||
              statusFilter !== "all" ||
              stockFilter !== "all" ||
              categoryFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setStockFilter("all");
                  setCategoryFilter("all");
                }}
                className="font-semibold text-slate-700 hover:underline dark:text-slate-200"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Product table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />

                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Loading products...
                </p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
                📦
              </div>

              <h3 className="text-base font-semibold">
                {products.length === 0
                  ? "No products yet"
                  : "No products found"}
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {products.length === 0
                  ? "Add your first product to start building your catalog."
                  : "Try changing your search or filters."}
              </p>

              {products.length === 0 && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
                >
                  Add your first product
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                    <th className="px-5 py-4">
                      Product
                    </th>
                    <th className="px-5 py-4">
                      Category
                    </th>
                    <th className="px-5 py-4">
                      Price
                    </th>
                    <th className="px-5 py-4">
                      Stock
                    </th>
                    <th className="px-5 py-4">
                      Supplier
                    </th>
                    <th className="px-5 py-4">
                      Profit
                    </th>
                    <th className="px-5 py-4">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map((product) => {
                    const image =
                      product.image_url ||
                      product.images?.[0];

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                      >
                        {/* Product */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                              {image ? (
                                <img
                                  src={image}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-lg">
                                  📦
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(product)
                                }
                                className="max-w-[280px] truncate text-left text-sm font-semibold hover:underline"
                              >
                                {product.name}
                              </button>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                {product.sku && (
                                  <span>
                                    SKU: {product.sku}
                                  </span>
                                )}

                                {product.variants &&
                                  product.variants.length >
                                    0 && (
                                    <span>
                                      •{" "}
                                      {
                                        product.variants
                                          .length
                                      }{" "}
                                      variants
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {product.category || "—"}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold">
                            {formatMoney(
                              Number(product.price || 0),
                              product.currency || "USD",
                            )}
                          </div>

                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Cost{" "}
                            {formatMoney(
                              Number(
                                product.supplier_cost || 0,
                              ),
                              product.currency || "USD",
                            )}
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="px-5 py-4">
                          <StockBadge product={product} />
                        </td>

                        {/* Supplier */}
                        <td className="px-5 py-4">
                          <div className="max-w-[180px] truncate text-sm text-slate-700 dark:text-slate-300">
                            {product.supplier_name || "—"}
                          </div>

                          {product.warehouse_country && (
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {product.warehouse_country}
                            </div>
                          )}
                        </td>

                        {/* Profit */}
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(
                              Number(
                                product.profit_per_unit ||
                                  0,
                              ),
                              product.currency || "USD",
                            )}
                          </div>

                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {Number(
                              product.profit_margin || 0,
                            ).toFixed(1)}
                            % margin
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge
                            active={Number(product.active)}
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(product)
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={
                                deletingId === product.id
                              }
                              onClick={() =>
                                handleDelete(product)
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                            >
                              {deletingId === product.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
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
      </div>

      {/* Product modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}