import {
  Globe2,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const values = [
  {
    icon: ShieldCheck,
    title: "Reliable shopping",
    text: "We focus on clear product information, straightforward checkout, and a simple customer experience.",
  },
  {
    icon: PackageCheck,
    title: "Carefully selected products",
    text: "Our product catalog is organized around useful products across several everyday categories.",
  },
  {
    icon: Truck,
    title: "Worldwide delivery",
    text: "We provide clear delivery expectations based on the destination of each order.",
  },
  {
    icon: Globe2,
    title: "Built for global customers",
    text: "Our store is designed to serve customers across multiple countries and regions.",
  },
];

export default function About() {
  return (
    <>
      <Navbar />

      <main>
        <section className="bg-slate-900 px-6 py-20 text-white">
          <div className="mx-auto max-w-6xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              About us
            </p>

            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              A simpler way to discover products online.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              We are building a modern ecommerce experience focused on
              useful products, transparent delivery information, and a
              straightforward shopping journey.
            </p>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  What we do
                </p>

                <h2 className="mt-3 text-3xl font-bold text-slate-900">
                  Ecommerce without unnecessary complexity.
                </h2>

                <p className="mt-6 leading-8 text-slate-600">
                  Our goal is to make online shopping easy to understand
                  from the moment you discover a product until your order
                  reaches you.
                </p>

                <p className="mt-4 leading-8 text-slate-600">
                  We provide product information, shipping expectations,
                  customer support, and a checkout experience designed
                  around clarity.
                </p>
              </div>

              <div className="rounded-3xl bg-slate-100 p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  {values.map((value) => {
                    const Icon = value.icon;

                    return (
                      <div
                        key={value.title}
                        className="rounded-2xl bg-white p-5 shadow-sm"
                      >
                        <Icon
                          size={24}
                          className="text-slate-900"
                        />

                        <h3 className="mt-4 font-semibold text-slate-900">
                          {value.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {value.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}