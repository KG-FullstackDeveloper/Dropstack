import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { getProducts } from "../services/api";
import type { Product } from "../types/product";

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load real products from the backend.
  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const items = await getProducts();

        if (active) {
          setProducts(
            items.filter((product) => Number(product.active) === 1),
          );
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load products.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, []);

  // Build categories from the products returned by the backend.
  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          products
            .map((product) => product.category)
            .filter(
              (item): item is string =>
                typeof item === "string" && item.trim().length > 0,
            ),
        ),
      ),
    ],
    [products],
  );

  // Apply both category and search filters.
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "All" || product.category === category;

      const searchableText = [
        product.name,
        product.description,
        product.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && searchableText.includes(query);
    });
  }, [products, category, search]);

  function resetFilters() {
    setSearch("");
    setCategory("All");
  }

  return (
    <div className="min-h-screen bg-[#f6f3ec] text-[#171713]">
      <Navbar />

      <main>
        {/* Editorial shop introduction */}
        <section className="border-b border-black/10 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1440px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#817a6e]">
              MEO Store · The collection
            </p>

            <div className="mt-6 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
              <h1 className="font-serif text-5xl tracking-[-0.05em] sm:text-7xl lg:text-8xl">
                Shop the edit.
              </h1>

              <p className="max-w-md text-base leading-7 text-[#6e685f]">
                Explore our collection of carefully selected products.
                Discover useful essentials and find something that fits
                your everyday needs.
              </p>
            </div>

            <p className="mt-8 text-xs text-[#817a6e]">
              {loading
                ? "Loading the collection..."
                : `${products.length} ${
                    products.length === 1 ? "product" : "products"
                  } available`}
            </p>
          </div>
        </section>

        {/* Search and category filters */}
        <section className="sticky top-[80px] z-30 border-b border-black/10 bg-[#f6f3ec]/95 px-5 py-4 backdrop-blur sm:px-8 lg:top-[100px] lg:px-12">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  aria-pressed={category === item}
                  className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                    category === item
                      ? "border-[#171713] bg-[#171713] text-white"
                      : "border-black/15 text-[#645f56] hover:border-black/50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-72">
              <Search
                size={17}
                aria-hidden="true"
                className="absolute left-0 top-1/2 -translate-y-1/2 text-[#817a6e]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search the collection"
                aria-label="Search products"
                className="w-full border-0 border-b border-black/25 bg-transparent py-2 pl-7 pr-8 text-sm outline-none placeholder:text-[#9b958b] focus:border-black"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Product collection */}
        <section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12 lg:py-20">
          <div className="mb-8 flex items-center justify-between border-b border-black/10 pb-5">
            <p className="text-xs text-[#777168]">
              {loading
                ? "Loading products..."
                : `Showing ${filteredProducts.length} ${
                    filteredProducts.length === 1 ? "product" : "products"
                  }`}
            </p>

            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">
              <SlidersHorizontal size={14} aria-hidden="true" />
              Collection
            </span>
          </div>

          {/* Loading skeletons */}
          {loading ? (
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  className="animate-pulse"
                  aria-hidden="true"
                >
                  <div className="aspect-[4/5] bg-[#e8e3d9]" />

                  <div className="space-y-3 py-5">
                    <div className="h-3 w-1/3 rounded bg-[#e8e3d9]" />
                    <div className="h-5 w-3/4 rounded bg-[#e8e3d9]" />
                    <div className="h-4 w-1/4 rounded bg-[#e8e3d9]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* API error state */
            <div className="border border-red-200 bg-white px-6 py-16 text-center">
              <h2 className="font-serif text-3xl">
                Products could not be loaded.
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#777168]">
                {error}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-7 bg-[#171713] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-black/80"
              >
                Try again
              </button>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          ) : (
            /* Empty search results */
            <div className="border border-black/10 px-6 py-24 text-center">
              <h2 className="font-serif text-3xl">Nothing found.</h2>

              <p className="mt-3 text-sm leading-6 text-[#777168]">
                Try another search or browse the full collection.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-7 border-b border-black pb-1 text-xs font-bold uppercase tracking-widest"
              >
                Reset filters
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}