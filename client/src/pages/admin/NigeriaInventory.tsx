import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Package,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import {
  getNigeriaInventory,
  type NigeriaInventoryItem,
} from "../../services/nigeriaApi";

type InventoryStatus = "all" | "in_stock" | "low_stock" | "out_of_stock";

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function getInventoryValue(
  item: NigeriaInventoryItem,
  keys: string[],
): unknown {
  const record = item as unknown as Record<string, unknown>;

  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }

  return undefined;
}

function getProductName(item: NigeriaInventoryItem): string {
  return (
    toText(
      getInventoryValue(item, [
        "product_name",
        "name",
        "productName",
      ]),
    ) || "Unknown product"
  );
}

function getProductId(item: NigeriaInventoryItem): string {
  return toText(
    getInventoryValue(item, ["product_id", "productId", "id"]),
  );
}

function getQuantity(item: NigeriaInventoryItem): number {
  return toNumber(
    getInventoryValue(item, ["quantity", "inventory", "stock"]),
  );
}

function getReservedQuantity(item: NigeriaInventoryItem): number {
  return toNumber(
    getInventoryValue(item, [
      "reserved_quantity",
      "reservedQuantity",
      "reserved",
    ]),
  );
}

function getLowStockThreshold(item: NigeriaInventoryItem): number {
  return toNumber(
    getInventoryValue(item, [
      "low_stock_threshold",
      "lowStockThreshold",
      "threshold",
    ]),
  );
}

function getUpdatedAt(item: NigeriaInventoryItem): string {
  return toText(
    getInventoryValue(item, [
      "updated_at",
      "updatedAt",
    ]),
  );
}

function getAvailableQuantity(item: NigeriaInventoryItem): number {
  return Math.max(getQuantity(item) - getReservedQuantity(item), 0);
}

function getInventoryStatus(
  item: NigeriaInventoryItem,
): "in_stock" | "low_stock" | "out_of_stock" {
  const quantity = getAvailableQuantity(item);
  const threshold = getLowStockThreshold(item);

  if (quantity <= 0) {
    return "out_of_stock";
  }

  if (threshold > 0 && quantity <= threshold) {
    return "low_stock";
  }

  return "in_stock";
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "in_stock":
      return "In stock";
    case "low_stock":
      return "Low stock";
    case "out_of_stock":
      return "Out of stock";
    default:
      return "Unknown";
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case "in_stock":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "low_stock":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "out_of_stock":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

function StatusIcon({ status }: { status: string }) {
  if (status === "in_stock") {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  if (status === "low_stock") {
    return <AlertTriangle className="h-4 w-4" />;
  }

  if (status === "out_of_stock") {
    return <XCircle className="h-4 w-4" />;
  }

  return <Package className="h-4 w-4" />;
}

function formatDate(value: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function NigeriaInventory() {
  const [inventory, setInventory] = useState<NigeriaInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<InventoryStatus>("all");

  async function loadInventory(showRefreshState = false) {
    try {
      setError("");

      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getNigeriaInventory();

      setInventory(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load Nigeria inventory.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadInventory();
  }, []);

  const filteredInventory = useMemo(() => {
    const query = search.trim().toLowerCase();

    return inventory.filter((item) => {
      const productName = getProductName(item);
      const productId = getProductId(item);
      const status = getInventoryStatus(item);

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        productName.toLowerCase().includes(query) ||
        productId.toLowerCase().includes(query)
      );
    });
  }, [inventory, search, statusFilter]);

  const stats = useMemo(() => {
    let totalUnits = 0;
    let reservedUnits = 0;
    let lowStock = 0;
    let outOfStock = 0;

    for (const item of inventory) {
      totalUnits += getQuantity(item);
      reservedUnits += getReservedQuantity(item);

      const status = getInventoryStatus(item);

      if (status === "low_stock") {
        lowStock += 1;
      }

      if (status === "out_of_stock") {
        outOfStock += 1;
      }
    }

    return {
      totalProducts: inventory.length,
      totalUnits,
      reservedUnits,
      lowStock,
      outOfStock,
    };
  }, [inventory]);

  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Nigeria Inventory
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Monitor inventory for the Nigeria Ecommerce store.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadInventory(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Products tracked"
            value={stats.totalProducts}
            icon={<Package className="h-5 w-5" />}
          />

          <StatCard
            title="Total units"
            value={stats.totalUnits}
            icon={<Package className="h-5 w-5" />}
          />

          <StatCard
            title="Reserved units"
            value={stats.reservedUnits}
            icon={<AlertTriangle className="h-5 w-5" />}
          />

          <StatCard
            title="Low / out of stock"
            value={stats.lowStock + stats.outOfStock}
            icon={<XCircle className="h-5 w-5" />}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as InventoryStatus,
                  )
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-400 lg:w-52"
              >
                <option value="all">All inventory</option>
                <option value="in_stock">In stock</option>
                <option value="low_stock">Low stock</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading Nigeria inventory...
              </div>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Package className="h-5 w-5 text-gray-500" />
              </div>

              <h2 className="mt-4 text-sm font-semibold text-gray-900">
                {inventory.length === 0
                  ? "No Nigeria inventory yet"
                  : "No matching inventory"}
              </h2>

              <p className="mt-1 max-w-md text-sm text-gray-500">
                {inventory.length === 0
                  ? "Nigeria product inventory will appear here once products are added."
                  : "Try changing your search or inventory filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Product
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Quantity
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Reserved
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Available
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Threshold
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Updated
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredInventory.map((item) => {
                    const quantity = getQuantity(item);
                    const reserved = getReservedQuantity(item);
                    const available = getAvailableQuantity(item);
                    const threshold = getLowStockThreshold(item);
                    const status = getInventoryStatus(item);

                    return (
                      <tr
                        key={`${getProductId(item)}-${getUpdatedAt(item)}`}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                              <Package className="h-5 w-5 text-gray-500" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {getProductName(item)}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                ID: {getProductId(item) || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-900">
                          {quantity}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {reserved}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-900">
                          {available}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {threshold}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                              status,
                            )}`}
                          >
                            <StatusIcon status={status} />
                            {getStatusLabel(status)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {formatDate(getUpdatedAt(item))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredInventory.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
              Showing {filteredInventory.length} of {inventory.length} Nigeria
              {inventory.length === 1 ? " inventory item" : " inventory items"}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
