import {
  CalendarDays,
  ExternalLink,
  Globe2,
  RefreshCw,
  Search,
  Store as StoreIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE =
  (import.meta.env.VITE_API_URL || "http://localhost:4000")
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "") + "/api";

interface StoreItem {
  id: string;
  name: string;
  slug: string;
  niche?: string;
  domain?: string | null;
  status?: string;
  description?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

function normalizeStatus(status?: string): string {
  const value = (status || "draft").toLowerCase();

  if (["active", "published", "enabled", "live"].includes(value)) {
    return "active";
  }

  if (["archived", "deleted"].includes(value)) {
    return "archived";
  }

  return "draft";
}

function unwrapStores(payload: unknown): StoreItem[] {
  if (Array.isArray(payload)) {
    return payload as StoreItem[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const result = payload as {
    data?: unknown;
    stores?: unknown;
  };

  if (Array.isArray(result.data)) {
    return result.data as StoreItem[];
  }

  if (Array.isArray(result.stores)) {
    return result.stores as StoreItem[];
  }

  if (result.data && typeof result.data === "object") {
    const nested = result.data as { stores?: unknown };

    if (Array.isArray(nested.stores)) {
      return nested.stores as StoreItem[];
    }
  }

  return [];
}

function getStoreUrl(store: StoreItem): string {
  if (store.domain) {
    const domain = store.domain.trim();

    if (/^https?:\/\//i.test(domain)) {
      return domain;
    }

    return `https://${domain}`;
  }

  return `${window.location.origin}/store/${store.slug}`;
}

function formatDate(date?: string): string {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function StorePage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStores = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("admin_token");

      const response = await fetch(`${API_BASE}/stores`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });

      let result: unknown;

      try {
        result = await response.json();
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        const message =
          result && typeof result === "object"
            ? (result as { error?: string; message?: string }).error ||
              (result as { message?: string }).message
            : undefined;

        throw new Error(message || "Unable to load your stores.");
      }

      const loadedStores = unwrapStores(result);

      setStores(
        loadedStores.filter(
          (store) => store && store.id && store.name && store.slug,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading stores.",
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

    if (!query) return stores;

    return stores.filter((store) =>
      [
        store.name,
        store.slug,
        store.domain,
        store.niche,
        store.description,
        store.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [stores, search]);

  const activeCount = stores.filter(
    (store) => normalizeStatus(store.status) === "active",
  ).length;

  const draftCount = stores.filter(
    (store) => normalizeStatus(store.status) === "draft",
  ).length;

  const archivedCount = stores.filter(
    (store) => normalizeStatus(store.status) === "archived",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">
            Store Management / Store Page
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">Store Page</h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            View your code-built storefronts, check their status, and open live
            stores without changing their settings here.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadStores()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total stores</p>
            <StoreIcon size={19} className="text-slate-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {stores.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Registered storefronts</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Active stores</p>
          <p className="mt-3 text-3xl font-bold text-emerald-600">
            {activeCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Marked as active</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Draft stores</p>
          <p className="mt-3 text-3xl font-bold text-amber-600">{draftCount}</p>
          <p className="mt-1 text-xs text-slate-500">Not marked active</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Archived stores</p>
          <p className="mt-3 text-3xl font-bold text-slate-500">
            {archivedCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Archived records</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Your storefronts
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a store to view its public storefront.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search stores..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              Couldn't load stores
            </p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadStores()}
              className="mt-3 text-sm font-semibold text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Loading your storefronts...
          </div>
        ) : !error && filteredStores.length === 0 ? (
          <div className="py-16 text-center">
            <StoreIcon size={34} className="mx-auto text-slate-300" />
            <h3 className="mt-4 font-semibold text-slate-800">
              {stores.length === 0
                ? "No stores registered yet"
                : "No stores match your search"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {stores.length === 0
                ? "Once your code-built stores are registered in the system, they will appear here."
                : "Try another store name, domain, or category."}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredStores.map((store) => {
              const status = normalizeStatus(store.status);
              const storeUrl = getStoreUrl(store);
              const isActive = status === "active";

              return (
                <article
                  key={store.id}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                      <StoreIcon size={23} className="text-slate-600" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words font-semibold text-slate-900">
                          {store.name}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : status === "archived"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>

                      <p className="mt-1 break-all text-sm text-slate-500">
                        /store/{store.slug}
                      </p>
                    </div>
                  </div>

                  {store.description && (
                    <p className="mt-4 line-clamp-2 text-sm text-slate-600">
                      {store.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    {store.niche && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <StoreIcon
                          size={15}
                          className="shrink-0 text-slate-400"
                        />
                        <span>{store.niche}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <Globe2
                        size={15}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      <span className="break-all">
                        {store.domain || storeUrl}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <CalendarDays size={15} className="shrink-0" />
                      <span>
                        Created{" "}
                        {formatDate(store.createdAt || store.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    {isActive ? (
                      <a
                        href={storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        View storefront
                        <ExternalLink size={16} />
                      </a>
                    ) : (
                      <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-center text-xs text-slate-500">
                        This store is not marked active. Manage its status from
                        the Stores page.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
