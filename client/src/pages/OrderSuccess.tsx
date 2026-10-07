import {
CheckCircle2,
Package,
Truck,
} from "lucide-react";

import { formatCurrency } from "../utils/currency";

interface OrderState {
product?: {
name: string;
image_url?: string | null;
price: number;
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
orderState?: OrderState;
onContinueShopping: () => void;
onBackHome: () => void;
}

export default function OrderSuccess({
orderId,
orderState,
onContinueShopping,
onBackHome,
}: OrderSuccessProps) {
const currency = orderState?.currency || "NGN";

const total = orderState?.total || 0;

return (
<div className="min-h-screen bg-slate-50 text-slate-950">
<main className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
<div className="mx-auto max-w-3xl">
{/* Success */}
<section className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10 md:p-12">
<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
<CheckCircle2 size={46} className="text-emerald-600" />
</div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
          Order received
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Thank you for your order!
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
          Your order has been successfully created.
          Payment confirmation will determine when
          your order moves into fulfillment.
        </p>

        {orderId && (
          <div className="mt-6 inline-flex rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700">
            Order #{orderId}
          </div>
        )}

        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
          <p className="text-sm font-semibold text-amber-900">
            Payment pending
          </p>

          <p className="mt-1 text-xs leading-6 text-amber-800">
            Your order has been recorded, but it will
            not enter fulfillment until payment is
            successfully confirmed.
          </p>
        </div>
      </section>

      {/* Order details */}
      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-950">
          Order details
        </h2>

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
                  <Package
                    size={25}
                    className="text-slate-400"
                  />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-950">
                {orderState.product.name}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Quantity: 1
              </p>

              <p className="mt-2 font-semibold text-slate-950">
                {formatCurrency(
                  orderState.product.price,
                  currency,
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
            Your order details have been
            recorded successfully.
          </div>
        )}

        <div className="my-6 h-px bg-slate-200" />

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">
              Shipping
            </span>

            <span className="font-semibold text-slate-950">
              {formatCurrency(
                orderState?.shippingFee || 0,
                currency,
              )}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <span className="font-bold text-slate-950">
              Total
            </span>

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
            <Truck
              size={21}
              className="text-slate-700"
            />
          </div>

          <div>
            <h2 className="font-bold text-slate-950">
              Estimated delivery
            </h2>

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

            <Info
              label="City"
              value={orderState.customer.city || "—"}
            />

            <Info
              label="State"
              value={orderState.customer.state || "—"}
            />

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
              <Info
                label="Country"
                value={orderState.country}
              />
            )}
          </div>
        </section>
      )}

      {/* Actions */}
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

function Info({
label,
value,
}: {
label: string;
value: string;
}) {
return (
<div className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-6">
<span className="shrink-0 text-slate-500">
{label}
</span>

  <span className="font-medium text-slate-950 sm:text-right">
    {value}
  </span>
</div>

);
}