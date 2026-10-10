import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Filter,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  DollarSign,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminOrder } from "../../types/admin";
import { getAdminOrders } from "../../services/adminApi";
import { formatCurrency } from "../../utils/currency";
import OrderDetailModal from "../../components/admin/OrderDetailModal";
import { useToast } from "../../components/admin/Toast";

type StatusFilter = "all" | string;

const STATUS_OPTIONS = [
  { value: "all", label: "All orders" },
  { value: "payment_pending", label: "Payment Pending" },
  { value: "payment_confirmed", label: "Payment Confirmed" },
  { value: "settlement_pending", label: "Settlement Pending" },
  { value: "ready_to_fulfill", label: "Ready to Fulfill" },
  { value: "supplier_ordered", label: "Supplier Ordered" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    payment_pending:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    payment_confirmed:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    settlement_pending:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    ready_to_fulfill:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    supplier_ordered:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    shipped:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    delivered:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    cancelled:
      "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    map[status] ??
    "bg-slate-500/10 text-slate-600 dark:text-slate-400"
  );
}

function paymentBadge(status: string) {
  const map: Record<string, string> = {
    confirmed:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    pending:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    failed:
      "bg-red-500/10 text-red-600 dark:text-red-400",
    refunded:
      "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  };

  return (
    map[status] ??
    "bg-slate-500/10 text-slate-600 dark:text-slate-400"
  );
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function formatShortDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function Orders() {
  const { addToast } = useToast();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");
  const [selectedOrder, setSelectedOrder] =
    useState<AdminOrder | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getAdminOrders();

      setOrders(result);
    } catch (err) {
      console.error(err);

      addToast(
        "Unable to load orders.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce(
      (sum, order) =>
        sum + Number(order.total || 0),
      0,
    );

    const pending = orders.filter(
      (order) =>
        order.order_status === "payment_pending" ||
        order.payment_status === "pending",
    ).length;

    const processing = orders.filter((order) =>
      [
        "payment_confirmed",
        "settlement_pending",
        "ready_to_fulfill",
        "supplier_ordered",
      ].includes(order.order_status),
    ).length;

    const shipped = orders.filter(
      (order) =>
        order.order_status === "shipped",
    ).length;

    const delivered = orders.filter(
      (order) =>
        order.order_status === "delivered",
    ).length;

    const cancelled = orders.filter(
      (order) =>
        order.order_status === "cancelled",
    ).length;

    return {
      total: orders.length,
      totalRevenue,
      pending,
      processing,
      shipped,
      delivered,
      cancelled,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.customer_name
          .toLowerCase()
          .includes(query) ||
        order.customer_email
          .toLowerCase()
          .includes(query) ||
        order.id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        order.order_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const hasFilters =
    Boolean(search.trim()) ||
    statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Fulfillment
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Orders
              </h1>

              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {orders.length.toLocaleString()}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Manage orders, payments, fulfillment, and
              customer delivery status.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw
              size={16}
              className={
                loading ? "animate-spin" : ""
              }
            />

            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={ShoppingBag}
            title="Total orders"
            value={stats.total.toLocaleString()}
          />

          <StatCard
            icon={DollarSign}
            title="Order revenue"
            value={formatCurrency(
              stats.totalRevenue,
              "USD",
            )}
          />

          <StatCard
            icon={CalendarDays}
            title="Pending"
            value={stats.pending.toLocaleString()}
            warning
          />

          <StatCard
            icon={PackageCheck}
            title="Processing"
            value={stats.processing.toLocaleString()}
          />

          <StatCard
            icon={PackageCheck}
            title="Delivered"
            value={stats.delivered.toLocaleString()}
            success
          />
        </div>

        {/* Status overview */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStatus
            label="Pending payment"
            value={stats.pending}
            className="text-amber-600 dark:text-amber-400"
          />

          <MiniStatus
            label="Processing"
            value={stats.processing}
            className="text-purple-600 dark:text-purple-400"
          />

          <MiniStatus
            label="Shipped"
            value={stats.shipped}
            className="text-indigo-600 dark:text-indigo-400"
          />

          <MiniStatus
            label="Cancelled"
            value={stats.cancelled}
            className="text-red-600 dark:text-red-400"
          />
        </div>

        {/* Order directory */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Toolbar */}
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold">
                  Order directory
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {loading
                    ? "Loading orders..."
                    : `${filteredOrders.length.toLocaleString()} of ${orders.length.toLocaleString()} orders shown`}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:w-[360px]">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search orders, customers, email..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowFilters((value) => !value)
                  }
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    showFilters || statusFilter !== "all"
                      ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <Filter size={16} />
                  Filters

                  <ChevronDown
                    size={15}
                    className={
                      showFilters
                        ? "rotate-180 transition"
                        : "transition"
                    }
                  />
                </button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="flex flex-col gap-4 bg-slate-50 px-5 py-4 dark:bg-slate-950/60 md:flex-row md:items-center">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Order status
                  </label>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-900 md:max-w-[320px]"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 self-end rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    <X size={15} />
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <OrdersLoading />
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">
                      Order
                    </th>

                    <th className="px-6 py-4">
                      Customer
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>

                    <th className="px-6 py-4">
                      Total
                    </th>

                    <th className="px-6 py-4">
                      Payment
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right">
                      View
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() =>
                        setSelectedOrder(order)
                      }
                      className="group cursor-pointer border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            #
                          </div>

                          <div>
                            <p className="font-semibold">
                              #
                              {order.id
                                .slice(0, 8)
                                .toUpperCase()}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              Order ID
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <p className="max-w-[230px] truncate text-sm font-medium">
                          {order.customer_name}
                        </p>

                        <p className="mt-1 max-w-[250px] truncate text-xs text-slate-500 dark:text-slate-400">
                          {order.customer_email}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-medium">
                          {formatShortDate(
                            order.created_at,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(
                            order.created_at,
                          )}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-bold">
                          {formatCurrency(
                            order.total,
                            order.currency,
                          )}
                        </p>

                        <p className="mt-1 text-xs uppercase text-slate-400">
                          {order.currency}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${paymentBadge(
                            order.payment_status,
                          )}`}
                        >
                          {formatLabel(
                            order.payment_status,
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusBadge(
                            order.order_status,
                          )}`}
                        >
                          {formatLabel(
                            order.order_status,
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition group-hover:bg-slate-200 group-hover:text-slate-700 dark:group-hover:bg-slate-700 dark:group-hover:text-white">
                          <ChevronRight size={18} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <PackageCheck
                  size={30}
                  className="text-slate-400"
                />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                {orders.length === 0
                  ? "No customer orders yet"
                  : "No orders match your filters"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {orders.length === 0
                  ? "New orders will automatically appear here when customers place them."
                  : "Try changing your search or status filter."}
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() =>
            setSelectedOrder(null)
          }
          onSuccess={loadOrders}
        />
      )}
    </div>
  );
}

function OrdersLoading() {
  return (
    <div className="min-h-[420px] p-6">
      <div className="space-y-3">
        {Array.from({ length: 7 }).map(
          (_, index) => (
            <div
              key={index}
              className="grid grid-cols-7 gap-5 rounded-xl border border-slate-100 p-5 dark:border-slate-800"
            >
              {Array.from({ length: 7 }).map(
                (_, cell) => (
                  <div
                    key={cell}
                    className="h-5 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
                  />
                ),
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function MiniStatus({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {label}
        </span>

        <span
          className={`text-lg font-bold ${className}`}
        >
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  warning = false,
  success = false,
}: {
  icon: typeof DollarSign;
  title: string;
  value: string;
  warning?: boolean;
  success?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          warning
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : success
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        }`}
      >
        <Icon size={20} />
      </div>

      <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight">
        {value}
      </p>
    </div>
  );
}