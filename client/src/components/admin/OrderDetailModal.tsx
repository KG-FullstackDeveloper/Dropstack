import { useState } from "react";
import { X, Loader2, Package } from "lucide-react";
import type { AdminOrder } from "../../types/admin";
import { updateOrderStatus } from "../../services/adminApi";
import { formatCurrency } from "../../utils/currency";
import { useToast } from "./Toast";

const ORDER_STATUSES = [
  { value: "payment_pending", label: "Payment Pending" },
  { value: "payment_confirmed", label: "Payment Confirmed" },
  { value: "settlement_pending", label: "Settlement Pending" },
  { value: "ready_to_fulfill", label: "Ready to Fulfill" },
  { value: "supplier_ordered", label: "Supplier Ordered" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

interface Props {
  order: AdminOrder;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OrderDetailModal({ order, onClose, onSuccess }: Props) {
  const { addToast } = useToast();
  const [orderStatus, setOrderStatus] = useState(order.order_status);
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateOrderStatus(order.id, {
        order_status: orderStatus,
        payment_status: paymentStatus,
        tracking_number: trackingNumber.trim() || undefined,
      });
      addToast("Order status updated.", "success");
      onSuccess();
      onClose();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to update order.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  const totalProfit = (order.items ?? []).reduce((sum, item) => sum + item.profit, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Order #{order.id.slice(0, 8).toUpperCase()}</h2>
            <p className="text-xs text-slate-500">{formatDate(order.created_at)}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Customer info */}
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-700">Customer</h3>
              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{order.customer_name}</p>
                <p>{order.customer_email}</p>
                {order.customer_phone && <p>{order.customer_phone}</p>}
              </div>
            </div>

            {/* Shipping address */}
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-700">Shipping Address</h3>
              <div className="text-sm text-slate-600">
                <p>{order.shipping_address}</p>
                <p>
                  {[order.city, order.state, order.postal_code].filter(Boolean).join(", ")}
                </p>
                <p>{order.country}</p>
              </div>
            </div>

            {/* Order items */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-700">Order Items</h3>
              </div>
              {order.items && order.items.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Package size={14} className="shrink-0 text-slate-400" />
                            <span className="font-medium text-slate-900">{item.product_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(item.total, order.currency)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-semibold ${
                            item.profit >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(item.profit, order.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-4 text-sm text-slate-500">No items available.</p>
              )}
            </div>

            {/* Totals */}
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-700">Payment Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping fee</span>
                  <span>{formatCurrency(order.shipping_fee, order.currency)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(order.total, order.currency)}</span>
                </div>
                <div
                  className={`flex justify-between pt-1 font-semibold ${
                    totalProfit >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  <span>Profit</span>
                  <span>{formatCurrency(totalProfit, order.currency)}</span>
                </div>
              </div>
            </div>

            {/* Status update */}
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-4 text-sm font-bold text-slate-700">Update Status</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Order status
                  </label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Payment status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Tracking number
                  </label>
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save status"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
