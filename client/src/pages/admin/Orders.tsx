import { PackageCheck, Search } from "lucide-react";
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
    payment_pending: "bg-amber-100 text-amber-700",
    payment_confirmed: "bg-blue-100 text-blue-700",
    settlement_pending: "bg-amber-100 text-amber-700",
    ready_to_fulfill: "bg-purple-100 text-purple-700",
    supplier_ordered: "bg-indigo-100 text-indigo-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-600";
}

function paymentBadge(status: string) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-slate-100 text-slate-600",
  };
  return map[status] ?? "bg-slate-100 text-slate-600";
}

function formatLabel(str: string) {
  return str
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function Orders() {
  const { addToast } = useToast();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAdminOrders();
      setOrders(result);
    } catch (err) {
      addToast("Unable to load orders.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_email.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || order.order_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">Fulfillment</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Orders</h1>
          <p className="mt-2 text-slate-500">
            Manage customer orders and fulfillment.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or order ID..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-500">Loading orders...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-5 font-semibold text-slate-900">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>

                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-slate-900">{order.customer_name}</p>
                      <p className="text-xs text-slate-500">{order.customer_email}</p>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-500">
                      {formatDate(order.created_at)}
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold">
                      {formatCurrency(order.total, order.currency)}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentBadge(order.payment_status)}`}
                      >
                        {formatLabel(order.payment_status)}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(order.order_status)}`}
                      >
                        {formatLabel(order.order_status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <PackageCheck size={42} className="mx-auto text-slate-300" />
            <h3 className="mt-4 font-semibold text-slate-800">
              {orders.length === 0 ? "No customer orders yet" : "No orders match your filter"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {orders.length === 0
                ? "New orders will appear here automatically."
                : "Try adjusting your search or filter."}
            </p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSuccess={loadOrders}
        />
      )}
    </div>
  );
}
