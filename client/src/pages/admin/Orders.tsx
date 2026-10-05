import {
  CalendarDays,
  ChevronRight,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  DollarSign,
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
      dateStyle: "medium",
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

    return {
      total: orders.length,
      totalRevenue,
      pending,
      processing,
      shipped,
      delivered,
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Fulfillment
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Orders
            </h1>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Manage customer orders, payments, and
              fulfillment.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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

        {/* Stats */}
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
          />
        </div>

        {/* Orders */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">
                Order directory
              </h2>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {loading
                  ? "Loading orders..."
                  : `${filteredOrders.length} order${
                      filteredOrders.length === 1
                        ? ""
                        : "s"
                    } shown`}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative sm:w-[340px]">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search name, email, or order ID..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
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
          </div>

          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />

                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Loading orders...
                </p>
              </div>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
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

                    <th className="px-6 py-4" />
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() =>
                        setSelectedOrder(order)
                      }
                      className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-5">
                        <span className="font-semibold">
                          #
                          {order.id
                            .slice(0, 8)
                            .toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <p className="max-w-[220px] truncate text-sm font-medium">
                          {order.customer_name}
                        </p>

                        <p className="mt-1 max-w-[240px] truncate text-xs text-slate-500 dark:text-slate-400">
                          {order.customer_email}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(
                          order.created_at,
                        )}
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold">
                        {formatCurrency(
                          order.total,
                          order.currency,
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${paymentBadge(
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
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
                            order.order_status,
                          )}`}
                        >
                          {formatLabel(
                            order.order_status,
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <ChevronRight
                          size={18}
                          className="ml-auto text-slate-400"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <PackageCheck
                  size={28}
                  className="text-slate-400"
                />
              </div>

              <h3 className="mt-4 font-semibold">
                {orders.length === 0
                  ? "No customer orders yet"
                  : "No orders match your filters"}
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {orders.length === 0
                  ? "New orders will appear here automatically."
                  : "Try adjusting your search or status filter."}
              </p>

              {(search ||
                statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
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

function StatCard({
  icon: Icon,
  title,
  value,
  warning = false,
}: {
  icon: typeof DollarSign;
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