import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { products } from "../data/products";

export default function Shop() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const categories = [
    "All",
    ...Array.from(new Set(products.map((product) => product.category))),
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        category === "All" || product.category === category;

      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
              MEO Store
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
              Shop our collection
            </h1>

            <p className="mt-4 max-w-xl text-slate-500">
              Explore products across electronics, beauty, pets and shapewear.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold ${
                    category === item
                      ? "bg-slate-950 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-72">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="mb-6 mt-10 flex items-center gap-2 text-sm text-slate-500">
            <SlidersHorizontal size={16} />
            {filteredProducts.length} products
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
              <h2 className="font-bold">No products found</h2>

              <p className="mt-2 text-sm text-slate-500">
                Try another search or category.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
