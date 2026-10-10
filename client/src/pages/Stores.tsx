import {
  ArrowUpRight,
  Globe2,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Settings2,
  ShoppingBag,
  Store as StoreIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type StoreItem = {
  id: string;
  name: string;
  slug: string;
  niche: string;
  status: "Active" | "Draft";
  description: string;
  logoUrl: string | null;
  products: number;
  createdAt: string;
  updatedAt: string;
};

type StoreApiRecord = {
  id?: string;
  name?: string;
  slug?: string;
  niche?: string;
  status?: string;
  description?: string | null;
  logo_url?: string | null;
  logoUrl?: string | null;
  product_count?: number;
  productCount?: number;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
};

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:4000/api"
).replace(/\/+$/, "");

function getToken(): string {
  return localStorage.getItem("admin_token") || "";
}

async function storeRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_BASE}/store${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.error ||
        payload?.message ||
        `Store request failed (${response.status}).`,
    );
  }

  if (payload?.success === false) {
    throw new Error(payload?.error || payload?.message || "Store request failed.");
  }

  return payload as T;
}

function extractStores(payload: unknown): StoreApiRecord[] {
  if (Array.isArray(payload)) {
    return payload as StoreApiRecord[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.data)) {
    return record.data as StoreApiRecord[];
  }

  if (record.data && typeof record.data === "object") {
    const data = record.data as Record<string, unknown>;

    if (Array.isArray(data.stores)) {
      return data.stores as StoreApiRecord[];
    }
  }

  if (Array.isArray(record.stores)) {
    return record.stores as StoreApiRecord[];
  }

  return [];
}

function mapStore(record: StoreApiRecord): StoreItem {
  const slug = record.slug || record.id || "";

  return {
    id: record.id || slug,
    name: record.name || "Untitled store",
    slug,
    niche: record.niche || "Other",
    status:
      String(record.status).toLowerCase() === "active" ? "Active" : "Draft",
    description: record.description || "",
    logoUrl: record.logo_url ?? record.logoUrl ?? null,
    products: Number(record.product_count ?? record.productCount ?? 0),
    createdAt: record.created_at || record.createdAt || "",
    updatedAt: record.updated_at || record.updatedAt || "",
  };
}

