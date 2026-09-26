import { ArrowRight, CreditCard, ShieldCheck, Truck } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import ShippingNotice from "../components/ShippingNotice";
import { products } from "../data/products";
import { getDeliveryTime } from "../utils/shipping";

export default function Home() {
  const featuredProducts = products.slice(0, 4);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white">
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
                MEO Store
              </p>

              <h1 className="mt-5 text-5xl font-bold tracking-tight text-slate-950 md:text-6xl lg:text-7xl">
                Quality products.
                <br />
                Delivered worldwide.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">
                Discover carefully selected products across electronics, beauty,
                pets and everyday essentials.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 font-semibold text-white transition hover:bg-slate-800"
                >
                  Explore products
                  <ArrowRight size={18} />
                </a>

                <a
                  href="#featured"
                  className="rounded-full border border-slate-300 bg-white px-7 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  View featured
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-3xl bg-slate-200">
                {products[0]?.image_url ? (
                  <img
                    src={products[0].image_url}
                    alt={products[0].name}
                    className="h-[420px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[420px] items-center justify-center text-slate-400">
                    No image available
                  </div>
                )}
              </div>

              {products[0] && (
                <div className="absolute bottom-5 left-5 rounded-2xl border border-white/60 bg-white/95 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Featured
                  </p>

                  <p className="mt-1 font-bold text-slate-950">
                    {products[0].name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatHomePrice(products[0].price, products[0].currency)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 md:grid-cols-3">
            <Benefit
              icon={<Truck size={21} />}
              title="Worldwide delivery"
              text="Delivery options available for customers in multiple countries."
            />

            <Benefit
              icon={<ShieldCheck size={21} />}
              title="Carefully selected"
              text="Products are selected with quality and everyday usefulness in mind."
            />

            <Benefit
              icon={<CreditCard size={21} />}
              title="Secure checkout"
              text="Pay securely through our supported payment gateway."
            />
          </div>
        </section>

        <section id="featured" className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Featured
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Featured products
              </h2>

              <p className="mt-3 max-w-xl text-slate-500">
                Explore some of our currently available products.
              </p>
            </div>

            <a
              href="/shop"
              className="inline-flex items-center gap-2 font-semibold text-slate-950 hover:underline"
            >
              View all
              <ArrowRight size={17} />
            </a>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Shipping
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-950">
                  Simple delivery expectations
                </h2>

                <p className="mt-4 max-w-xl leading-7 text-slate-500">
                  We show the expected delivery window based on your destination
                  before you complete your order.
                </p>
              </div>

              <ShippingNotice
                country="NG"
                deliveryTime={getDeliveryTime("NG")}
              />
            </div>
          </div>
        </section>

        <section className="bg-slate-950">
          <div className="mx-auto max-w-7xl px-6 py-20 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Find something you'll love.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Browse the full collection and discover your next purchase.
            </p>

            <a
              href="/shop"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Start shopping
              <ArrowRight size={18} />
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function formatHomePrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function Benefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        {icon}
      </div>

      <div>
        <h3 className="font-bold text-slate-950">{title}</h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
      </div>
    </div>
  );
}
