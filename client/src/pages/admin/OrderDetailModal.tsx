import {
CheckCircle2,
Clock,
CreditCard,
ExternalLink,
Loader2,
MapPin,
Package,
Save,
Truck,
UserRound,
X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { AdminOrder } from "../../types/admin";
import { updateOrderStatus } from "../../services/adminApi";
import { formatCurrency } from "../../utils/currency";
import { useToast } from "../../components/admin/Toast";

interface OrderDetailModalProps {
order: AdminOrder;
onClose: () => void;
onSuccess: () => void | Promise<void>;
}

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

function formatLabel(value: string) {
return value
.split("_")
.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
.join(" ");
}

function formatDate(value: string) {
if (!value) return "Not available";

const date = new Date(value);

if (Number.isNaN(date.getTime())) return value;

return new Intl.DateTimeFormat("en", {
dateStyle: "medium",
timeStyle: "short",
}).format(date);
}

function DetailSection({
title,
icon: Icon,
children,
}: {
title: string;
icon: typeof Package;
children: React.ReactNode;
}) {
return (
<section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
<div className="mb-4 flex items-center gap-2">
<Icon size={17} className="text-slate-500" />
<h3 className="font-semibold">{title}</h3>
</div>
{children}
</section>
);
}

function DetailRow({
label,
value,
}: {
label: string;
value: string;
}) {
return (
<div className="flex flex-wrap justify-between gap-2 py-2">
<span className="text-sm text-slate-500 dark:text-slate-400">
{label}
</span>
<span className="max-w-[65%] break-words text-right text-sm font-medium">
{value || "Not provided"}
</span>
</div>
);
}

export default function OrderDetailModal({
order,
onClose,
onSuccess,
}: OrderDetailModalProps) {
const { addToast } = useToast();

const [orderStatus, setOrderStatus] = useState(order.order_status);
const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
const [trackingNumber, setTrackingNumber] = useState(
order.tracking_number || "",
);
const [saving, setSaving] = useState(false);

useEffect(() => {
setOrderStatus(order.order_status);
setPaymentStatus(order.payment_status);
setTrackingNumber(order.tracking_number || "");
}, [
order.id,
order.order_status,
order.payment_status,
order.tracking_number,
]);

useEffect(() => {
const handleKeyDown = (event: KeyboardEvent) => {
if (event.key === "Escape" && !saving) {
onClose();
}
};

window.addEventListener("keydown", handleKeyDown);

return () => {
  window.removeEventListener("keydown", handleKeyDown);
};

}, [onClose, saving]);

const items = Array.isArray(order.items) ? order.items : [];

const subtotal = Number(order.subtotal || 0);
const shippingFee = Number(order.shipping_fee || 0);
const total = Number(order.total || 0);

const hasChanges =
orderStatus !== order.order_status ||
paymentStatus !== order.payment_status ||
trackingNumber.trim() !== (order.tracking_number || "");

async function handleSave() {
if (saving || !hasChanges) return;

if (orderStatus === "shipped" && !trackingNumber.trim()) {
  addToast(
    "Enter a tracking number before marking the order as shipped.",
    "error",
  );
  return;
}

if (
  orderStatus === "delivered" &&
  order.payment_status !== "confirmed" &&
  paymentStatus !== "confirmed"
) {
  addToast(
    "Confirm payment before marking this order as delivered.",
    "error",
  );
  return;
}

if (
  paymentStatus === "refunded" &&
  order.payment_status !== "refunded"
) {
  addToast(
    "Changing this status does not issue a real refund. Process the refund through the payment provider first.",
    "error",
  );
  return;
}

if (
  paymentStatus === "confirmed" &&
  order.payment_status !== "confirmed"
) {
  addToast(
    "Only confirm payment after verifying successful payment with the payment provider.",
    "error",
  );
  return;
}

try {
  setSaving(true);

  await updateOrderStatus(order.id, {
    order_status: orderStatus,
    payment_status: paymentStatus,
    tracking_number: trackingNumber.trim(),
  });

  addToast("Order updated successfully.", "success");

  await onSuccess();
  onClose();
} catch (error) {
  console.error("Failed to update order:", error);

  addToast(
    error instanceof Error
      ? error.message
      : "Unable to update this order.",
    "error",
  );
} finally {
  setSaving(false);
}

}

return (
<div
className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm sm"
onMouseDown={(event) => {
if (event.target === event.currentTarget && !saving) {
onClose();
}
}}
>
<div role="dialog" aria-modal="true" aria-labelledby="order-detail-title" className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-slate-950 sm:rounded-2xl" >
<header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
<div>
<p className="text-xs font-medium uppercase tracking-wider text-slate-500">
Order details
</p>

        <h2
          id="order-detail-title"
          className="mt-1 text-xl font-bold sm:text-2xl"
        >
          #{order.id.slice(0, 8).toUpperCase()}
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Placed {formatDate(order.created_at)}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        aria-label="Close order details"
        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
      >
        <X size={20} />
      </button>
    </header>

    <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CreditCard size={16} />
            Order total
          </div>

          <p className="mt-2 text-2xl font-bold">
            {formatCurrency(total, order.currency)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {order.currency}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock size={16} />
            Order status
          </div>

          <p className="mt-2 font-semibold">
            {formatLabel(order.order_status)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Updated {formatDate(order.updated_at)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2 size={16} />
            Payment
          </div>

          <p className="mt-2 font-semibold">
            {formatLabel(order.payment_status)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Payment status from the order record
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DetailSection title="Customer" icon={UserRound}>
          <DetailRow label="Name" value={order.customer_name} />
          <DetailRow label="Email" value={order.customer_email} />
          <DetailRow
            label="Phone"
            value={order.customer_phone || "Not provided"}
          />
        </DetailSection>

        <DetailSection title="Shipping address" icon={MapPin}>
          <DetailRow
            label="Address"
            value={order.shipping_address}
          />
          <DetailRow label="City" value={order.city} />
          <DetailRow label="State / Region" value={order.state} />
          <DetailRow label="Postal code" value={order.postal_code} />
          <DetailRow label="Country" value={order.country} />
        </DetailSection>
      </div>

      <DetailSection title="Items ordered" icon={Package}>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">
            No order items were returned by the API.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                  <th className="py-3 pr-4">Product</th>
                  <th className="px-3 py-3 text-right">Qty</th>
                  <th className="px-3 py-3 text-right">Unit price</th>
                  <th className="px-3 py-3 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="py-4 pr-4">
                      <p className="font-medium">
                        {item.product_name || "Product"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Product ID: {item.product_id}
                      </p>
                    </td>

                    <td className="px-3 py-4 text-right">
                      {Number(item.quantity || 0)}
                    </td>

                    <td className="px-3 py-4 text-right">
                      {formatCurrency(
                        Number(item.selling_price || 0),
                        order.currency,
                      )}
                    </td>

                    <td className="px-3 py-4 text-right font-semibold">
                      {formatCurrency(
                        Number(
                          item.total ||
                            Number(item.selling_price || 0) *
                              Number(item.quantity || 0),
                        ),
                        order.currency,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="ml-auto mt-4 max-w-sm space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <DetailRow
            label="Subtotal"
            value={formatCurrency(subtotal, order.currency)}
          />
          <DetailRow
            label="Shipping"
            value={formatCurrency(shippingFee, order.currency)}
          />
          <div className="border-t border-slate-200 pt-2 dark:border-slate-800">
            <DetailRow
              label="Order total"
              value={formatCurrency(total, order.currency)}
            />
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Fulfillment and tracking" icon={Truck}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="order-status"
              className="mb-1.5 block text-sm font-medium"
            >
              Order status
            </label>

            <select
              id="order-status"
              value={orderStatus}
              onChange={(event) => setOrderStatus(event.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="payment-status"
              className="mb-1.5 block text-sm font-medium"
            >
              Payment status
            </label>

            <select
              id="payment-status"
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
            >
              {PAYMENT_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <p className="mt-1.5 text-xs text-slate-500">
              Confirm payment only after verifying it with your payment provider.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="tracking-number"
              className="mb-1.5 block text-sm font-medium"
            >
              Tracking number
            </label>

            <div className="relative">
              <ExternalLink
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="tracking-number"
                value={trackingNumber}
                onChange={(event) =>
                  setTrackingNumber(event.target.value)
                }
                disabled={saving}
                placeholder="Enter the carrier's tracking number"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>
        </div>
      </DetailSection>

      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <p className="font-semibold">Payment and refund safeguards</p>
        <p className="mt-1">
          Saving a status is not proof of payment and does not transfer or refund money. Verify transactions with the payment provider. The refund eligibility rule is not automatically enforced by this component; it must be implemented and validated by the backend using the estimated delivery deadline.
        </p>
      </div>
    </div>

    <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs text-slate-500">
        {hasChanges ? "You have unsaved changes." : "All changes are saved."}
      </p>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Close
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}

          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </footer>
  </div>
</div>

);
}