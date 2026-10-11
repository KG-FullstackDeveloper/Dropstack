import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Archive,
  Check,
  Copy,
  ExternalLink,
  Globe,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  Search,
  Store as StoreIcon,
  X,
} from "lucide-react";

type StoreStatus = "active" | "draft" | "archived";

type StoreItem = {
  id: string;
  name: string;
  slug: string;
  niche: string;
  domain: string;
  status: StoreStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

type Product = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  price: number;
  currency?: string;
  image_url?: string | null;
  images?: string[] | string | null;
  sku?: string | null;
  stock?: number;
  active?: number;
};

type ApiResult<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:4000/api"
).replace(/\/+$/, "");

async function apiRequest<T>(
  endpoint: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = localStorage.getItem("admin_token");

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const result = (await response.json().catch(() => ({}))) as ApiResult<T>;

  if (!response.ok || result.success === false) {
    throw new Error(result.error || `Request failed (${response.status}).`);
  }

  // Some APIs return { success, data }, while others return the payload directly.
  if (Object.prototype.hasOwnProperty.call(result, "data")) {
    return result.data as T;
  }
  return result as T;
}

function normalizeStatus(status?: string): StoreStatus {
  const value = (status || "draft").toLowerCase();
  if (value === "active") return "active";
  if (value === "archived") return "archived";
  return "draft";
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function money(price: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(price) || 0);
  } catch {
    return `${currency} ${(Number(price) || 0).toFixed(2)}`;
  }
}

function getProductImage(product: Product): string | undefined {
  if (product.image_url) return product.image_url;
  if (Array.isArray(product.images)) return product.images[0] || undefined;
  if (typeof product.images === "string") {
    try {
      const parsed: unknown = JSON.parse(product.images);
      if (Array.isArray(parsed) && typeof parsed[0] === "string") {
        return parsed[0];
      }
    } catch {
      if (product.images.trim()) return product.images;
    }
  }
  return undefined;
}

function unwrapList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && "items" in value) {
    const items = (value as { items?: unknown }).items;
    if (Array.isArray(items)) return items as T[];
  }
  return [];
}

