import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  MapPin,
  Package,
  ShieldCheck,
  Factory,
  Truck,
  BadgePercent,
} from "lucide-react";

import type { CartItem } from "../types/cart";
import type { MarketInfo } from "../types/market";
import { createCheckout, getCheckoutShipping } from "../services/api";
import { getCartItemUnitPrice } from "../utils/cart";
import { convertCurrency, formatCurrency } from "../utils/currency";
import { getDeliveryTime } from "../utils/shipping";

interface CheckoutCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

interface CheckoutProps {
  cart: CartItem[];
  market: MarketInfo | null;
  storeId: string;
  onBack: () => void;
  onComplete: (
    orderId: string,
    customer: CheckoutCustomer,
    total: number,
    shippingFee: number,
    confirmationToken: string,
  ) => void;
}

// Customer-facing explanation of the Dropstack Global business model.
function FactoryDirectNotice() {
  return (
    <section
      aria-label="Dropstack Global factory-direct shopping information"
      className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
          <Factory size={21} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Dropstack Global
          </p>

          <h2 className="mt-1 text-lg font-semibold text-slate-950 sm:text-xl">
            Your Direct-from-Factory Clearance Hub
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-700 sm:text-base">
            We partner directly with overseas manufacturers to reduce middleman
            costs and bring you competitive, factory-direct prices. Because
            items ship from overseas, delivery can take around 2 weeks or longer
            depending on your destination and the item.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-white/80 p-3">
              <BadgePercent
                size={19}
                className="mt-0.5 shrink-0 text-emerald-700"
              />

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Factory-direct value
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Our goal is to offer savings versus typical retail pricing.
                  Savings vary by product; discounts of up to 70% apply only
                  where specifically advertised.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-white/80 p-3">
              <Truck size={19} className="mt-0.5 shrink-0 text-emerald-700" />

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Please allow extra delivery time
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Delivery estimates may vary with destination, customs
                  processing, and carrier handling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Checkout({
  cart,
  market,
  storeId,
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
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<
    Array<{
      id: string;
      name: string;
      price: number;
      deliveryEstimate: string;
    }>
  >([]);
  const [shippingMethodId, setShippingMethodId] = useState("");
  const [loadingShipping, setLoadingShipping] = useState(true);
  const [shippingError, setShippingError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; type: string } | null>(null);
  const [discountMessage, setDiscountMessage] = useState("");
  const [checkingDiscount, setCheckingDiscount] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingShipping(true);
    setShippingError("");

    getCheckoutShipping("global", storeId, country, currency)
      .then((result) => {
        if (!active) return;
        setShippingOptions(result.options);
        setShippingMethodId((current) =>
          result.options.some((option) => option.id === current)
            ? current
            : result.options[0]?.id || "",
        );
      })
      .catch((shippingLoadError) => {
        if (!active) return;
        setShippingOptions([]);
        setShippingError(
          shippingLoadError instanceof Error
            ? shippingLoadError.message
            : "Shipping options are unavailable. Please try again.",
        );
      })
      .finally(() => {
        if (active) setLoadingShipping(false);
      });

    return () => {
      active = false;
    };
  }, [country, currency, storeId]);

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const productCurrency = item.product.currency || "USD";

      const convertedPrice = convertCurrency(
        getCartItemUnitPrice(item),
        productCurrency,
        currency,
      );

      return total + convertedPrice * item.quantity;
    }, 0);
  }, [cart, currency]);

  const selectedShipping = shippingOptions.find(
    (option) => option.id === shippingMethodId,
  );
  const shippingFee = selectedShipping?.price ?? 0;

  const discountAmount = appliedDiscount?.amount ?? 0;
  const total = Math.max(0, subtotal - discountAmount) + shippingFee;

  async function applyDiscount() {
    const code = discountCode.trim().toUpperCase();
    if (!code) { setDiscountMessage("Enter a discount code first."); return; }
    setCheckingDiscount(true); setDiscountMessage("");
    try {
      const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/+$/, "").replace(/\/api$/i, "");
      const response = await fetch(`${apiBase}/api/discounts/validate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storeId, code, subtotal, shipping: shippingFee, items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity, unitPrice: convertCurrency(getCartItemUnitPrice(item), item.product.currency || "USD", currency) })) }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "This code cannot be applied.");
      const data = result.data;
      setAppliedDiscount({ code: data.code, amount: Math.min(subtotal, Number(data.discountAmount || 0)), type: data.type });
      setDiscountMessage(data.message || "Discount applied.");
    } catch (e) { setAppliedDiscount(null); setDiscountMessage(e instanceof Error ? e.message : "Unable to validate this code."); }
    finally { setCheckingDiscount(false); }
  }
  const deliveryTime = selectedShipping?.deliveryEstimate || getDeliveryTime(country);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    if (loadingShipping || !selectedShipping) {
      setError(
        "Choose an available shipping option before placing your order.",
      );
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
        workspace: "global",
        store_id: storeId,
        shipping_method_id: shippingMethodId,
        shipping_policy_accepted: true,
        subtotal,
        shipping_fee: shippingFee,
        discount_code: appliedDiscount?.code || undefined,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      });

      // The backend must return both orderId and confirmationToken.
      if (!response.orderId || !response.confirmationToken) {
        throw new Error(
          "The server did not return the order confirmation details.",
        );
      }

      // Pass the token to Store.tsx so the order confirmation flow can use it.
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
        response.total ?? total,
        response.shippingFee,
        response.confirmationToken,
      );
    } catch (submitError) {
      console.error("Checkout failed:", submitError);
      setError("We could not create your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={onBack}
            className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-medium text-slate-600 transition hover:bg-white hover:text-slate-950"
          >
            <ArrowLeft size={18} />
            Back to cart
          </button>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
            <Package size={44} className="mx-auto mb-5 text-slate-400" />

            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
              Your cart is empty
            </h1>

            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-500">
              Add a product before continuing to checkout.
            </p>

            <button
              type="button"
              onClick={onBack}
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 text-base font-semibold text-white transition hover:bg-slate-800"
            >
              Return to cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-slate-950">
      <div className="mx-auto max-w-6xl px-4 pb-32 pt-5 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8 lg:pt-12">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-medium text-slate-600 transition hover:bg-white hover:text-slate-950 sm:mb-8"
        >
          <ArrowLeft size={18} />
          Back to cart
        </button>

        <div className="mb-8 sm:mb-10">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-slate-500">
            Dropstack Global · Secure checkout
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Checkout
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
            Enter your delivery details and place your order for payment review.
          </p>
        </div>

        {/* Factory-direct information is visible before customers enter their details. */}
        <div className="mb-8">
          <FactoryDirectNotice />
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
          <div>
            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              className="space-y-6 sm:space-y-7"
            >
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
                <h2 className="text-lg font-semibold text-slate-950">Discount code</h2>
                <p className="mt-1 text-sm text-slate-500">Apply a valid code for this store.</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input aria-label="Discount code" value={discountCode} onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setAppliedDiscount(null); setDiscountMessage(""); }} placeholder="Enter code" className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-base uppercase outline-none focus:border-slate-400" />
                  <button type="button" onClick={applyDiscount} disabled={checkingDiscount} className="min-h-12 rounded-xl bg-slate-950 px-5 font-semibold text-white disabled:opacity-60">{checkingDiscount ? "Checking…" : appliedDiscount ? "Apply again" : "Apply code"}</button>
                  {appliedDiscount && <button type="button" onClick={() => { setAppliedDiscount(null); setDiscountMessage("Discount removed."); }} className="min-h-12 rounded-xl border border-slate-200 px-4 font-medium">Remove</button>}
                </div>
                {discountMessage && <p role="status" className={`mt-3 text-sm ${appliedDiscount ? "text-emerald-700" : "text-slate-600"}`}>{discountMessage}</p>}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
                <div className="mb-6 flex items-start gap-3 sm:mb-7">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <MapPin size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">
                      Contact & delivery
                    </h2>

                    <p className="mt-1 text-base leading-6 text-slate-500">
                      Enter the details needed to deliver your order.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="checkout-name"
                      className="mb-2 block text-base font-medium text-slate-700"
                    >
                      Full name
                    </label>
                    <input
                      id="checkout-name"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-email"
                      className="mb-2 block text-base font-medium text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      id="checkout-email"
                      required
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-phone"
                      className="mb-2 block text-base font-medium text-slate-700"
                    >
                      WhatsApp / phone
                    </label>
                    <input
                      id="checkout-phone"
                      required
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                      placeholder="+234..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="checkout-address"
                      className="mb-2 block text-base font-medium text-slate-700"
                    >
                      Address
                    </label>
                    <textarea
                      id="checkout-address"
                      required
                      autoComplete="street-address"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-base leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                      placeholder="Street address"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-city"
                      className="mb-2 block text-base font-medium text-slate-700"
                    >
                      City
                    </label>
                    <input
                      id="checkout-city"
                      required
                      autoComplete="address-level2"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-state"
                      className="mb-2 block text-base font-medium text-slate-700"
                    >
                      State / region
                    </label>
                    <input
                      id="checkout-state"
                      required
                      autoComplete="address-level1"
                      value={state}
                      onChange={(event) => setState(event.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                      placeholder="State / region"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="checkout-postal"
                      className="mb-2 block text-base font-medium text-slate-700"
                    >
                      Postal code
                    </label>
                    <input
                      id="checkout-postal"
                      required
                      inputMode="numeric"
                      autoComplete="postal-code"
                      value={postalCode}
                      onChange={(event) => setPostalCode(event.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10 sm:max-w-xs"
                      placeholder="Postal code"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Truck size={20} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">
                      Free shipping
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Shipping is included in the price you see. No extra shipping charge is added at checkout.
                    </p>
                  </div>
                </div>

                {loadingShipping ? (
                  <p role="status" className="text-sm text-slate-500">
                    Preparing your delivery estimate...
                  </p>
                ) : selectedShipping ? (
                  <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">Standard delivery</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{deliveryTime}</p>
                    </div>
                    <span className="w-fit shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      Free · {formatCurrency(0, currency)}
                    </span>
                  </div>
                ) : (
                  <p role="alert" className="text-sm text-red-700">
                    {shippingError || "Delivery details are temporarily unavailable. Please try again."}
                  </p>
                )}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
                <div className="mb-5 flex items-start gap-3 sm:mb-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <CreditCard size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">
                      Payment
                    </h2>
                    <p className="mt-1 text-base leading-6 text-slate-500">
                      Payment is completed separately through Raenest.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      size={21}
                      className="mt-0.5 shrink-0 text-slate-700"
                    />
                    <div>
                      <p className="text-base font-medium text-slate-900">
                        Manual payment review
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        This checkout does not collect or verify payments. After
                        placing your order, contact the store for its Raenest
                        payment link or transfer instructions. The store will
                        verify payment before fulfillment.
                      </p>
                    </div>
                  </div>
                </div>

                <label className="mt-5 flex min-h-11 cursor-pointer items-start gap-3 py-2">
                  <input
                    type="checkbox"
                    checked={acceptedPolicies}
                    onChange={(event) =>
                      setAcceptedPolicies(event.target.checked)
                    }
                    className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300"
                  />
                  <span className="text-base leading-6 text-slate-600">
                    I agree to the Terms of Service, Refund Policy, Privacy
                    Policy, and the shipping terms shown above.
                  </span>
                </label>
              </section>

              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-base leading-6 text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || loadingShipping || !selectedShipping}
                className="hidden min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:flex"
              >
                {submitting ? (
                  "Creating order..."
                ) : (
                  <>
                    <Check size={19} />
                    Place order for review
                  </>
                )}
              </button>
            </form>
          </div>

          <aside className="hidden h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6 lg:block lg:p-7">
            <h2 className="text-xl font-semibold text-slate-950">
              Order summary
            </h2>

            <div className="mt-6 space-y-4">
              {cart.map((item) => {
                const convertedPrice = convertCurrency(
                  getCartItemUnitPrice(item),
                  item.product.currency || "USD",
                  currency,
                );

                return (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          loading="lazy"
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
                      {formatCurrency(convertedPrice * item.quantity, currency)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="my-6 border-t border-slate-200" />

            <div className="space-y-3 text-base">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(subtotal, currency)}
                </span>
              </div>
              {appliedDiscount && <div className="flex justify-between gap-4 text-emerald-700"><span>Discount ({appliedDiscount.code})</span><span className="font-medium">−{formatCurrency(discountAmount, currency)}</span></div>}
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Shipping</span>
                <span className="font-medium text-emerald-700">
                  Free · {formatCurrency(0, currency)}
                </span>
              </div>
              <div className="flex justify-between gap-4 pt-2 text-lg">
                <span className="font-semibold text-slate-950">Total</span>
                <span className="font-bold text-slate-950">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-base font-medium text-slate-900">
                Estimated delivery
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {deliveryTime}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Factory-direct international shipping may take around 2 weeks or
                longer. Destination and carrier timelines can vary.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Persistent mobile checkout action and total. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.10)] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Total
            </p>
            <p className="mt-0.5 truncate text-lg font-bold text-slate-950">
              {formatCurrency(total, currency)}
            </p>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={submitting || loadingShipping || !selectedShipping}
            className="min-h-12 shrink-0 rounded-xl bg-slate-950 px-5 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Place order"}
          </button>
        </div>
      </div>
    </div>
  );
}
