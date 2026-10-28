import { Globe2, Package, Plane } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Shipping() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-slate-900 px-6 py-20 text-white">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Shipping</p>
            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Delivery information</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Delivery options and timing depend on the product and destination. Please review the information provided for your order before confirming it.
            </p>
          </div>
        </section>
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-6">
                <Package size={25} className="text-slate-900" />
                <h2 className="mt-4 font-bold text-slate-900">Order processing</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Processing begins after the order has been accepted and the required payment confirmation has been completed. Processing time varies by product and supplier.
                </p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-6">
                <Plane size={25} className="text-slate-900" />
                <h2 className="mt-4 font-bold text-slate-900">Transit and customs</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Carrier schedules, customs checks, public holidays and other events outside the store’s control may affect delivery. Any applicable import duties or taxes should be checked for your destination.
                </p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-6">
                <Globe2 size={25} className="text-slate-900" />
                <h2 className="mt-4 font-bold text-slate-900">Destination availability</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Not every product may be deliverable to every country. Confirm that your destination is supported before placing an order.
                </p>
              </article>
            </div>
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">Tracking your order</h2>
              <p className="mt-3 leading-7 text-slate-600">
                A tracking number may only become available after the parcel has been dispatched and the carrier has registered it. If your tracking information is not available yet, please check again later or contact support with your order number.
              </p>
              <div className="mt-5 flex flex-wrap gap-4">
                <Link to="/order-tracking" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Track an order</Link>
                <Link to="/contact" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800">Contact support</Link>
              </div>
            </div>
            <p className="mt-8 text-sm leading-6 text-slate-500">
              Delivery estimates are not guarantees unless the store explicitly states otherwise for your order. Please check the order confirmation and contact support if you need help.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