export default function Stores() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "draft">("all");

  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreItem | null>(null);
  const [actionStore, setActionStore] = useState<string | null>(null);
  const [copiedStore, setCopiedStore] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [niche, setNiche] = useState("General");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [status, setStatus] = useState<StoreStatus>("draft");

  const loadStores = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<unknown>("/stores");
      const data = unwrapList<StoreItem>(response);
      setStores(
        data.map((store) => ({
          ...store,
          niche: store.niche || "General",
          domain: store.domain || "",
          status: normalizeStatus(store.status),
          createdAt: store.createdAt || "",
          updatedAt: store.updatedAt || "",
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load stores.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const response = await apiRequest<unknown>("/products");
      setProducts(unwrapList<Product>(response));
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not load products: ${err.message}`
          : "Could not load products.",
      );
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  const filteredStores = useMemo(() => {
    const query = search.trim().toLowerCase();
    return stores.filter((store) => {
      const matchesSearch = [
        store.name || "",
        store.slug || "",
        store.niche || "",
        store.domain || "",
      ].some((value) => value.toLowerCase().includes(query));

      return matchesSearch && (filter === "all" || store.status === filter);
    });
  }, [stores, search, filter]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return products.filter((product) =>
      [product.name || "", product.category || "", product.sku || ""].some(
        (value) => value.toLowerCase().includes(query),
      ),
    );
  }, [products, productSearch]);

  function resetForm() {
    setName("");
    setNiche("General");
    setDescription("");
    setDomain("");
    setStatus("draft");
    setSelectedProducts([]);
    setEditingStore(null);
    setProductSearch("");
  }

  async function openCreateForm() {
    resetForm();
    setError("");
    setNotice("");
    setShowForm(true);
    await loadProducts();
  }

  async function openEditForm(store: StoreItem) {
    resetForm();
    setError("");
    setNotice("");
    setEditingStore(store);
    setName(store.name || "");
    setNiche(store.niche || "General");
    setDescription(store.description || "");
    setDomain(store.domain === `${store.slug}.localhost` ? "" : store.domain || "");
    setStatus(normalizeStatus(store.status));
    setShowForm(true);

    await Promise.all([
      loadProducts(),
      (async () => {
        try {
          const response = await apiRequest<unknown>(
            `/stores/${encodeURIComponent(store.id)}/products`,
          );
          const payload = response as {
            productIds?: unknown;
            products?: unknown;
            data?: unknown;
          };
          let ids: string[] = [];

          if (Array.isArray(payload?.productIds)) {
            ids = payload.productIds.map(String);
          } else if (Array.isArray(payload?.products)) {
            ids = (payload.products as Array<string | Product>).map((item) =>
              typeof item === "string" ? item : String(item.id),
            );
          } else if (Array.isArray(payload?.data)) {
            ids = (payload.data as Array<string | Product>).map((item) =>
              typeof item === "string" ? item : String(item.id),
            );
          } else if (Array.isArray(response)) {
            ids = (response as Array<string | Product>).map((item) =>
              typeof item === "string" ? item : String(item.id),
            );
          }
          setSelectedProducts(ids.filter(Boolean));
        } catch {
          // Older backend versions may not yet expose store-product assignments.
          setSelectedProducts([]);
        }
      })(),
      (async () => {
        try {
          const config = await apiRequest<{
            description?: string;
            data?: { description?: string };
          }>(`/store/${encodeURIComponent(store.id)}`);
          const details = config as { description?: string; data?: { description?: string } };
          if (details.description || details.data?.description) {
            setDescription(details.description || details.data?.description || "");
          }
        } catch {
          // Store description is optional; keep the value already in the store record.
        }
      })(),
    ]);
  }

  function toggleProduct(id: string) {
    setSelectedProducts((current) =>
      current.includes(id)
        ? current.filter((productId) => productId !== id)
        : [...current, id],
    );
  }

  function selectAllShown() {
    setSelectedProducts((current) => {
      const combined = new Set(current);
      filteredProducts.forEach((product) => combined.add(product.id));
      return [...combined];
    });
  }

  async function submitStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter a store name.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      name: name.trim(),
      niche: niche.trim() || "General",
      description: description.trim(),
      domain: domain.trim() || null,
      status,
      productIds: selectedProducts,
    };

    try {
      if (editingStore) {
        await apiRequest<StoreItem>(
          `/stores/${encodeURIComponent(editingStore.id)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        setNotice("Store details and product selections saved.");
      } else {
        await apiRequest<StoreItem>("/stores", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotice(
          selectedProducts.length
            ? `Store created with ${selectedProducts.length} selected product(s).`
            : "Store created successfully.",
        );
      }

      setShowForm(false);
      resetForm();
      await loadStores();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save store.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(store: StoreItem, nextStatus: StoreStatus) {
    setActionStore(null);
    setError("");
    setNotice("");
    try {
      await apiRequest<StoreItem>(
        `/stores/${encodeURIComponent(store.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      setNotice(`${store.name} updated.`);
      await loadStores();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update store.");
    }
  }

  async function archiveStore(store: StoreItem) {
    if (store.id === "default") {
      setError("The default store cannot be archived here.");
      return;
    }
    if (!window.confirm(`Archive "${store.name}"?`)) return;

    setActionStore(null);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/stores/${encodeURIComponent(store.id)}`, {
        method: "DELETE",
      });
      setNotice(`${store.name} archived.`);
      await loadStores();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to archive store.");
    }
  }

  function getStoreUrl(store: StoreItem) {
    const localDomain = `${store.slug}.localhost`;
    if (store.domain && store.domain !== localDomain) {
      return /^https?:\/\//i.test(store.domain)
        ? store.domain
        : `https://${store.domain}`;
    }
    return `http://${localDomain}:5173`;
  }

  async function copyStoreLink(store: StoreItem) {
    const url = getStoreUrl(store);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedStore(store.id);
      setNotice("Store link copied.");
      window.setTimeout(() => {
        setCopiedStore((current) => (current === store.id ? null : current));
      }, 1800);
    } catch {
      setError(`Copy was blocked by the browser. Store link: ${url}`);
    }
  }

  const totalStores = stores.filter((store) => store.status !== "archived").length;
  const activeStores = stores.filter((store) => store.status === "active").length;
  const draftStores = stores.filter((store) => store.status === "draft").length;

  return (
    <main className="min-h-full bg-slate-50 p-4 sm:p-7">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">
              Dashboard / Store Management
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Store Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Build and manage storefronts from one workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void openCreateForm()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus size={17} />
            Create Store
          </button>
        </header>

        {error && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <span className="break-words">{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
              <X size={16} />
            </button>
          </div>
        )}
        {notice && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice">
              <X size={16} />
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total stores", value: totalStores, hint: "Managed storefronts", icon: StoreIcon },
            { label: "Active stores", value: activeStores, hint: "Published status", icon: Globe },
            { label: "Draft stores", value: draftStores, hint: "Not yet published", icon: Archive },
            { label: "Available products", value: products.length, hint: "From your Products API", icon: Package },
          ].map(({ label, value, hint, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <Icon size={19} className="text-slate-400" />
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {loading ? "—" : value}
              </p>
              <p className="mt-1 text-xs text-slate-400">{hint}</p>
            </article>
          ))}
        </section>

        <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Your Stores</h2>
              <p className="mt-1 text-sm text-slate-500">
                Edit store details, copy links, and manage publication status.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search stores..."
                  className="min-h-10 w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 sm:w-64"
                />
              </div>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as typeof filter)}
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="all">All stores</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
                <LoaderCircle className="animate-spin" size={18} />
                Loading stores...
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-5 py-14 text-center">
                <StoreIcon className="mx-auto text-slate-300" size={32} />
                <h3 className="mt-3 font-semibold text-slate-900">No stores found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Create a store or change your search filters.
                </p>
              </div>
            ) : (
              filteredStores.map((store) => (
                <article
                  key={store.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <StoreIcon size={22} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">{store.name}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          store.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : store.status === "draft"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                        }`}>
                          {store.status.charAt(0).toUpperCase() + store.status.slice(1)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {store.domain || `${store.slug}.localhost`} · {store.niche}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Slug: {store.slug} · Created {formatDate(store.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" title="Copy store link" onClick={() => void copyStoreLink(store)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 hover:bg-slate-50">
                      {copiedStore === store.id ? <Check size={16} /> : <Copy size={16} />}
                      {copiedStore === store.id ? "Copied" : "Copy link"}
                    </button>
                    <button type="button" title="Open storefront" onClick={() => window.open(getStoreUrl(store), "_blank", "noopener,noreferrer")} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                      <ExternalLink size={17} />
                    </button>
                    <button type="button" title="Edit store" onClick={() => void openEditForm(store)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                      <Pencil size={17} />
                    </button>
                    <div className="relative">
                      <button type="button" title="More store actions" onClick={() => setActionStore(actionStore === store.id ? null : store.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                        <Archive size={17} />
                      </button>
                      {actionStore === store.id && (
                        <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                          {store.status !== "active" && (
                            <button type="button" onClick={() => void updateStatus(store, "active")} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">
                              Mark active
                            </button>
                          )}
                          {store.status !== "draft" && (
                            <button type="button" onClick={() => void updateStatus(store, "draft")} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">
                              Move to draft
                            </button>
                          )}
                          {store.status !== "archived" && (
                            <button type="button" onClick={() => void archiveStore(store)} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">
                              Archive store
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
              resetForm();
            }
          }}
        >
          <form onSubmit={submitStore} className="my-5 w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {editingStore ? "Edit store" : "Create your storefront"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Configure the basics and choose products from your catalogue.
                </p>
              </div>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Store name *
                <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Beauty Bliss" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-emerald-500" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Store category
                <input value={niche} onChange={(event) => setNiche(event.target.value)} placeholder="Beauty, fashion, electronics..." className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-emerald-500" />
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Store description
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe your store and what customers can find here..." rows={3} className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-emerald-500" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Domain (optional)
                <input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="shop.example.com" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-emerald-500" />
              </label>
              {editingStore && (
                <label className="text-sm font-medium text-slate-700">
                  Status
                  <select value={status} onChange={(event) => setStatus(event.target.value as StoreStatus)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3">
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              )}
            </div>

            <section className="mt-7 rounded-xl border border-slate-200">
              <div className="border-b border-slate-100 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold text-slate-900">Import products</h3>
                    <p className="mt-1 text-sm text-slate-500">{selectedProducts.length} product(s) selected</p>
                  </div>
                  <button type="button" onClick={selectAllShown} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50">
                    Select all shown
                  </button>
                </div>
                <div className="relative mt-3">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search products by name, category or SKU..." className="min-h-10 w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto p-3">
                {productsLoading ? (
                  <div className="flex justify-center py-8 text-slate-500"><LoaderCircle size={20} className="animate-spin" /></div>
                ) : filteredProducts.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">No products found. Add products in Product Management first.</p>
                ) : (
                  filteredProducts.map((product) => {
                    const image = getProductImage(product);
                    const selected = selectedProducts.includes(product.id);
                    return (
                      <label key={product.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${selected ? "border-emerald-300 bg-emerald-50/50" : "border-slate-100 hover:bg-slate-50"}`}>
                        <input type="checkbox" checked={selected} onChange={() => toggleProduct(product.id)} className="h-4 w-4 accent-emerald-600" />
                        {image ? (
                          <img src={image} alt={product.name} className="h-14 w-14 rounded-lg border border-slate-100 object-cover" />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><Package size={22} /></div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{product.category || "General"} · SKU {product.sku || "—"}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{money(product.price, product.currency)}</p>
                        </div>
                        {typeof product.stock === "number" && <span className="hidden text-xs text-slate-500 sm:block">Stock: {product.stock}</span>}
                      </label>
                    );
                  })
                )}
              </div>
            </section>

            <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <button type="button" disabled={saving} onClick={() => { setShowForm(false); resetForm(); }} className="min-h-11 rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-700">
                Cancel
              </button>
              <button disabled={saving || !name.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {saving && <LoaderCircle size={16} className="animate-spin" />}
                {editingStore ? "Save changes" : "Create store"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
