import { useMemo, useState } from "react";
import {
ArrowLeft,
Check,
CreditCard,
MapPin,
Package,
ShieldCheck,
} from "lucide-react";

import type { CartItem } from "../types/cart";
import type { MarketInfo } from "../types/market";

import { createCheckout } from "../services/api";
import { convertCurrency, formatCurrency } from "../utils/currency";
import {
getDeliveryTime,
getShippingFee,
} from "../utils/shipping";

interface CheckoutProps {
cart: CartItem[];
market: MarketInfo | null;
onBack: () => void;
onComplete: (
orderId: string,
customer: {
name: string;
email: string;
phone: string;
address: string;
city: string;
state: string;
postalCode: string;
},
total: number,
) => void;
}

export default function Checkout({
cart,
market,
onBack,
onComplete,
}: CheckoutProps) {
const country = market?.countryCode || "NG";
const currency = market?.currency || "NGN";

const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [phone, setPhone] = useState("");
const [address, setAddress] = useState("");
const [city, setCity] = useState("");
const [state, setState] = useState("");
const [postalCode, setPostalCode] = useState("");
const [acceptedPolicies, setAcceptedPolicies] =
useState(false);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState("");

const subtotal = useMemo(() => {
return cart.reduce((total, item) => {
const productCurrency =
item.product.currency || "USD";

  const convertedPrice = convertCurrency(
    item.product.price,
    productCurrency,
    currency,
  );

  return total + convertedPrice * item.quantity;
}, 0);

}, [cart, currency]);

const shippingFee = useMemo(
() => getShippingFee(country, currency),
[country, currency],
);

const total = subtotal + shippingFee;

const deliveryTime = getDeliveryTime(country);

async function handleSubmit(
event: React.FormEvent<HTMLFormElement>,
) {
event.preventDefault();

if (!acceptedPolicies) {
  setError(
    "Please agree to the Terms of Service, Refund Policy and Privacy Policy.",
  );
  return;
}

if (cart.length === 0) {
  setError("Your cart is empty.");
  return;
}

setSubmitting(true);
setError("");

try {
  const response = await createCheckout({
    customer_name: name.trim(),
    customer_email: email.trim(),
    customer_phone: phone.trim(),
    shipping_address: address.trim(),
    city: city.trim(),
    state: state.trim(),
    postal_code: postalCode.trim(),
    country,
    currency,
    subtotal,
    shipping_fee: shippingFee,
    items: cart.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
    })),
  });

  onComplete(
    response.orderId,
    {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
    },
    total,
  );
} catch (submitError) {
  console.error(submitError);

  setError(
    "We could not create your order. Please try again.",
  );
} finally {
  setSubmitting(false);
}

}

if (cart.length === 0) {
return (
<div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
<button type="button" onClick={onBack} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950" >
<ArrowLeft size={17} />
Back to cart
</button>

    <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <Package
        size={42}
        className="mx-auto mb-4 text-slate-400"
      />

      <h1 className="text-2xl font-semibold text-slate-950">
        Your cart is empty
      </h1>

      <p className="mt-2 text-sm text-slate-500">
        Add a product before continuing to checkout.
      </p>
    </div>
  </div>
);

}

return (
<div className="min-h-screen bg-slate-50">
<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
<button type="button" onClick={onBack} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950" >
<ArrowLeft size={17} />
Back to cart
</button>

    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            Secure checkout
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Checkout
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <MapPin size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-950">
                  Contact & delivery
                </h2>

                <p className="text-sm text-slate-500">
                  Enter the details needed to deliver your order.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Full name
                </label>

                <input
                  required
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  WhatsApp / phone
                </label>

                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                  placeholder="+234..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Address
                </label>

                <textarea
                  required
                  value={address}
                  onChange={(event) =>
                    setAddress(event.target.value)
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  City
                </label>

                <input
                  required
                  value={city}
                  onChange={(event) =>
                    setCity(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  State / region
                </label>

                <input
                  required
                  value={state}
                  onChange={(event) =>
                    setState(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                  placeholder="State / region"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Postal code
                </label>

                <input
                  required
                  value={postalCode}
                  onChange={(event) =>
                    setPostalCode(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                  placeholder="Postal code"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <CreditCard size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-950">
                  Payment
                </h2>

                <p className="text-sm text-slate-500">
                  Payment will be processed securely.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-slate-700"
                />

                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Secure payment
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your payment details are handled by the
                    payment provider. We do not store your
                    card information.
                  </p>
                </div>
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={acceptedPolicies}
                onChange={(event) =>
                  setAcceptedPolicies(
                    event.target.checked,
                  )
                }
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />

              <span className="text-sm leading-6 text-slate-600">
                I agree to the Terms of Service, Refund Policy
                and Privacy Policy.
              </span>
            </label>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              "Creating order..."
            ) : (
              <>
                <Check size={18} />
                Continue to payment
              </>
            )}
          </button>
        </form>
      </div>

      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
        <h2 className="text-lg font-semibold text-slate-950">
          Order summary
        </h2>

        <div className="mt-6 space-y-4">
          {cart.map((item) => {
            const productCurrency =
              item.product.currency || "USD";

            const convertedPrice = convertCurrency(
              item.product.price,
              productCurrency,
              currency,
            );

            return (
              <div
                key={item.product.id}
                className="flex gap-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-slate-900">
                    {item.product.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Qty: {item.quantity}
                  </p>
                </div>

                <p className="text-sm font-semibold text-slate-900">
                  {formatCurrency(
                    convertedPrice * item.quantity,
                    currency,
                  )}
                </p>
              </div>
            );
          })}
        </div>

        <div className="my-6 border-t border-slate-200" />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">
              Subtotal
            </span>

            <span className="font-medium text-slate-900">
              {formatCurrency(subtotal, currency)}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-slate-500">
              Shipping
            </span>

            <span className="font-medium text-slate-900">
              {formatCurrency(
                shippingFee,
                currency,
              )}
            </span>
          </div>

          <div className="flex justify-between gap-4 pt-2 text-base">
            <span className="font-semibold text-slate-950">
              Total
            </span>

            <span className="font-bold text-slate-950">
              {formatCurrency(total, currency)}
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">
            Estimated delivery
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {deliveryTime}
          </p>
        </div>
      </aside>
    </div>
  </div>
</div>

);
}