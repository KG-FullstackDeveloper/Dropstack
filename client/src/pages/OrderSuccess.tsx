import { useState } from "react";
import {
  CheckCircle2,
  Package,
  Truck,
  ShieldCheck,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import { confirmOrder } from "../services/api";
import { convertCurrency, formatCurrency } from "../utils/currency";

interface OrderState {
  product?: {
    name: string;
    image_url?: string | null;
    price: number;
    currency?: string;
  };
  country?: string;
  currency?: string;
  shippingFee?: number;
  deliveryTime?: string;
  total?: number;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    shipping_address?: string;
    postal_code?: string;
  };
}

interface OrderSuccessProps {
  orderId: string | null;
  confirmationToken?: string | null;
  orderState?: OrderState;
  onContinueShopping: () => void;
  onBackHome: () => void;
}

export default function OrderSuccess({
  orderId,
  confirmationToken,
  orderState,
  onContinueShopping,
  onBackHome,
}: OrderSuccessProps) {
  const currency = orderState?.currency || "NGN";
  const total = orderState?.total ?? 0;

  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const displayOrderId = orderId
    ? orderId.toUpperCase().startsWith("ORDER-")
      ? orderId.toUpperCase()
      : `ORDER-${orderId.toUpperCase()}`
    : null;

  async function handleConfirmPayment() {
    // Once the order is submitted, allow another request only if its email still needs retrying.
    if (
      !orderId ||
      !confirmationToken ||
      confirming ||
      (confirmed && emailSent)
    ) {
      return;
    }

    setConfirming(true);
    setError("");

    try {
      const result = await confirmOrder(orderId, confirmationToken);

      setConfirmed(result.orderStatus === "payment_review_pending");
      setEmailSent(Boolean(result.emailSent));

      if (
        result.orderStatus === "payment_review_pending" &&
        !result.emailSent
      ) {
        setError(
          result.emailMessage ||
            "Your order is submitted, but the confirmation email has not been sent yet. You can retry below.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not submit your order for review. Please try again.",
      );
    } finally {
      setConfirming(false);
    }
  }

  const confirmationComplete = confirmed && emailSent;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <main className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Order header */}
          <section className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10 md:p-12">
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                confirmed ? "bg-emerald-50" : "bg-slate-100"
              }`}
            >
              {confirmed ? (
                <ShieldCheck size={46} className="text-emerald-600" />
              ) : (
                <CheckCircle2 size={46} className="text-slate-600" />
              )}
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              {confirmed ? "Order submitted" : "Order received"}
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {confirmed
                ? "Your order is under review"
                : "Thank you for your order!"}
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
              {confirmed
                ? "Your order has been submitted for payment review. Payment is not yet verified, and your order will not enter fulfillment until payment is confirmed."
                : "Your order has been created successfully. Confirm below when you are ready to submit it for payment review."}
            </p>

            {displayOrderId && (
              <div className="mt-6 inline-flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Your order number
                </span>
                <span className="mt-1 break-all text-lg font-bold text-slate-950">
                  {displayOrderId}
                </span>
              </div>
            )}

            {/* Current order status */}
            <div
              className={`mx-auto mt-6 max-w-md rounded-2xl border p-4 text-left ${
                confirmed
                  ? "border-blue-200 bg-blue-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  confirmed ? "text-blue-900" : "text-amber-900"
                }`}
              >
                {confirmed ? "Payment Review Pending" : "Payment Pending"}
              </p>

              <p
                className={`mt-1 text-xs leading-6 ${
                  confirmed ? "text-blue-800" : "text-amber-800"
                }`}
              >
                {confirmed
                  ? "Your order is awaiting payment verification by the store. This confirmation does not mean payment has been received."
                  : "Submit your order for payment review using the button below. Payment must be verified separately."}
              </p>
            </div>

            {/* Confirm order or retry the confirmation email */}
            {orderId && (
              <div className="mx-auto mt-6 max-w-md">
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={
                    confirming || confirmationComplete || !confirmationToken
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {confirming ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      {confirmed
                        ? "Retrying confirmation email..."
                        : "Submitting order..."}
                    </>
                  ) : confirmationComplete ? (
                    <>
                      <CheckCircle2 size={18} />
                      Order Submitted for Review
                    </>
                  ) : confirmed && !emailSent ? (
                    "Retry Confirmation Email"
                  ) : (
                    "Submit order for payment review"
                  )}
                </button>

                {!confirmationToken && !confirmed && (
                  <p className="mt-3 text-xs leading-5 text-amber-700">
                    The secure confirmation token is missing. Please return to
                    the checkout flow or contact the store for assistance.
                  </p>
                )}

                {error && (
                  <div
                    role="alert"
                    className="mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-800"
                  >
                    <AlertCircle size={20} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {confirmed && (
                  <div
                    role="status"
                    className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left"
                  >
                    <p className="text-sm font-semibold text-emerald-900">
                      Order submitted for review
                    </p>

                    <p className="mt-1 text-xs leading-6 text-emerald-800">
                      {emailSent
                        ? "Your confirmation email has been sent."
                        : "Your order is submitted, but the confirmation email has not been sent yet. Use the retry button above to try again."}
                    </p>

                    <p className="mt-2 text-xs leading-6 text-emerald-800">
                      Your payment remains pending until the store verifies it.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Order details */}
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">Order details</h2>

            {orderState?.product ? (
              <div className="mt-6 flex gap-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                  {orderState.product.image_url ? (
                    <img
                      src={orderState.product.image_url}
                      alt={orderState.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package size={25} className="text-slate-400" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-950">
                    {orderState.product.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">Quantity: 1</p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {formatCurrency(
                      convertCurrency(
                        orderState.product.price,
                        orderState.product.currency || "USD",
                        currency,
                      ),
                      currency,
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                Your order details have been recorded successfully.
              </div>
            )}

            <div className="my-6 h-px bg-slate-200" />

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Shipping</span>
                <span className="font-semibold text-slate-950">
                  {formatCurrency(orderState?.shippingFee ?? 0, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                <span className="font-bold text-slate-950">Total</span>
                <span className="text-lg font-bold text-slate-950">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </div>
          </section>

          {/* Delivery */}
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                <Truck size={21} className="text-slate-700" />
              </div>
              <div>
                <h2 className="font-bold text-slate-950">Estimated delivery</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {orderState?.deliveryTime ||
                    "Delivery time will be confirmed after checkout."}
                </p>
              </div>
            </div>
          </section>

          {/* Customer information */}
          {orderState?.customer && (
            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-950">
                Delivery information
              </h2>

              <div className="mt-5 space-y-3 text-sm">
                <Info
                  label="Name"
                  value={
                    orderState.customer.customer_name ||
                    orderState.customer.name ||
                    "—"
                  }
                />
                <Info
                  label="Email"
                  value={
                    orderState.customer.customer_email ||
                    orderState.customer.email ||
                    "—"
                  }
                />
                <Info
                  label="Phone"
                  value={
                    orderState.customer.customer_phone ||
                    orderState.customer.phone ||
                    "—"
                  }
                />
                <Info
                  label="Address"
                  value={
                    orderState.customer.shipping_address ||
                    orderState.customer.address ||
                    "—"
                  }
                />
                <Info label="City" value={orderState.customer.city || "—"} />
                <Info label="State" value={orderState.customer.state || "—"} />

                {(orderState.customer.postal_code ||
                  orderState.customer.postalCode) && (
                  <Info
                    label="Postal code"
                    value={
                      orderState.customer.postal_code ||
                      orderState.customer.postalCode ||
                      "—"
                    }
                  />
                )}

                {orderState.country && (
                  <Info label="Country" value={orderState.country} />
                )}
              </div>
            </section>
          )}

          {/* Navigation */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onContinueShopping}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Continue shopping
            </button>

            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Back to home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-6">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="font-medium text-slate-950 sm:text-right">{value}</span>
    </div>
  );
}
