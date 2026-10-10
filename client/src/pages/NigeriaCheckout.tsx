import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Package,
  ShieldCheck,
} from "lucide-react";

import type { CartItem } from "../types/cart";
import {
  createNigeriaOrder,
  getNigeriaSettings,
  type NigeriaSettings,
} from "../services/nigeriaApi";
import { formatCurrency } from "../utils/currency";

interface NigeriaCheckoutProps {
  cart: CartItem[];
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

export default function NigeriaCheckout({
  cart,
  onBack,
  onComplete,
}: NigeriaCheckoutProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [settings, setSettings] =
    useState<NigeriaSettings | null>(null);

  const [settingsLoading, setSettingsLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        setSettingsLoading(true);

        const result =
          await getNigeriaSettings();

        if (!cancelled) {
          setSettings(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load Nigeria store settings.",
          );
        }
      } finally {
        if (!cancelled) {
          setSettingsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const shippingFee = Math.max(
    0,
    Number(
      settings?.default_shipping_fee ?? 0,
    ) || 0,
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          (Number(item.product.price) || 0) *
            item.quantity,
        0,
      ),
    [cart],
  );

  const total = subtotal + shippingFee;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!accepted) {
      setError(
        "Please accept the store policies before continuing.",
      );
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !state.trim()
    ) {
      setError(
        "Please complete all required delivery details.",
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const order =
        await createNigeriaOrder({
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          shippingAddress: address.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim() || undefined,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        });

      onComplete(
        order.id,
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
        },
        Number(order.total) || total,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your Nigeria order.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft size={17} />
            Back to cart
          </button>

          <span className="text-sm font-black">
            Nigeria Checkout
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Delivery details
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight">
                Complete your Nigeria order
              </h1>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <Field
                label="Full name"
                value={name}
                onChange={setName}
                required
              />

              <Field
                label="Email address"
                type="email"
                value={email}
                onChange={setEmail}
                required
              />

              <Field
                label="Phone number"
                value={phone}
                onChange={setPhone}
                required
              />

              <Field
                label="State"
                value={state}
                onChange={setState}
                required
              />

              <Field
                label="City"
                value={city}
                onChange={setCity}
                required
              />

              <Field
                label="Postal code"
                value={postalCode}
                onChange={setPostalCode}
              />

              <div className="sm:col-span-2">
                <Field
                  label="Delivery address"
                  value={address}
                  onChange={setAddress}
                  required
                />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Info
                icon={<MapPin size={18} />}
                title="Nigeria only"
                text="Delivery is restricted to Nigerian addresses."
              />

              <Info
                icon={<TruckIcon />}
                title="Delivery"
                text={
                  settings?.delivery_estimate ||
                  "2–7 business days"
                }
              />

              <Info
                icon={<ShieldCheck size={18} />}
                title="Secure order"
                text="Your order is stored separately from Global Ecommerce."
              />
            </div>

            <label className="mt-7 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) =>
                  setAccepted(
                    event.target.checked,
                  )
                }
                className="mt-0.5 h-4 w-4"
              />

              <span>
                I agree to the store terms,
                refund policy and privacy policy.
              </span>
            </label>

            {error && (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                submitting ||
                settingsLoading
              }
              className="mt-6 min-h-13 w-full rounded-2xl bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting
                ? "Creating order..."
                : settingsLoading
                  ? "Loading checkout..."
                  : "Place Nigeria order"}
            </button>
          </form>

          <aside className="h-fit rounded-3xl bg-slate-950 p-6 text-white shadow-xl lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
              Order summary
            </p>

            <div className="mt-5 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-start justify-between gap-4 text-sm"
                >
                  <span className="text-white/70">
                    {item.product.name} ×{" "}
                    {item.quantity}
                  </span>

                  <span className="font-bold">
                    {formatCurrency(
                      (Number(
                        item.product.price,
                      ) || 0) *
                        item.quantity,
                      "NGN",
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="my-5 border-t border-white/10" />

            <div className="flex justify-between text-sm text-white/70">
              <span>Subtotal</span>
              <span>
                {formatCurrency(
                  subtotal,
                  "NGN",
                )}
              </span>
            </div>

            <div className="mt-3 flex justify-between text-sm text-white/70">
              <span>Shipping</span>
              <span>
                {formatCurrency(
                  shippingFee,
                  "NGN",
                )}
              </span>
            </div>

            <div className="my-5 border-t border-white/10" />

            <div className="flex items-center justify-between">
              <span className="font-semibold">
                Total
              </span>

              <span className="text-xl font-black">
                {formatCurrency(
                  total,
                  "NGN",
                )}
              </span>
            </div>

            <div className="mt-5 rounded-2xl bg-white/10 p-4 text-xs leading-5 text-white/60">
              <div className="flex items-center gap-2 font-bold text-white/80">
                <CreditCard size={15} />

                {settings?.payment_method ===
                "cod"
                  ? "Cash on delivery"
                  : "Payment confirmation pending"}
              </div>

              <p className="mt-2">
                The Nigeria workspace records
                this order independently from
                the Global Ecommerce workspace.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        required={required}
        className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
      />
    </label>
  );
}

function Info({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-bold">
        {icon}
        {title}
      </div>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {text}
      </p>
    </div>
  );
}

function TruckIcon() {
  return <Package size={18} />;
}