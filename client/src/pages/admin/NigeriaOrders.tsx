import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  Eye,
  Loader2,
  Package,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  getNigeriaOrders,
  type NigeriaOrder,
} from "../../services/nigeriaApi";

type StatusFilter =
  | "all"
  | "payment_pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value: string): string {
  if (!value) return "—";

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

function formatDateTime(value: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status: string): string {
  switch (status) {
    case "paid":
    case "delivered":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "processing":
    case "shipped":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "payment_pending":
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "cancelled":
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
        status,
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
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
          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function OrderDetailsModal({
  order,
  onClose,
}: {
  order: NigeriaOrder;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <p className="text-lg font-semibold text-gray-900">
              Order #{order.id}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Created {formatDateTime(order.created_at)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close order details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Order status
              </p>
              <div className="mt-2">
                <OrderStatusBadge status={order.order_status} />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Payment
              </p>
              <div className="mt-2">
                <OrderStatusBadge status={order.payment_status} />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Settlement
              </p>
              <div className="mt-2">
                <OrderStatusBadge status={order.settlement_status} />
              </div>
            </div>
          </div>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Customer
            </h3>

            <div className="grid gap-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {order.customer_name || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="mt-1 break-all text-sm text-gray-900">
                  {order.customer_email || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="mt-1 text-sm text-gray-900">
                  {order.customer_phone || "—"}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Delivery
            </h3>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-900">
                {order.shipping_address || "—"}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {[order.city, order.state, order.postal_code]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {order.country || "Nigeria"}
              </p>

              {order.estimated_delivery && (
                <p className="mt-3 text-sm text-gray-600">
                  Estimated delivery:{" "}
                  <span className="font-medium text-gray-900">
                    {order.estimated_delivery}
                  </span>
                </p>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Payment & fulfillment
            </h3>

            <div className="grid gap-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">Payment provider</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {order.payment_provider || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Supplier</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {order.supplier_name || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Flutterwave transaction
                </p>
                <p className="mt-1 break-all text-sm text-gray-900">
                  {order.flutterwave_transaction_id || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Flutterwave reference
                </p>
                <p className="mt-1 break-all text-sm text-gray-900">
                  {order.flutterwave_reference || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Supplier order reference</p>
                <p className="mt-1 break-all text-sm text-gray-900">
                  {order.supplier_order_reference || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Tracking number</p>
                <p className="mt-1 break-all text-sm text-gray-900">
                  {order.tracking_number || "—"}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Order totals
            </h3>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(order.shipping_fee)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(order.discount)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between gap-4">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Profit
            </h3>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Supplier cost</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {formatCurrency(order.supplier_cost_total)}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Shipping cost</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {formatCurrency(order.shipping_cost_total)}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Other cost</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {formatCurrency(order.other_cost_total)}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-gray-900">
                  Estimated profit
                </span>

                <span
                  className={`font-semibold ${
                    Number(order.profit) < 0
                      ? "text-red-600"
                      : "text-emerald-600"
                  }`}
                >
                  {formatCurrency(order.profit)}
                </span>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Margin: {Number(order.profit_margin || 0).toFixed(2)}%
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function NigeriaOrders() {
  const [orders, setOrders] = useState<NigeriaOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedOrder, setSelectedOrder] = useState<NigeriaOrder | null>(
    null,
  );

  async function loadOrders(showRefreshState = false) {
    try {
      setError("");

      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getNigeriaOrders();

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load Nigeria orders.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" || order.order_status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        order.id,
        order.customer_name,
        order.customer_email,
        order.customer_phone,
        order.shipping_address,
        order.city,
        order.state,
        order.order_status,
        order.payment_status,
        order.supplier_name,
        order.flutterwave_reference,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;

    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    );

    const pendingPayment = orders.filter(
      (order) =>
        order.payment_status === "pending" ||
        order.order_status === "payment_pending",
    ).length;

    const completed = orders.filter(
      (order) => order.order_status === "delivered",
    ).length;

    return {
      totalOrders,
      totalRevenue,
      pendingPayment,
      completed,
    };
  }, [orders]);

  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Nigeria Orders
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage orders from the Nigeria Ecommerce store.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOrders(true)}
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
            title="Total orders"
            value={stats.totalOrders}
            icon={<Package className="h-5 w-5" />}
          />

          <StatCard
            title="Total revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={<span className="text-lg font-semibold">₦</span>}
          />

          <StatCard
            title="Payment pending"
            value={stats.pendingPayment}
            icon={<Calendar className="h-5 w-5" />}
          />

          <StatCard
            title="Delivered"
            value={stats.completed}
            icon={<Package className="h-5 w-5" />}
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
                  placeholder="Search orders, customers..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
                />
              </div>

              <div className="relative w-full lg:w-56">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-9 text-sm text-gray-700 outline-none transition focus:border-gray-400"
                >
                  <option value="all">All statuses</option>
                  <option value="payment_pending">Payment pending</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading Nigeria orders...
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Package className="h-5 w-5 text-gray-500" />
              </div>

              <h2 className="mt-4 text-sm font-semibold text-gray-900">
                {orders.length === 0
                  ? "No Nigeria orders yet"
                  : "No matching orders"}
              </h2>

              <p className="mt-1 max-w-md text-sm text-gray-500">
                {orders.length === 0
                  ? "Orders created through the Nigeria Ecommerce checkout will appear here."
                  : "Try changing your search or status filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Order
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Customer
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Total
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Payment
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-4">
                        <p className="text-sm font-semibold text-gray-900">
                          #{order.id}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {order.currency || "NGN"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {order.customer_name || "—"}
                        </p>

                        <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                          {order.customer_email || order.customer_phone || "—"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <OrderStatusBadge status={order.payment_status} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <OrderStatusBadge status={order.order_status} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredOrders.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
              Showing {filteredOrders.length} of {orders.length} Nigeria
              {orders.length === 1 ? " order" : " orders"}.
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}