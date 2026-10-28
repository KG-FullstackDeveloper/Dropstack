
import { useEffect, useState } from "react";
import { ArrowRight, Menu, ShoppingBag, X, Truck, ShieldCheck, Headphones } from "lucide-react";

type ChristmasProduct = {
  id: string | number;
  name?: string;
  title?: string;
  price: number;
  image_url?: string;
  category?: string;
  description?: string;
  currency?: string;
};

type Props = {
  products: ChristmasProduct[];
  storeName?: string;
  currency?: string;
  onShop?: () => void;
  onProductClick?: (product: ChristmasProduct) => void;
  onAddToCart?: (product: ChristmasProduct) => void;
  onContact?: () => void;
  cartCount?: number;
};

export default function ChristmasStorefront({
  products,
  storeName = "Christmas Collection",
  currency = "USD",
  onShop,
  onProductClick,
  onAddToCart,
  onContact,
  cartCount = 0,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.title = `${storeName} | Holiday Collection`;
  }, [storeName]);

  const featuredProducts = products.slice(0, 4);

  const money = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(price) || 0);

  return (
    <main className="christmas-store min-h-screen bg-[#faf8f2] text-[#183c2d]">
      {/* Announcement bar */}
      <div className="bg-[#153c2c] px-4 py-2 text-center text-xs tracking-[0.12em] text-white sm:text-sm">
        THE HOLIDAY COLLECTION · MAKE THIS SEASON SPECIAL
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-[#e7e0d2] bg-[#faf8f2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            onClick={onShop}
            className="text-left text-xl font-semibold tracking-tight sm:text-2xl"
          >
            {storeName}
            <span className="ml-1 text-[#a47c40]">✳</span>
          </button>

          <nav className="hidden items-center gap-8 text-sm md:flex">
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              Home
            </button>
            <button onClick={onShop}>Shop</button>
            <button onClick={onContact}>Contact</button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onShop}
              className="relative rounded-full border border-[#d9d0be] p-3"
              aria-label="Shop and view cart"
            >
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#a47c40] px-1 text-xs text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-full border border-[#d9d0be] p-3 md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-4 border-t border-[#e7e0d2] px-6 py-5 md:hidden">
            <button onClick={() => { setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              Home
            </button>
            <button onClick={() => { setMenuOpen(false); onShop?.(); }}>
              Shop collection
            </button>
            <button onClick={() => { setMenuOpen(false); onContact?.(); }}>
              Contact us
            </button>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#153c2c] text-[#faf8f2]">
        <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-10 -top-14 h-64 w-64 rounded-full border border-white/10" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 sm:px-10 sm:py-28 lg:grid-cols-2 lg:py-32">
          <div className="relative z-10">
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-[#d9bd83]">
              A season worth celebrating
            </p>

            <h1 className="max-w-xl text-5xl font-light leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Make room for
              <span className="mt-2 block font-semibold italic text-[#dfc18b]">
                a little magic.
              </span>
            </h1>

            <p className="mt-7 max-w-md text-base leading-7 text-white/75">
              Thoughtfully chosen favourites to bring warmth, joy, and a little
              extra wonder to your holiday season.
            </p>

            <button
              onClick={onShop}
              className="mt-9 inline-flex items-center gap-3 bg-[#dfc18b] px-7 py-4 text-sm font-semibold text-[#183c2d] transition hover:bg-white"
            >
              Explore the collection <ArrowRight size={18} />
            </button>

            <p className="mt-8 text-xs tracking-wider text-white/55">
              DISCOVER SOMETHING SPECIAL THIS CHRISTMAS
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rotate-2 border border-[#dfc18b]/40" />
            <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden bg-[#244c39] sm:min-h-[440px]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#315a42] via-[#244c39] to-[#102d21]" />
              <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#dfc18b]/30 sm:h-80 sm:w-80" />
              <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#dfc18b]/20 sm:h-64 sm:w-64" />
              <div className="relative px-6 text-center">
                <span className="text-7xl text-[#dfc18b] sm:text-8xl">✳</span>
                <p className="mt-5 text-xs uppercase tracking-[0.35em] text-white/70">
                  Celebrate beautifully
                </p>
                <p className="mt-3 font-serif text-3xl italic text-white sm:text-4xl">
                  The Christmas Edit
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-[#e7e0d2] bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-7 sm:grid-cols-3 sm:px-10">
          <div className="flex items-center justify-center gap-3">
            <Truck className="text-[#a47c40]" size={22} />
            <div>
              <p className="text-sm font-semibold">Delivery information</p>
              <p className="text-xs text-gray-500">Check options at checkout</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <ShieldCheck className="text-[#a47c40]" size={22} />
            <div>
              <p className="text-sm font-semibold">Shop with confidence</p>
              <p className="text-xs text-gray-500">Clear order information</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Headphones className="text-[#a47c40]" size={22} />
            <div>
              <p className="text-sm font-semibold">We're here to help</p>
              <p className="text-xs text-gray-500">Contact us with questions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-24">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#a47c40]">
              Handpicked for the holidays
            </p>
            <h2 className="mt-3 font-serif text-4xl font-medium sm:text-5xl">
              The festive favourites
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-gray-600">
              Find something special for your celebrations, your home, or
              someone you love.
            </p>
          </div>

          <button
            onClick={onShop}
            className="inline-flex items-center gap-2 self-start border-b border-[#183c2d] pb-2 text-sm font-semibold sm:self-auto"
          >
            View all products <ArrowRight size={16} />
          </button>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <article key={product.id} className="group min-w-0">
                <button
                  onClick={() => onProductClick?.(product)}
                  className="block w-full overflow-hidden bg-[#eee9de] text-left"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name || product.title || "Store product"}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-500">
                        Image coming soon
                      </div>
                    )}
                  </div>
                </button>

                <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-[#a47c40]">
                  {product.category || "Holiday collection"}
                </p>

                <button
                  onClick={() => onProductClick?.(product)}
                  className="mt-2 block text-left text-sm font-semibold leading-5 hover:underline sm:text-base"
                >
                  {product.name || product.title || "Untitled product"}
                </button>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {money(product.price)}
                  </span>
                  <button
                    onClick={() => onAddToCart?.(product)}
                    className="text-xs font-semibold text-[#315a42] underline underline-offset-4 hover:text-[#a47c40]"
                  >
                    Add to bag
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[#d9d0be] px-6 py-16 text-center">
            <p className="font-serif text-2xl">Your collection is taking shape.</p>
            <p className="mt-3 text-sm text-gray-600">
              Add active products to this store and they'll appear here.
            </p>
            <button
              onClick={onShop}
              className="mt-6 bg-[#153c2c] px-6 py-3 text-sm font-semibold text-white"
            >
              Visit the shop
            </button>
          </div>
        )}
      </section>

      {/* Contact call to action */}
      <section className="bg-[#eee9de] px-6 py-16 text-center sm:py-20">
        <p className="text-xs uppercase tracking-[0.25em] text-[#a47c40]">
          Need a hand?
        </p>
        <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
          We're happy to help.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-600">
          Questions about a product, your delivery, or an order? Get in touch
          with our team.
        </p>
        <button
          onClick={onContact}
          className="mt-7 inline-flex items-center gap-3 bg-[#153c2c] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#28553e]"
        >
          Contact us <ArrowRight size={17} />
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-[#102d21] px-6 py-10 text-white sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 sm:flex-row sm:items-center">
          <div>
            <p className="font-serif text-xl">{storeName}</p>
            <p className="mt-2 text-xs text-white/60">
              Thoughtful finds for a season to remember.
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-white/75">
            <button onClick={onShop} className="hover:text-[#dfc18b]">Shop</button>
            <button onClick={onContact} className="hover:text-[#dfc18b]">Contact</button>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-white/15 pt-5 text-xs text-white/50">
          © {new Date().getFullYear()} {storeName}. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
