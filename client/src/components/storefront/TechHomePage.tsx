
import { ArrowRight, Check, Cpu, Gamepad2, Monitor, Package, Search, ShoppingCart, Truck, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import type { Product } from "../../types/product";
import { formatCurrency } from "../../utils/currency";

type TechHomePageProps = {
  products: Product[];
  loading: boolean;
  tagline: string;
  storeLoadError: string;
  onCatalog: () => void;
  onProduct: (product: Product) => void;
  onAdd: (product: Product) => void;
  onContact: () => void;
};

const categories = [
  { name: "All products", icon: Package },
  { name: "Projectors", icon: Monitor },
  { name: "Gaming", icon: Gamepad2 },
  { name: "LED Lighting", icon: Zap },
  { name: "Computer Accessories", icon: Cpu },
];

const benefits = [
  {
    icon: Package,
    title: "Products worth exploring",
    description: "Discover useful technology for work, play and everyday life.",
  },
  {
    icon: Truck,
    title: "Delivery information",
    description: "Review the available delivery estimate for your destination.",
  },
  {
    icon: Check,
    title: "Clear product details",
    description: "Check specifications, availability and pricing before ordering.",
  },
];

function getProductImage(product: Product) {
  return product.image_url || product.images?.[0] || "";
}

function matchesCategory(product: Product, category: string) {
  if (category === "All products") return true;

  const text = `${product.name} ${product.category ?? ""} ${product.description ?? ""}`.toLowerCase();

  if (category === "Projectors") {
    return text.includes("projector") || text.includes("projection");
  }

  if (category === "Gaming") {
    return (
      text.includes("gaming") ||
      text.includes("gamepad") ||
      text.includes("controller") ||
      text.includes("gaming mouse") ||
      text.includes("gaming keyboard")
    );
  }

  if (category === "LED Lighting") {
    return (
      text.includes("led") ||
      text.includes("light strip") ||
      text.includes("light bar") ||
      text.includes("rgb lighting")
    );
  }

  if (category === "Computer Accessories") {
    return (
      text.includes("keyboard") ||
      text.includes("mouse") ||
      text.includes("usb") ||
      text.includes("monitor") ||
      text.includes("computer") ||
      text.includes("laptop") ||
      text.includes("webcam") ||
      text.includes("desk mat")
    );
  }

  return true;
}

export default function TechHomePage({
  products,
  loading,
  tagline,
  storeLoadError,
  onCatalog,
  onProduct,
  onAdd,
  onContact,
}: TechHomePageProps) {
  const [activeCategory, setActiveCategory] = useState("All products");
  const [search, setSearch] = useState("");

  const featuredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
      .filter((product) => matchesCategory(product, activeCategory))
      .filter((product) => {
        if (!query) return true;

        return `${product.name} ${product.category ?? ""} ${product.description ?? ""}`
          .toLowerCase()
          .includes(query);
      })
      .slice(0, 8);
  }, [products, activeCategory, search]);

  const heroImage =
  (products.length > 0 ? getProductImage(products[0]) : "") ||
  "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1800&q=85";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Main storefront hero */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:px-10 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
              <Zap size={14} />
              TECHNOLOGY FOR EVERYDAY LIFE
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Better tech.
              <span className="block text-blue-700">Smarter choices.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              {tagline ||
                "Explore projectors, gaming gear, LED lighting and practical technology for your workspace and home."}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCatalog}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Explore products <ArrowRight size={17} />
              </button>

              <button
                type="button"
                onClick={onContact}
                className="min-h-12 rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                Contact our team
              </button>
            </div>

            <div className="mt-9 grid grid-cols-3 gap-3 border-t border-slate-200 pt-6">
              <div>
                <p className="text-lg font-bold sm:text-xl">Tech</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  For work and play
                </p>
              </div>
              <div>
                <p className="text-lg font-bold sm:text-xl">Choice</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Explore product options
                </p>
              </div>
              <div>
                <p className="text-lg font-bold sm:text-xl">Clarity</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Check details before buying
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
            <img
              src={heroImage}
              alt="Featured technology product"
              fetchPriority="high"
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-5 pt-16 text-white sm:p-7 sm:pt-20">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
                Discover the collection
              </p>
              <p className="mt-2 text-xl font-bold sm:text-2xl">
                Make your setup work better
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category navigation */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              Find what you need
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Shop by category
            </h2>
          </div>

          <button
            type="button"
            onClick={onCatalog}
            className="inline-flex min-h-10 w-fit items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            View full catalog <ArrowRight size={16} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setActiveCategory(name);
                setSearch("");
              }}
              className={`flex min-h-24 flex-col items-start justify-between rounded-xl border p-4 text-left transition ${
                activeCategory === name
                  ? "border-blue-700 bg-blue-50 text-blue-800"
                  : "border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <Icon size={21} />
              <span className="mt-4 text-sm font-semibold">{name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">
                The product collection
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {activeCategory === "All products"
                  ? "Explore our products"
                  : activeCategory}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Browse available products and compare their details.
              </p>
            </div>

            <label className="relative block w-full sm:max-w-xs">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {loading && products.length === 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <div className="aspect-square bg-slate-200" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 rounded bg-slate-200" />
                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.map((product) => {
                const image = getProductImage(product);

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <button
                      type="button"
                      onClick={() => onProduct(product)}
                      className="block w-full text-left"
                    >
                      <div className="relative aspect-square overflow-hidden bg-slate-100">
                        {image ? (
                          <img
                            src={image}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                            <Package size={30} />
                            <span className="text-xs">Image unavailable</span>
                          </div>
                        )}
                      </div>

                      <div className="p-3 sm:p-4">
                        <p className="text-xs font-medium text-slate-500">
                          {product.category || "Technology"}
                        </p>
                        <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900 sm:text-base">
                          {product.name}
                        </h3>
                        <p className="mt-3 text-base font-bold text-slate-900">
                          {formatCurrency(
                            product.price,
                            product.currency || "USD",
                          )}
                        </p>
                      </div>
                    </button>

                    <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                      <button
                        type="button"
                        onClick={() => onAdd(product)}
                        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 text-xs font-semibold text-white transition hover:bg-blue-800 sm:text-sm"
                      >
                        <ShoppingCart size={15} />
                        Add to cart
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-slate-200 bg-white px-5 py-12 text-center">
              <Package className="mx-auto text-slate-400" size={32} />
              <h3 className="mt-4 text-lg font-semibold">
                No matching products found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try another search or view the complete catalog.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("All products");
                  setSearch("");
                }}
                className="mt-5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Clear filters
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={onCatalog}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold hover:bg-slate-100"
            >
              Browse all products <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Store information */}
      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-12 sm:grid-cols-3 sm:px-8 sm:py-16 lg:px-10">
        {benefits.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Icon size={20} />
            </span>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
        ))}
      </section>

      {storeLoadError && (
        <div
          role="status"
          className="mx-auto mb-8 max-w-7xl px-5 text-sm text-amber-700 sm:px-8 lg:px-10"
        >
          {storeLoadError}
        </div>
      )}
    </main>
  );
}
