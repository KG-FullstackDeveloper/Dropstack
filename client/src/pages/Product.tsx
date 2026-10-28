import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe2,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getProduct } from "../services/api";
import { detectMarket } from "../services/market";
import type { MarketInfo } from "../types/market";
import type { Product as ProductType } from "../types/product";
import { addToCart, getCart, saveCart } from "../utils/cart";
import { convertCurrency, formatCurrency } from "../utils/currency";
import { getDeliveryTime } from "../utils/shipping";

// Replace this with your real WhatsApp business number.
// Include the country code, without +, spaces, or dashes.
const WHATSAPP_NUMBER = "234XXXXXXXXXX";

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [market, setMarket] = useState<MarketInfo | null>(null);

  useEffect(() => {
    let active = true;

    if (!id) {
      setError("Product not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setProduct(null);

    getProduct(id)
      .then((item) => {
        if (!active) return;

        if (Number(item.active) === 1) {
          setProduct(item);
        } else {
          setError("This product may no longer be available.");
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setError(
            e instanceof Error ? e.message : "Unable to load this product.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;

    void detectMarket()
      .then((detected) => {
        if (active) setMarket(detected);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Update SEO metadata when the real product data becomes available.
  useEffect(() => {
    if (!product) return;

    const title = `${product.name} | MEO Store`;
    const description = (
      product.description || `Discover ${product.name} at MEO Store.`
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);

    const image = product.image_url || product.images?.[0];

    document.title = title;

    // Create a metadata tag if it doesn't exist, or update it.
    const setMeta = (name: string, content: string, property = false) => {
      const attribute = property ? "property" : "name";

      let tag = document.head.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${name}"]`,
      );

      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }

      tag.content = content;
    };

    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", "product", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);

    if (image) {
      setMeta("og:image", image, true);
      setMeta("twitter:image", image);
    }
  }, [product]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto min-h-[70vh] max-w-7xl animate-pulse px-5 py-12 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="aspect-[4/5] rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-5 py-8">
              <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-10 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-7 w-1/4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-24 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-14 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="grid min-h-[70vh] place-items-center bg-[#f6f3ec] px-5 py-16 text-center dark:bg-slate-950">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
              404 · Product unavailable
            </p>

            <h1 className="mt-4 font-serif text-4xl text-slate-950 dark:text-white sm:text-5xl">
              This product is unavailable.
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
              {error || "This product may no longer be available."}
            </p>

            <Link
              to="/shop"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#171713] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white dark:bg-white dark:text-slate-950"
            >
              <ArrowLeft size={15} />
              Return to shop
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const image = product.image_url || product.images?.[0];
  const deliveryTime =
    product.delivery_time || getDeliveryTime(market?.countryCode || "US");
  const displayCurrency = market?.currency || "USD";

  // Keep the existing cart and checkout workflow.
  function handlePurchase() {
    const nextCart = addToCart(getCart(), product!, 1);
    saveCart(nextCart);

    navigate("/store/meo-store", { state: { openCart: true } });
  }

  // Open WhatsApp with the current product details prefilled.
  function handleBulkOrder() {
    const message = [
      "Hello! I would like to discuss a bulk order.",
      "",
      `Product: ${product!.name}`,
      `Product reference: ${product!.slug || product!.id}`,
      `Listed price: ${formatCurrency(
        convertCurrency(
          product!.price,
          product!.currency || "USD",
          displayCurrency,
        ),
        displayCurrency,
      )}`,
      "",
      "Please share your bulk pricing, minimum order quantity, and available bundle options.",
    ].join("\n");

    const url =
      `https://wa.me/${WHATSAPP_NUMBER}` +
      `?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-[#f6f3ec] text-[#171713] dark:bg-slate-950 dark:text-white">
      <Navbar />

      <main>
        <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 lg:px-12">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 transition hover:text-black dark:hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to collection
          </Link>
        </div>

        <section className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-20 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:gap-20 lg:px-12">
          {/* Product image */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-[#d8cdbd] via-[#b5a58e] to-[#766751] lg:sticky lg:top-32">
            {image ? (
              <img
                src={image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <div className="relative grid aspect-square w-[45%] place-items-center rounded-full border border-white/40 bg-white/15 shadow-xl backdrop-blur-md">
                  <span className="font-serif text-7xl text-white/85">
                    {product.name.charAt(0)}
                  </span>
                  <div className="absolute inset-[14%] rounded-full border border-white/30" />
                </div>
              </div>
            )}

            <span className="absolute left-5 top-5 max-w-[80%] truncate rounded-full bg-white/90 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-900 backdrop-blur">
              {product.category || "Selected product"}
            </span>
          </div>

          {/* Product information */}
          <div className="py-4 lg:py-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              {product.category || "Collection"}
            </p>

            <h1 className="mt-5 font-serif text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {product.name}
            </h1>

            <p className="mt-6 text-2xl font-semibold">
              {formatCurrency(
                convertCurrency(
                  product.price,
                  product.currency || "USD",
                  displayCurrency,
                ),
                displayCurrency,
              )}
            </p>

            <p className="mt-8 max-w-xl border-t border-black/15 pt-8 text-base leading-8 text-slate-600 dark:border-slate-700 dark:text-slate-300">
              {product.description ||
                "Discover more details about this product."}
            </p>

            {/* Main purchase action */}
            <button
              type="button"
              onClick={handlePurchase}
              className="group mt-9 flex w-full items-center justify-between rounded-full bg-[#171713] px-7 py-5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#403c35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              <span className="flex items-center gap-3">
                <ShoppingBag size={17} />
                Buy now
              </span>

              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>

            <p className="mt-3 text-center text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              Continue to your cart · Secure checkout
            </p>

            {/* Bulk order action */}
            <button
              type="button"
              onClick={handleBulkOrder}
              className="mt-4 flex w-full items-center justify-center gap-3 rounded-full border border-black/15 px-7 py-4 text-xs font-bold uppercase tracking-[0.12em] transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:border-slate-700 dark:hover:bg-white/5"
            >
              <MessageCircle size={17} />
              Ask about bulk orders
            </button>

            {/* Product assurances */}
            <div className="mt-10 divide-y divide-black/10 border-y border-black/10 dark:divide-slate-700 dark:border-slate-700">
              <Detail
                icon={<Check size={17} />}
                title="Product availability"
                value={
                  (product.stock ?? 0) > 0
                    ? `${product.stock} available`
                    : "Availability confirmed at checkout"
                }
              />

              <Detail
                icon={<Globe2 size={17} />}
                title="Delivery"
                value={deliveryTime}
              />

              <Detail
                icon={<ShieldCheck size={17} />}
                title="Payment verification"
                value="Orders are subject to payment confirmation."
              />
            </div>

            {/* Customer-facing shipping details only. Supplier and cost data stay private. */}
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-emerald-700 dark:bg-slate-900 dark:text-emerald-300">
                  <Truck size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Free shipping
                    </p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-slate-900 dark:text-emerald-300">
                      Shipping fee: {formatCurrency(0, displayCurrency)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {deliveryTime}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    No additional shipping charge at checkout.
                  </p>
                </div>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <Meta
                label="Processing time"
                value={product.processing_time || "1–3 days"}
              />
              <Meta
                label="Product reference"
                value={product.slug || String(product.id)}
              />
            </dl>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-black/10 p-4 dark:border-slate-700">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/5 dark:bg-white/10">
                <Truck size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold">Delivery updates</p>

                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Tracking details can be shared when your order ships.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Detail({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 py-5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/15 dark:border-slate-700">
        {icon}
      </span>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.1em]">{title}</p>

        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {value}
        </p>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </dt>

      <dd className="mt-2 break-words text-sm text-slate-800 dark:text-slate-200">
        {value}
      </dd>
    </div>
  );
}
