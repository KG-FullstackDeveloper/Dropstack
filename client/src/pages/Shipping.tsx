import {
  Globe2,
  Package,
  Plane,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const regions = [
  {
    name: "Nigeria",
    code: "NG",
    time: "6–10 days",
  },
  {
    name: "Ghana",
    code: "GH",
    time: "6–10 days",
  },
  {
    name: "South Africa",
    code: "ZA",
    time: "6–10 days",
  },
  {
    name: "United States",
    code: "US",
    time: "10–14 days",
  },
  {
    name: "United Kingdom",
    code: "GB",
    time: "10–14 days",
  },
  {
    name: "Australia",
    code: "AU",
    time: "10–14 days",
  },
];

export default function Shipping() {
  return (
    <>
      <Navbar />

      <main>
        <section className="bg-slate-900 px-6 py-20 text-white">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              Shipping
            </p>

            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
              Delivery information
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              We provide estimated delivery windows based on the
              destination of your order.
            </p>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <Package
                  size={25}
                  className="text-slate-900"
                />

                <h2 className="mt-4 font-bold text-slate-900">
                  Order processing
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Products may require processing before they are
                  dispatched.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <Plane
                  size={25}
                  className="text-slate-900"
                />

                <h2 className="mt-4 font-bold text-slate-900">
                  International shipping
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  International orders may be transported by air
                  depending on the destination.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <Globe2
                  size={25}
                  className="text-slate-900"
                />

                <h2 className="mt-4 font-bold text-slate-900">
                  Global destinations
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Shipping availability and delivery times depend on
                  the destination country.
                </p>
              </div>
            </div>

            <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Estimated delivery windows
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  These are estimates and may vary.
                </p>
              </div>

              <div className="divide-y divide-slate-200">
                {regions.map((region) => (
                  <div
                    key={region.code}
                    className="flex items-center justify-between px-6 py-5"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {region.name}
                      </p>

                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                        {region.code}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                      {region.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}