function formatDate(value: string): string {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function getStoreUrl(slug: string): string {
  return `${window.location.origin}/store/${encodeURIComponent(slug)}`;
}

export default function Stores() {
  const navigate = useNavigate();

  const [stores, setStores] = useState<StoreItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "Active" | "Draft">("All");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreNiche, setNewStoreNiche] = useState("Beauty & Skincare");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");

  const loadStores = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const payload = await storeRequest<unknown>("/", {
        method: "GET",
      });

      setStores(extractStores(payload).map(mapStore));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load stores.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  const filteredStores = useMemo(() => {
    const query = search.trim().toLowerCase();

    return stores.filter((store) => {
      const matchesSearch =
        !query ||
        store.name.toLowerCase().includes(query) ||
        store.niche.toLowerCase().includes(query) ||
        store.slug.toLowerCase().includes(query);

      const matchesFilter = filter === "All" || store.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [stores, search, filter]);

  async function createStore() {
    const name = newStoreName.trim();

    if (!name || creating) return;

    setCreating(true);
    setCreateError("");

    try {
      await storeRequest<unknown>("/", {
        method: "POST",
        body: JSON.stringify({
          name,
          niche: newStoreNiche,
          status: "Draft",
        }),
      });

      setNewStoreName("");
      setNewStoreNiche("Beauty & Skincare");
      setShowCreate(false);

      await loadStores();
    } catch (requestError) {
      setCreateError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create this store.",
      );
    } finally {
      setCreating(false);
    }
  }

  function openStore(store: StoreItem) {
    navigate(`/store/${encodeURIComponent(store.slug)}`);
  }

  function previewStore(store: StoreItem) {
    window.open(getStoreUrl(store.slug), "_blank", "noopener,noreferrer");
  }

  async function copyStoreUrl(store: StoreItem) {
    try {
      await navigator.clipboard.writeText(getStoreUrl(store.slug));
      setMenuOpen(null);
    } catch {
      setError("Unable to copy the store URL. Please copy it from the address bar.");
    }
  }

  return (
    <div className="min-h-full bg-[#f7f7f8]">
      <div className="mx-auto max-w-[1500px]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-7 sm:px-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <StoreIcon size={14} />
                  Commerce
                </div>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Stores
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Create, manage, preview and organize every storefront from one place.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCreateError("");
                  setShowCreate(true);
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus size={18} />
                Create store
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200 px-6 py-4 sm:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search stores..."
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-base outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                {(["All", "Active", "Draft"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`min-h-11 shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                      filter === item
                        ? "bg-slate-950 text-white"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {error && (
              <div
                role="alert"
                className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
              >
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void loadStores()}
                  className="min-h-10 shrink-0 rounded-lg border border-red-200 px-3 font-semibold hover:bg-red-100"
                >
                  Try again
                </button>
              </div>
            )}

            {loading ? (
              <div className="py-20 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                <p className="mt-4 text-sm text-slate-500">Loading your stores...</p>
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <StoreIcon size={24} className="text-slate-400" />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-950">
                  {stores.length === 0 ? "Create your first store" : "No stores found"}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {stores.length === 0
                    ? "Create a storefront to start organizing its products and public store page."
                    : "Try another search or filter, or create a new store."}
                </p>

                {stores.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                  >
                    <Plus size={17} />
                    Create store
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {filteredStores.map((store) => (
                  <article
                    key={store.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
                  >
                    <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#f7f2ec_0%,#f2f3ef_48%,#ece9e4_100%)] p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 text-white shadow-sm">
                            {store.logoUrl ? (
                              <img
                                src={store.logoUrl}
                                alt={`${store.name} logo`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <StoreIcon size={22} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate text-xl font-semibold tracking-tight text-slate-950">
                                {store.name}
                              </h2>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  store.status === "Active"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {store.status}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-slate-500">{store.niche}</p>
                          </div>
                        </div>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuOpen(menuOpen === store.id ? null : store.id)
                            }
                            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-950"
                            aria-label={`More options for ${store.name}`}
                            aria-expanded={menuOpen === store.id}
                          >
                            <MoreHorizontal size={20} />
                          </button>

                          {menuOpen === store.id && (
                            <div className="absolute right-0 top-12 z-20 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpen(null);
                                  openStore(store);
                                }}
                                className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <Settings2 size={16} />
                                Manage
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpen(null);
                                  previewStore(store);
                                }}
                                className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <ArrowUpRight size={16} />
                                Preview
                              </button>

                              <button
                                type="button"
                                onClick={() => void copyStoreUrl(store)}
                                className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <Globe2 size={16} />
                                Copy store URL
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 flex min-h-11 items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5">
                        <Globe2 size={16} className="shrink-0 text-slate-400" />
                        <span className="truncate text-sm text-slate-600">
                          {getStoreUrl(store.slug)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-slate-100">
                      <Metric
                        icon={Package}
                        label="Products"
                        value={store.products.toLocaleString()}
                      />

                      <Metric icon={ShoppingBag} label="Orders" value="—" />

                      <Metric icon={ArrowUpRight} label="Revenue" value="—" />
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-400">
                        Created {formatDate(store.createdAt)}
                      </p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => previewStore(store)}
                          className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Preview
                        </button>

                        <button
                          type="button"
                          onClick={() => openStore(store)}
                          className="min-h-11 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Manage store
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="mt-5 flex items-center justify-between px-1 text-xs text-slate-400">
          <span>
            {stores.length} {stores.length === 1 ? "store" : "stores"} total
          </span>
          <span>Store management</span>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-store-title"
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  New storefront
                </p>

                <h2
                  id="create-store-title"
                  className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
                >
                  Create a store
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Set the basic identity of your storefront. You can configure it further after creation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-950"
                aria-label="Close create store dialog"
              >
                ×
              </button>
            </div>

            <form
              className="mt-7 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void createStore();
              }}
            >
              <div>
                <label
                  htmlFor="store-name"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Store name
                </label>

                <input
                  id="store-name"
                  value={newStoreName}
                  onChange={(event) => setNewStoreName(event.target.value)}
                  placeholder="e.g. Glow Skin"
                  maxLength={100}
                  required
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label
                  htmlFor="store-niche"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Business category
                </label>

                <select
                  id="store-niche"
                  value={newStoreNiche}
                  onChange={(event) => setNewStoreNiche(event.target.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-slate-400"
                >
                  <option>Beauty &amp; Skincare</option>
                  <option>Electronics &amp; Devices</option>
                  <option>Pet Products</option>
                  <option>Shapewear</option>
                  <option>Fashion</option>
                  <option>Home &amp; Lifestyle</option>
                  <option>Other</option>
                </select>
              </div>

              {createError && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {createError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  disabled={creating}
                  className="min-h-12 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!newStoreName.trim() || creating}
                  className="min-h-12 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {creating ? "Creating..." : "Create store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 px-3 py-5 sm:px-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={15} />
        <span className="text-xs font-medium">{label}</span>
      </div>

      <p className="mt-2 truncate text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}
