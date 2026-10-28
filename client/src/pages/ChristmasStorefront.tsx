
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Gift,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import type { Product } from "../types/product";

type ChristmasStorefrontProps = {
  brandName: string;
  products: Product[];
  currency: string;
  cartCount: number;
  onProduct: (product: Product) => void;
  onAdd: (product: Product) => void;
  onCart: () => void;
  onShopAll?: () => void;
};

const collections = [
  {
    title: "Gifts for everyone",
    description: "Thoughtful finds for every name on your list.",
    image:
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Make home magical",
    description: "Cosy details for memorable celebrations.",
    image:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Little luxuries",
    description: "Unexpected favourites worth giving.",
    image:
      "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=85",
  },
];

function getProductImage(product: Product): string {
  const item = product as Product & {
    image_url?: string;
    image?: string;
    images?: string[] | string;
  };

  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images[0] || "";
  }

  if (typeof item.images === "string" && item.images) {
    try {
      const images: unknown = JSON.parse(item.images);

      if (Array.isArray(images) && typeof images[0] === "string") {
        return images[0];
      }
    } catch {
      return item.images;
    }
  }

  return item.image_url || item.image || "";
}

function formatPrice(price: number, currency: string): string {
  const amount = Number(price);
  const currencyCode = currency || "USD";

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export default function ChristmasStorefront({
  brandName,
  products,
  currency,
  cartCount,
  onProduct,
  onAdd,
  onCart,
  onShopAll,
}: ChristmasStorefrontProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [wishlist, setWishlist] = useState<string[]>([]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
      .filter((product) =>
        `${product.name} ${product.category || ""}`
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 8);
  }, [products, search]);

  function toggleWishlist(id: string) {
    setWishlist((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function handleShopAll() {
    setMenuOpen(false);
    onShopAll?.();
  }

  return (
    <div className="min-h-screen bg-[#f8f6ef] text-[#17382c]">
      {/* Seasonal announcement */}
      <div className="bg-[#17382c] px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f5eddb] sm:text-xs">
        The festive edit is here
        <span className="mx-3 text-[#d5bd86]">✳</span>
        Thoughtful gifts. Beautiful surprises.
      </div>

      {/* Main navigation */}
      <header className="sticky top-0 z-40 border-b border-[#17382c]/10 bg-[#f8f6ef]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>

          <button
            type="button"
            onClick={handleShopAll}
            className="text-left"
          >
            <span className="block font-serif text-2xl tracking-tight sm:text-3xl">
              {brandName || "Evergreen & Co."}
            </span>
            <span className="hidden text-[9px] uppercase tracking-[0.25em] text-[#17382c]/55 sm:block">
              The considered gift shop
            </span>
          </button>

          <nav className="hidden items-center gap-8 lg:flex">
            <button
              type="button"
              onClick={handleShopAll}
              className="text-sm hover:text-[#a33e32]"
            >
              Shop all
            </button>
            <a href="#collections" className="text-sm hover:text-[#a33e32]">
              Collections
            </a>
            <a href="#bestsellers" className="text-sm hover:text-[#a33e32]">
              Bestsellers
            </a>
            <a href="#our-story" className="text-sm hover:text-[#a33e32]">
              Our story
            </a>
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={searchOpen ? "Close search" : "Search products"}
              aria-expanded={searchOpen}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#17382c]/5"
            >
              {searchOpen ? (
                <X size={19} strokeWidth={1.6} />
              ) : (
                <Search size={19} strokeWidth={1.6} />
              )}
            </button>

            <button
              type="button"
              onClick={onCart}
              aria-label={`Open shopping bag, ${cartCount} items`}
              className="relative flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#17382c]/5"
            >
              <ShoppingBag size={19} strokeWidth={1.6} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#a33e32] px-1 text-[9px] text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="mx-auto max-w-[1400px] px-5 pb-4 sm:px-8 lg:px-12">
            <label className="sr-only" htmlFor="christmas-product-search">
              Search products
            </label>
            <input
              id="christmas-product-search"
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search gifts, home, accessories..."
              className="h-12 w-full rounded-full border border-[#17382c]/15 bg-white px-5 text-sm outline-none focus:border-[#17382c]/40"
            />
          </div>
        )}

        {menuOpen && (
          <nav className="grid gap-1 border-t border-[#17382c]/10 px-5 py-4 lg:hidden">
            <button
              type="button"
              onClick={handleShopAll}
              className="min-h-11 text-left text-sm"
            >
              Shop all
            </button>
            <a
              href="#collections"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-11 items-center text-sm"
            >
              Collections
            </a>
            <a
              href="#bestsellers"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-11 items-center text-sm"
            >
              Bestsellers
            </a>
            <a
              href="#our-story"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-11 items-center text-sm"
            >
              Our story
            </a>
          </nav>
        )}
      </header>

      <main>
        {/* Premium Christmas hero */}
        <section className="mx-auto grid max-w-[1400px] px-4 pb-10 pt-5 sm:px-8 sm:pb-16 lg:grid-cols-2 lg:px-12 lg:pt-8">
          <div className="relative flex min-h-[440px] flex-col justify-center overflow-hidden bg-[#17382c] px-7 py-12 text-[#f8f1e3] sm:px-12 lg:px-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border border-[#d5bd86]/25" />

            <div className="mb-7 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.23em] text-[#d5bd86] sm:text-xs">
              <Sparkles size={15} />
              A season for giving
            </div>

            <h1 className="max-w-xl font-serif text-6xl leading-[0.92] tracking-[-0.07em] sm:text-7xl lg:text-[5.5rem]">
              Give a little
              <br />
              <span className="italic text-[#d5bd86]">wonder.</span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-white/70 sm:text-base sm:leading-8">
              Discover thoughtful finds, festive favourites and everyday
              treasures chosen to make the season feel more special.
            </p>

            <button
              type="button"
              onClick={handleShopAll}
              className="mt-9 inline-flex min-h-14 w-fit items-center gap-5 rounded-full bg-[#f8f1e3] px-7 text-sm font-semibold text-[#17382c] transition hover:bg-white"
            >
              Explore the collection
              <ArrowRight size={17} />
            </button>

            <Gift
              size={50}
              strokeWidth={0.8}
              className="absolute bottom-8 right-8 hidden text-[#d5bd86]/70 sm:block"
            />
          </div>

          <div className="relative min-h-[340px] overflow-hidden bg-[#dce3d8] sm:min-h-[460px]">
            <img
              src="https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=1400&q=90"
              alt="Festive gifts and seasonal decorations"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#10291e]/55 to-transparent" />

            <div className="absolute bottom-7 left-6 right-6 flex items-end justify-between text-white sm:bottom-9 sm:left-9 sm:right-9">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/75">
                  The seasonal collection
                </p>
                <h2 className="mt-2 font-serif text-3xl sm:text-4xl">
                  The art of giving
                </h2>
              </div>

              <a
                href="#collections"
                aria-label="Explore collections"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#17382c]"
              >
                <ArrowRight size={19} />
              </a>
            </div>
          </div>
        </section>

        {/* Store benefits */}
        <section className="mx-auto grid max-w-[1400px] grid-cols-2 gap-4 px-5 pb-12 sm:grid-cols-4 sm:px-8 lg:px-12">
          {[
            ["Thoughtfully chosen", "Finds with a little meaning"],
            ["Gift-worthy finds", "Make giving feel effortless"],
            ["Seasonal favourites", "For every celebration"],
            ["Everyday magic", "Lovely things, made useful"],
          ].map(([title, description]) => (
            <div key={title} className="border-t border-[#17382c]/15 py-4">
              <p className="font-serif text-lg sm:text-xl">{title}</p>
              <p className="mt-1.5 text-xs leading-5 text-[#17382c]/55">
                {description}
              </p>
            </div>
          ))}
        </section>

        {/* Seasonal collections */}
        <section
          id="collections"
          className="bg-[#eeeae1] px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-24"
        >
          <div className="mx-auto max-w-[1400px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a33e32]">
              Find their kind of lovely
            </p>

            <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <h2 className="font-serif text-4xl leading-none tracking-[-0.06em] sm:text-6xl">
                A good gift starts
                <br className="hidden sm:block" /> with knowing them.
              </h2>
              <p className="max-w-sm text-sm leading-6 text-[#17382c]/60">
                Little details, useful luxuries and unexpected favourites.
                Start with the person and let the perfect find follow.
              </p>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <a
                  href="#bestsellers"
                  key={collection.title}
                  className="group relative min-h-[370px] overflow-hidden bg-[#dce3d8] sm:min-h-[440px]"
                >
                  <img
                    src={collection.image}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#10291e]/80 via-transparent to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                    <h3 className="font-serif text-3xl sm:text-4xl">
                      {collection.title}
                    </h3>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-white/75">
                      {collection.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em]">
                      Explore collection
                      <ArrowRight
                        size={15}
                        className="transition group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Products supplied by the existing storefront */}
        <section
          id="bestsellers"
          className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-24"
        >
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a33e32]">
                Good things, gathered
              </p>
              <h2 className="mt-3 font-serif text-4xl tracking-[-0.06em] sm:text-6xl">
                Seasonal favourites.
              </h2>
            </div>

            <button
              type="button"
              onClick={handleShopAll}
              className="inline-flex min-h-11 items-center gap-3 self-start text-sm font-semibold"
            >
              Shop everything <ArrowRight size={17} />
            </button>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="mt-9 border border-dashed border-[#17382c]/20 px-6 py-16 text-center">
              <ShoppingBag
                className="mx-auto text-[#17382c]/40"
                size={28}
              />
              <h3 className="mt-4 font-serif text-2xl">
                {search
                  ? "No matching products."
                  : "Your seasonal edit is on its way."}
              </h3>
              <p className="mt-2 text-sm text-[#17382c]/55">
                {search
                  ? "Try another search term."
                  : "Products added to your store will appear here."}
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {visibleProducts.map((product, index) => {
                const id = String(product.id);
                const productImage = getProductImage(product);
                const isWishlisted = wishlist.includes(id);

                return (
                  <article key={id} className="group min-w-0">
                    <div
                      className={`relative overflow-hidden bg-[#e9e4d9] ${
                        index % 4 === 1 ? "rounded-t-[45%]" : "rounded-sm"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onProduct(product)}
                        className="block w-full text-left"
                        aria-label={`View ${product.name}`}
                      >
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={product.name}
                            loading="lazy"
                            className="aspect-[0.79] w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex aspect-[0.79] flex-col items-center justify-center gap-3 text-[#17382c]/40">
                            <Gift size={28} />
                            <span className="text-[9px] uppercase tracking-widest">
                              Image coming soon
                            </span>
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleWishlist(id)}
                        aria-label={
                          isWishlisted
                            ? `Remove ${product.name} from wishlist`
                            : `Add ${product.name} to wishlist`
                        }
                        aria-pressed={isWishlisted}
                        className={`absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur sm:right-3 sm:top-3 ${
                          isWishlisted
                            ? "bg-[#a33e32] text-white"
                            : "bg-[#f8f6ef]/90 text-[#17382c]"
                        }`}
                      >
                        <Heart
                          size={17}
                          fill={isWishlisted ? "currentColor" : "none"}
                        />
                      </button>

                      {index === 0 && (
                        <span className="absolute left-2 top-2 bg-[#f8f1e3] px-2 py-1.5 text-[8px] font-bold uppercase tracking-widest sm:left-3 sm:top-3">
                          Seasonal pick
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onProduct(product)}
                      className="mt-3 block w-full text-left"
                    >
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-[#17382c]/45">
                        {product.category || "The festive edit"}
                      </p>
                      <h3 className="mt-1.5 line-clamp-2 min-h-10 text-sm font-medium leading-5 sm:text-base">
                        {product.name}
                      </h3>
                    </button>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {formatPrice(
                          Number(product.price),
                          product.currency || currency,
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => onAdd(product)}
                        aria-label={`Add ${product.name} to bag`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#17382c]/20 transition hover:bg-[#17382c] hover:text-white"
                      >
                        <ShoppingBag size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Brand story */}
        <section id="our-story" className="bg-[#17382c] text-[#f8f1e3]">
          <div className="mx-auto grid max-w-[1400px] lg:grid-cols-2">
            <div className="flex flex-col justify-center px-6 py-14 sm:px-12 sm:py-20 lg:px-16">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d5bd86]">
                A note from us
              </p>
              <h2 className="mt-4 max-w-xl font-serif text-4xl leading-none tracking-[-0.06em] sm:text-6xl">
                The best gifts say, “I thought of you.”
              </h2>
              <p className="mt-6 max-w-lg text-sm leading-7 text-white/65 sm:text-base sm:leading-8">
                We believe shopping should feel considered, not overwhelming.
                Discover useful finds and lovely little luxuries in one place,
                so finding something meaningful becomes part of the celebration.
              </p>
              <button
                type="button"
                onClick={handleShopAll}
                className="mt-8 inline-flex min-h-12 items-center gap-3 self-start border-b border-[#d5bd86]/60 pb-1 text-sm font-semibold"
              >
                Find your next favourite <ArrowRight size={16} />
              </button>
            </div>

            <div className="relative min-h-[300px] overflow-hidden sm:min-h-[430px]">
              <img
                src="https://images.unsplash.com/photo-1513883049090-d0b7439799bf?auto=format&fit=crop&w=1200&q=85"
                alt="Thoughtfully wrapped gifts"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-serif text-2xl">
              {brandName || "Evergreen & Co."}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#17382c]/45">
              Good things, thoughtfully found.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-xs text-[#17382c]/60">
            <a href="#collections">Collections</a>
            <a href="#bestsellers">Shop</a>
            <button type="button" onClick={onCart}>
              Your bag ({cartCount})
            </button>
            <span>
              © {new Date().getFullYear()} {brandName || "Evergreen & Co."}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
