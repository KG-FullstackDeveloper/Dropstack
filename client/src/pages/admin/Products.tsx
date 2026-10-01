import { Package, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Product } from "../../types/product";
import { getAdminProducts, deleteProduct } from "../../services/adminApi";
import { formatCurrency } from "../../utils/currency";
import ProductModal from "../../components/admin/ProductModal";
import { useToast } from "../../components/admin/Toast";

export default function Products() {
  const { addToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getAdminProducts();
      setProducts(result);
    } catch (err) {
      setError("Unable to load products.");
      addToast("Unable to load products.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query)
    );
  }, [products, search]);

  function openAdd() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteProduct(id);
      addToast("Product deleted.", "success");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete product.", "error");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">Catalog</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Products</h1>
          <p className="mt-2 text-slate-500">
            Manage the products you sell and their real costs.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus size={18} />
          Add product
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 p-5">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {loading && (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-500">Loading products...</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-12 text-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className="divide-y divide-slate-100">
            {filteredProducts.map((product) => {
              const profit = Number(product.profit_per_unit) || 0;
              const margin = Number(product.profit_margin) || 0;
              const isActive = product.active === 1;

              return (
                <div
                  key={product.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                >
                  {/* Image */}
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package size={24} className="text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-slate-900">{product.name}</h3>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{product.category}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {product.supplier_name || "No supplier assigned"}
                    </p>
                  </div>

                  {/* Numbers */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:flex sm:items-center sm:gap-8">
                    <div>
                      <p className="text-xs text-slate-400">Selling</p>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(product.price, product.currency)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Supplier</p>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(product.supplier_cost, product.currency)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Profit</p>
                      <p
                        className={`mt-1 font-semibold ${
                          profit >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(profit, product.currency)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Margin</p>
                      <p
                        className={`mt-1 font-semibold ${
                          margin >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {margin.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {confirmDeleteId === product.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Delete?</span>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                        >
                          {deletingId === product.id ? "Deleting..." : "Yes, delete"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => openEdit(product)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(product.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="p-12 text-center">
            <Package size={40} className="mx-auto text-slate-300" />
            <p className="mt-3 font-medium text-slate-600">
              {products.length === 0
                ? "No products yet."
                : "No products match your search."}
            </p>
            {products.length === 0 && (
              <p className="mt-1 text-sm text-slate-400">
                Add your first product to get started.
              </p>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => setModalOpen(false)}
          onSuccess={loadProducts}
        />
      )}
    </div>
  );
}
