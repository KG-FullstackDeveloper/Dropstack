import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  UserRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type TouchEvent,
} from "react";
import { useParams } from "react-router-dom";

import Checkout from "./Checkout";
import OrderSuccess from "./OrderSuccess";

import type { Product } from "../types/product";
import type { MarketInfo } from "../types/market";
import type { CartItem } from "../types/cart";
import type { StoreConfig } from "../types/store";

import { DEFAULT_STORE_CONFIG } from "../themes/registry";
import {
  getProducts,
  getStoreConfig,
} from "../services/api";
import { detectMarket } from "../services/market";
import {
  addToCart,
  getCart,
  getCartSummary,
  removeCartItem,
  saveCart,
  updateCartItem,
} from "../utils/cart";
import { formatCurrency } from "../utils/currency";
import { getDeliveryTime } from "../utils/shipping";

type Page =
  | "home"
  | "catalog"
  | "contact"
  | "product"
  | "cart"
  | "checkout"
  | "order-success";

type DemoProduct = Product & {
  image_url?: string;
  mobile_image_url?: string;
  inventory?: number;
  active?: number;
};

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: "demo-gel-cleanser",
    storeId: "skincare-store",
    name: "Cloud Cleanser",
    description: "A soft, low-foam cleanser for a calm daily reset.",
    price: 28,
    currency: "USD",
    image_url:
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1100&q=82",
    category: "Cleansers",
    inventory: 18,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-barrier-serum",
    storeId: "skincare-store",
    name: "Barrier Serum",
    description: "A silky serum built around hydration and barrier care.",
    price: 42,
    currency: "USD",
    image_url:
      "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=1100&q=82",
    category: "Serums",
    inventory: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-daily-cream",
    storeId: "skincare-store",
    name: "Daily Veil Cream",
    description: "A weightless cream that leaves skin soft, plush and fresh.",
    price: 36,
    currency: "USD",
    image_url:
      "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=1100&q=82",
    category: "Moisturisers",
    inventory: 24,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-vitamin-c",
    storeId: "skincare-store",
    name: "Morning C Drops",
    description: "A brightening step for a clear, luminous-looking routine.",
    price: 48,
    currency: "USD",
    image_url:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1100&q=82",
    category: "Treatments",
    inventory: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-spf",
    storeId: "skincare-store",
    name: "Daily Screen SPF 40",
    description: "An easy final step with a clean, comfortable finish.",
    price: 31,
    currency: "USD",
    image_url:
      "https://images.unsplash.com/photo-1556229010-aa3e9850f4e1?auto=format&fit=crop&w=1100&q=82",
    category: "SPF",
    inventory: 16,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-night-oil",
    storeId: "skincare-store",
    name: "Night Recovery Oil",
    description: "A richer evening ritual for skin that likes comfort.",
    price: 46,
    currency: "USD",
    image_url:
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1100&q=82",
    category: "Treatments",
    inventory: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const CONCERNS = [
  {
    title: "Hydrate",
    note: "For dry, tight-feeling skin",
    image:
      "https://images.unsplash.com/photo-1600428877878-1a0e155185d6?auto=format&fit=crop&w=1200&q=82",
  },
  {
    title: "Brighten",
    note: "For dull, uneven-looking skin",
    image:
      "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1200&q=82",
  },
  {
    title: "Balance",
    note: "For oily and blemish-prone skin",
    image:
      "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1200&q=82",
  },
  {
    title: "Soothe",
    note: "For sensitive, reactive skin",
    image:
      "https://images.unsplash.com/photo-1611930021593-2f3d2b5c8c27?auto=format&fit=crop&w=1200&q=82",
  },
];

const INGREDIENTS = [
  ["Niacinamide", "Balance"],
  ["Hyaluronic acid", "Hydrate"],
  ["Ceramides", "Support"],
  ["Vitamin C", "Brighten"],
];

function getImage(product: Product, fallbackIndex = 0) {
  const candidate = product as DemoProduct;

  if (candidate.image_url) {
    return candidate.image_url;
  }

  const fallbacks = [
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1100&q=82",
    "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=1100&q=82",
    "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=1100&q=82",
  ];

  return fallbacks[fallbackIndex % fallbacks.length];
}

function getImages(product: Product) {
  const candidate = product as DemoProduct & {
    images?: string[];
    image_urls?: string[];
  };

  const all = [
    ...(candidate.images ?? []),
    ...(candidate.image_urls ?? []),
    candidate.image_url ?? getImage(product),
  ];

  return Array.from(new Set(all.filter(Boolean)));
}

function getDelivery(product: Product) {
  const value = (product as DemoProduct & { delivery_time?: string }).delivery_time;
  return typeof value === "string" && value.trim() ? value : "3–5 days";
}

function getStock(product: Product) {
  const value = (product as DemoProduct).inventory;
  return typeof value === "number" ? value : 12;
}

function storeBrand(store: StoreConfig, slug?: string) {
  if ((slug ?? "").toLowerCase() === "skincare-store") {
    return "Luma Skin";
  }

  return store.name || "Luma Skin";
}

function storeTagline(store: StoreConfig, slug?: string) {
  if ((slug ?? "").toLowerCase() === "skincare-store") {
    return "Skincare for skin, not trends.";
  }

  return store.description || "Considered skincare for everyday skin.";
}

export default function Store() {
  const { slug } = useParams<{ slug: string }>();

  const [store, setStore] = useState<StoreConfig>(
    DEFAULT_STORE_CONFIG,
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [market, setMarket] = useState<MarketInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>("home");
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderState, setOrderState] = useState<{
    product?: Product;
    country?: string;
    currency?: string;
    shippingFee?: number;
    deliveryTime?: string;
    total?: number;
    customer?: {
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      postalCode: string;
    };
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadStore() {
      try {
        const [storeData, productData, marketData] =
          await Promise.all([
            getStoreConfig(),
            getProducts(),
            detectMarket(),
          ]);

        if (!mounted) return;

        setStore(storeData || DEFAULT_STORE_CONFIG);
        setProducts(productData || []);
        setMarket(marketData);
      } catch (error) {
        console.error("Unable to load storefront:", error);

        if (mounted) {
          setStore(DEFAULT_STORE_CONFIG);
          setProducts([]);
          try {
            setMarket(await detectMarket());
          } catch {
            setMarket(null);
          }
        }
      } finally {
        if (mounted) {
          setCart(getCart());
          setLoading(false);
        }
      }
    }

    void loadStore();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const syncCart = () => setCart(getCart());
    window.addEventListener("store-cart-updated", syncCart);

    return () => {
      window.removeEventListener("store-cart-updated", syncCart);
    };
  }, []);

  const brandName = storeBrand(store, slug);
  const tagline = storeTagline(store, slug);
  const activeCurrency = market?.currency || "USD";
  const activeCountry = market?.countryCode || "US";

  const displayProducts = useMemo<Product[]>(() => {
    const active = products.filter((product) => {
      const candidate = product as DemoProduct;
      return candidate.active === undefined || Boolean(candidate.active);
    });

    return active.length ? active : DEMO_PRODUCTS;
  }, [products]);

  const cartSummary = useMemo(
    () =>
      getCartSummary(
        cart,
        activeCountry,
        activeCurrency,
      ),
    [cart, activeCountry, activeCurrency],
  );

  function go(nextPage: Page) {
    setPage(nextPage);
    setMobileMenu(false);
    setCartOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setPage("product");
    setMobileMenu(false);
    setCartOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addProduct(product: Product) {
    const next = addToCart(cart, product, 1);
    setCart(next);
    saveCart(next);
    setCartOpen(true);
    setToast(`${product.name} added to bag`);

    window.setTimeout(() => setToast(""), 2200);
  }

  function changeQuantity(productId: string, quantity: number) {
    const next = updateCartItem(cart, productId, quantity);
    setCart(next);
    saveCart(next);
  }

  function removeProduct(productId: string) {
    const next = removeCartItem(cart, productId);
    setCart(next);
    saveCart(next);
  }

  function finishCheckout(
    completedOrderId: string,
    customer: {
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      postalCode: string;
    },
    total: number,
  ) {
    const single = cart.length === 1 ? cart[0].product : undefined;

    setOrderId(completedOrderId);
    setOrderState({
      product: single,
      country: activeCountry,
      currency: activeCurrency,
      shippingFee: cartSummary.shipping,
      deliveryTime: getDeliveryTime(activeCountry),
      total,
      customer,
    });

    setCart([]);
    saveCart([]);
    go("order-success");
  }

  if (page === "checkout") {
    return (
      <Checkout
        cart={cart}
        market={market}
        onBack={() => go("cart")}
        onComplete={finishCheckout}
      />
    );
  }

  if (page === "order-success") {
    return (
      <OrderSuccess
        orderId={orderId}
        orderState={orderState || undefined}
        onContinueShopping={() => go("catalog")}
        onBackHome={() => go("home")}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f6f1] text-[#1d1d19] pb-20 min-[641px]:pb-0">
      <TopBar />

      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f8f6f1]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1480px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <button
            type="button"
            onClick={() => go("home")}
            className="flex min-h-11 items-center gap-3"
            aria-label="Go to home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1d1d19] text-white">
              <Sparkles size={17} />
            </span>
            <span className="font-serif text-[25px] tracking-[-0.05em]">
              {brandName}
            </span>
          </button>

          <nav className="hidden items-center gap-9 min-[641px]:flex">
            <HeaderLink
              active={page === "home"}
              label="Home"
              onClick={() => go("home")}
            />
            <HeaderLink
              active={page === "catalog"}
              label="Catalog"
              onClick={() => go("catalog")}
            />
            <HeaderLink
              active={page === "contact"}
              label="Contact"
              onClick={() => go("contact")}
            />
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => go("catalog")}
              className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-black/5"
              aria-label="Search"
            >
              <Search size={19} strokeWidth={1.8} />
            </button>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-black/5"
              aria-label="Open cart"
            >
              <ShoppingBag size={19} strokeWidth={1.8} />
              {cartSummary.itemCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1d1d19] px-1 text-[10px] font-bold text-white">
                  {cartSummary.itemCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenu(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full min-[641px]:hidden"
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>
          </div>
        </div>
      </header>

      {mobileMenu && (
        <MobileMenu
          brandName={brandName}
          onNavigate={go}
          onClose={() => setMobileMenu(false)}
        />
      )}

      {toast && (
        <div className="fixed right-4 top-24 z-[90] rounded-full bg-[#1d1d19] px-5 py-3 text-sm font-semibold text-white shadow-2xl">
          {toast}
        </div>
      )}

      {page === "home" && (
        <HomePage
          products={displayProducts}
          loading={loading}
          brandName={brandName}
          tagline={tagline}
          onCatalog={() => go("catalog")}
          onProduct={openProduct}
          onAdd={addProduct}
        />
      )}

      {page === "catalog" && (
        <CatalogPage
          products={displayProducts}
          currency={activeCurrency}
          onProduct={openProduct}
          onAdd={addProduct}
        />
      )}

      {page === "product" && selectedProduct && (
        <ProductPage
          product={selectedProduct}
          products={displayProducts}
          currency={activeCurrency}
          onBack={() => go("catalog")}
          onProduct={openProduct}
          onAdd={addProduct}
        />
      )}

      {page === "cart" && (
        <CartPage
          cart={cart}
          currency={activeCurrency}
          summary={cartSummary}
          onBack={() => go("catalog")}
          onQuantity={changeQuantity}
          onRemove={removeProduct}
          onCheckout={() => go("checkout")}
        />
      )}

      {page === "contact" && <ContactPage brandName={brandName} />}

      <footer className="border-t border-black/10 bg-[#1d1d19] text-white">
        <div className="mx-auto grid max-w-[1480px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-10 lg:py-16">
          <div>
            <div className="font-serif text-3xl tracking-[-0.05em]">
              {brandName}
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">
              {tagline}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
              Explore
            </p>
            <div className="mt-4 grid gap-1">
              <FooterLink label="Home" onClick={() => go("home")} />
              <FooterLink label="Catalog" onClick={() => go("catalog")} />
              <FooterLink label="Contact" onClick={() => go("contact")} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
              Ritual
            </p>
            <div className="mt-4 grid gap-1">
              <FooterLink label="Skin quiz" onClick={() => go("home")} />
              <FooterLink label="Ingredients" onClick={() => go("home")} />
              <FooterLink label="Shipping" onClick={() => go("contact")} />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/35">
          © {new Date().getFullYear()} {brandName}
        </div>
      </footer>

      <CartPanel
        open={cartOpen}
        cart={cart}
        currency={activeCurrency}
        summary={cartSummary}
        onClose={() => setCartOpen(false)}
        onQuantity={changeQuantity}
        onRemove={removeProduct}
        onCheckout={() => {
          setCartOpen(false);
          go("checkout");
        }}
        onContinue={() => {
          setCartOpen(false);
          go("catalog");
        }}
      />

      <MobileBottomBar
        page={page}
        cartCount={cartSummary.itemCount}
        onShop={() => go("catalog")}
        onSearch={() => go("catalog")}
        onCart={() => setCartOpen(true)}
        onAccount={() => go("contact")}
      />
    </div>
  );
}

function TopBar() {
  return (
    <div className="bg-[#1d1d19] px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white min-[641px]:py-3">
      Complimentary shipping on orders over $75
    </div>
  );
}

function HeaderLink({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 border-b-2 px-1 text-sm font-medium transition ${
        active
          ? "border-[#1d1d19] text-[#1d1d19]"
          : "border-transparent text-black/50 hover:text-black"
      }`}
    >
      {label}
    </button>
  );
}

function MobileMenu({
  brandName,
  onNavigate,
  onClose,
}: {
  brandName: string;
  onNavigate: (page: Page) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-[#f8f6f1] min-[641px]:hidden">
      <div className="flex h-20 items-center justify-between border-b border-black/10 px-5">
        <span className="font-serif text-2xl">{brandName}</span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5"
          aria-label="Close menu"
        >
          <X size={21} />
        </button>
      </div>

      <nav className="flex flex-col px-5 py-8">
        {[
          ["Home", "home"],
          ["Catalog", "catalog"],
          ["Contact", "contact"],
        ].map(([label, value]) => (
          <button
            key={value}
            type="button"
            onClick={() => onNavigate(value as Page)}
            className="flex min-h-16 items-center justify-between border-b border-black/10 text-left font-serif text-3xl"
          >
            {label}
            <ArrowRight size={22} />
          </button>
        ))}
      </nav>

      <div className="mx-5 rounded-3xl bg-[#e6dfd6] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
          Your routine
        </p>
        <p className="mt-3 max-w-xs font-serif text-2xl leading-tight">
          Start with one product. Build slowly.
        </p>
        <button
          type="button"
          onClick={() => onNavigate("catalog")}
          className="mt-5 min-h-11 rounded-full bg-[#1d1d19] px-5 text-sm font-semibold text-white"
        >
          Shop skincare
        </button>
      </div>
    </div>
  );
}

function HomePage({
  products,
  loading,
  brandName,
  tagline,
  onCatalog,
  onProduct,
  onAdd,
}: {
  products: Product[];
  loading: boolean;
  brandName: string;
  tagline: string;
  onCatalog: () => void;
  onProduct: (product: Product) => void;
  onAdd: (product: Product) => void;
}) {
  return (
    <main>
      <section className="relative overflow-hidden bg-[#ddd5cc]">
        <div className="mx-auto grid max-w-[1480px] min-[1025px]:min-h-[700px] min-[1025px]:grid-cols-[0.93fr_1.07fr]">
          <div className="order-2 flex flex-col justify-center px-5 py-12 sm:px-8 sm:py-16 min-[1025px]:order-1 min-[1025px]:px-12 min-[1025px]:py-20 lg:px-16">
            <div className="mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/45">
              <Sparkles size={13} />
              New ritual
            </div>

            <h1 className="max-w-xl font-serif text-[clamp(3.2rem,8vw,6.8rem)] leading-[0.88] tracking-[-0.065em]">
              Beautiful skin,
              <br />
              <i className="font-normal">made simple.</i>
            </h1>

            <p className="mt-7 max-w-md text-base leading-7 text-black/58 min-[1025px]:text-lg">
              {tagline}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCatalog}
                className="min-h-12 rounded-full bg-[#1d1d19] px-7 text-sm font-semibold text-white transition hover:bg-black"
              >
                Shop the collection
              </button>

              <button
                type="button"
                onClick={onCatalog}
                className="min-h-12 rounded-full border border-black/15 bg-white/35 px-7 text-sm font-semibold transition hover:bg-white"
              >
                Explore ingredients
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 border-t border-black/10 pt-5 text-[10px] font-semibold uppercase tracking-[0.17em] text-black/40">
              <span>Barrier first</span>
              <span>Simple routines</span>
              <span>Thoughtful formulas</span>
            </div>
          </div>

          <div className="order-1 relative min-h-[430px] overflow-hidden sm:min-h-[520px] min-[1025px]:order-2 min-[1025px]:min-h-full">
            <img
              src={getImage(products[1] ?? products[0])}
              alt="Luma Skin skincare products"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/5" />

            <div className="absolute bottom-5 left-5 rounded-full bg-white/85 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur sm:bottom-7 sm:left-7">
              Daily essentials
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 sm:py-16 min-[1025px]:px-10 min-[1025px]:py-24">
        <div className="mx-auto max-w-[1380px]">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                Shop by concern
              </p>
              <h2 className="mt-3 max-w-2xl font-serif text-4xl leading-none tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                Your skin, your starting point.
              </h2>
            </div>

            <button
              type="button"
              onClick={onCatalog}
              className="hidden min-h-11 items-center gap-2 text-sm font-semibold min-[641px]:flex"
            >
              Browse all <ArrowRight size={17} />
            </button>
          </div>

          <div className="mt-9 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[641px]:grid min-[641px]:grid-cols-2 min-[1025px]:grid-cols-4">
            {CONCERNS.map((concern) => (
              <button
                key={concern.title}
                type="button"
                onClick={onCatalog}
                className="group relative min-w-[78%] snap-start overflow-hidden rounded-[2rem] text-left min-[641px]:min-w-0"
              >
                <div className="aspect-[0.82] overflow-hidden bg-[#ece6df]">
                  <img
                    src={concern.image}
                    alt={concern.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/88 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-2xl leading-none">
                        {concern.title}
                      </h3>
                      <p className="mt-2 text-xs text-black/48">
                        {concern.note}
                      </p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1d1d19] text-white">
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#ece8e1] px-5 py-14 sm:px-8 sm:py-16 min-[1025px]:px-10 min-[1025px]:py-24">
        <div className="mx-auto max-w-[1380px]">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                The edit
              </p>
              <h2 className="mt-3 font-serif text-4xl leading-none tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                The essentials.
              </h2>
            </div>

            <button
              type="button"
              onClick={onCatalog}
              className="hidden min-h-11 items-center gap-2 text-sm font-semibold min-[641px]:flex"
            >
              View catalog <ArrowRight size={17} />
            </button>
          </div>

          <div className="mt-9 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[641px]:grid min-[641px]:grid-cols-2 min-[1025px]:grid-cols-3">
            {loading && products.length === 0
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="min-w-[80%] snap-start min-[641px]:min-w-0"
                  >
                    <div className="aspect-[0.92] animate-pulse rounded-[2rem] bg-black/5" />
                  </div>
                ))
              : products.slice(0, 3).map((product, index) => (
                  <div
                    key={product.id}
                    className="min-w-[80%] snap-start min-[641px]:min-w-0"
                  >
                    <ProductCard
                      product={product}
                      index={index}
                      onProduct={onProduct}
                      onAdd={onAdd}
                    />
                  </div>
                ))}
          </div>
        </div>
      </section>

      <section className="bg-[#dfe6db] px-5 py-14 sm:px-8 sm:py-16 min-[1025px]:px-10 min-[1025px]:py-24">
        <div className="mx-auto grid max-w-[1380px] gap-10 min-[1025px]:grid-cols-[0.75fr_1.25fr] min-[1025px]:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
              Inside the formula
            </p>
            <h2 className="mt-3 max-w-xl font-serif text-4xl leading-none tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Good ingredients. Clear purpose.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-black/52">
              Nothing to decode. Each ingredient has a job and each step earns its place.
            </p>
            <button
              type="button"
              onClick={onCatalog}
              className="mt-7 min-h-12 rounded-full bg-[#1d1d19] px-6 text-sm font-semibold text-white"
            >
              Shop the edit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {INGREDIENTS.map(([name, purpose], index) => (
              <div
                key={name}
                className="rounded-[1.7rem] border border-black/10 bg-white/55 p-5 min-[1025px]:p-6"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/30">
                  0{index + 1}
                </span>
                <h3 className="mt-9 font-serif text-2xl leading-none">
                  {name}
                </h3>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-black/40">
                  {purpose}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 sm:py-16 min-[1025px]:px-10 min-[1025px]:py-24">
        <div className="mx-auto grid max-w-[1380px] overflow-hidden rounded-[2rem] bg-[#1d1d19] text-white min-[1025px]:grid-cols-2">
          <div className="relative min-h-[360px] sm:min-h-[500px]">
            <img
              src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=82"
              alt="Minimal skincare ritual"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/38">
              A slower approach
            </p>
            <h2 className="mt-4 max-w-lg font-serif text-4xl leading-none tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Less noise. Better rituals.
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-white/55">
              Build a routine you can actually keep. Start with the basics, then add only what your skin needs.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCatalog}
                className="min-h-12 rounded-full bg-white px-6 text-sm font-semibold text-[#1d1d19]"
              >
                Shop skincare
              </button>
              <button
                type="button"
                onClick={onCatalog}
                className="min-h-12 rounded-full border border-white/15 px-6 text-sm font-semibold text-white"
              >
                See the routine
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 px-5 py-14 sm:px-8 min-[1025px]:px-10 min-[1025px]:py-20">
        <div className="mx-auto max-w-[1380px]">
          <div className="flex items-center gap-2 text-[#857a6d]">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} size={15} fill="currentColor" />
            ))}
          </div>
          <blockquote className="mt-7 max-w-4xl font-serif text-3xl leading-[1.03] tracking-[-0.04em] sm:text-4xl lg:text-5xl">
            “The whole routine feels considered. Nothing is shouting for attention, and my skin feels better for it.”
          </blockquote>
          <p className="mt-5 text-sm text-black/40">
            Verified customer
          </p>
        </div>
      </section>
    </main>
  );
}

function CatalogPage({
  products,
  currency,
  onProduct,
  onAdd,
}: {
  products: Product[];
  currency: string;
  onProduct: (product: Product) => void;
  onAdd: (product: Product) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.category)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);

      const matchesCategory =
        category === "all" || product.category === category;

      return matchesQuery && matchesCategory;
    });
  }, [products, search, category]);

  return (
    <main>
      <section className="border-b border-black/10 bg-[#e8e0d8] px-5 py-12 sm:px-8 sm:py-16 min-[1025px]:px-10 min-[1025px]:py-20">
        <div className="mx-auto max-w-[1380px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
            Catalog
          </p>
          <div className="mt-4 flex flex-col gap-5 min-[1025px]:flex-row min-[1025px]:items-end min-[1025px]:justify-between">
            <h1 className="max-w-3xl font-serif text-5xl leading-[0.9] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              The collection.
            </h1>
            <p className="max-w-md text-base leading-7 text-black/52">
              A focused edit of everyday skincare, from first cleanse to final step.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1380px] px-5 py-8 sm:px-8 min-[1025px]:px-10 min-[1025px]:py-12">
        <div className="flex flex-col gap-3 rounded-[1.7rem] bg-white p-3 sm:flex-row sm:items-center">
          <label className="relative flex min-h-12 flex-1 items-center">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 text-black/35"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search the collection"
              className="h-12 w-full rounded-full bg-[#f4f1eb] pl-11 pr-4 text-base outline-none placeholder:text-black/35"
            />
          </label>

          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`min-h-11 shrink-0 rounded-full px-5 text-sm font-semibold ${
                category === "all"
                  ? "bg-[#1d1d19] text-white"
                  : "bg-[#f4f1eb] text-black/55"
              }`}
            >
              All
            </button>
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`min-h-11 shrink-0 rounded-full px-5 text-sm font-semibold ${
                  category === item
                    ? "bg-[#1d1d19] text-white"
                    : "bg-[#f4f1eb] text-black/55"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">
              {filtered.length} products
            </p>
            <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em]">
              Shop all
            </h2>
          </div>
          <span className="text-sm text-black/35">{currency}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-black/15 px-6 py-20 text-center">
            <h2 className="font-serif text-3xl">Nothing found.</h2>
            <p className="mt-3 text-sm text-black/45">
              Try another search or choose another category.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 min-[1025px]:grid-cols-4">
            {filtered.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onProduct={onProduct}
                onAdd={onAdd}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ProductCard({
  product,
  index,
  onProduct,
  onAdd,
}: {
  product: Product;
  index: number;
  onProduct: (product: Product) => void;
  onAdd: (product: Product) => void;
}) {
  const [liked, setLiked] = useState(false);
  const stock = getStock(product);

  return (
    <article className="group min-w-0">
      <div className="relative overflow-hidden rounded-[1.7rem] bg-[#eee7df]">
        <button
          type="button"
          onClick={() => onProduct(product)}
          className="block min-h-11 w-full text-left"
          aria-label={`View ${product.name}`}
        >
          <img
            src={getImage(product, index)}
            alt={product.name}
            loading="lazy"
            className="aspect-[0.86] w-full object-cover transition duration-700 sm:group-hover:scale-105"
          />
        </button>

        <button
          type="button"
          onClick={() => setLiked((value) => !value)}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/88 backdrop-blur"
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
        </button>

        {stock <= 8 && stock > 0 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/88 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] backdrop-blur">
            Almost gone
          </span>
        )}
      </div>

      <div className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => onProduct(product)}
            className="min-h-11 flex-1 text-left"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/35">
              {product.category || "Skincare"}
            </p>
            <h3 className="mt-2 text-base font-semibold leading-tight">
              {product.name}
            </h3>
          </button>

          <span className="shrink-0 text-base font-semibold">
            {formatCurrency(product.price, product.currency || "USD")}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-black/45">
          {product.description}
        </p>

        <button
          type="button"
          onClick={() => onAdd(product)}
          className="mt-4 min-h-11 w-full rounded-full border border-black/10 bg-white text-sm font-semibold transition hover:bg-[#1d1d19] hover:text-white"
        >
          Add to bag
        </button>
      </div>
    </article>
  );
}

function ProductPage({
  product,
  products,
  currency,
  onBack,
  onProduct,
  onAdd,
}: {
  product: Product;
  products: Product[];
  currency: string;
  onBack: () => void;
  onProduct: (product: Product) => void;
  onAdd: (product: Product) => void;
}) {
  const images = getImages(product);
  const related = products
    .filter((item) => item.id !== product.id)
    .slice(0, 4);
  const [imageIndex, setImageIndex] = useState(0);
  const [subscribe, setSubscribe] = useState(false);
  const [openDetails, setOpenDetails] = useState<string | null>(null);
  const [galleryVisible, setGalleryVisible] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const galleryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!galleryRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setGalleryVisible(entry.isIntersecting),
      { threshold: 0.2 },
    );

    observer.observe(galleryRef.current);
    return () => observer.disconnect();
  }, []);

  function previousImage() {
    setImageIndex((index) =>
      index === 0 ? images.length - 1 : index - 1,
    );
  }

  function nextImage() {
    setImageIndex((index) =>
      index === images.length - 1 ? 0 : index + 1,
    );
  }

  function touchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function touchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;

    if (Math.abs(delta) > 45) {
      if (delta < 0) nextImage();
      else previousImage();
    }

    touchStartX.current = null;
  }

  return (
    <main>
      <section className="mx-auto max-w-[1380px] px-5 py-6 sm:px-8 sm:py-10 min-[1025px]:px-10 min-[1025px]:py-12">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-black/50"
        >
          <ChevronLeft size={17} />
          Back to catalog
        </button>

        <div className="grid gap-8 min-[1025px]:grid-cols-[1.05fr_0.95fr] min-[1025px]:gap-14">
          <div ref={galleryRef}>
            <div
              className="relative overflow-hidden rounded-[2rem] bg-[#eee7df]"
              onTouchStart={touchStart}
              onTouchEnd={touchEnd}
            >
              <img
                src={images[imageIndex] || getImage(product)}
                alt={product.name}
                className="aspect-[0.92] w-full object-cover sm:aspect-[0.94]"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previousImage}
                    className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 min-[641px]:flex"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={19} />
                  </button>

                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 min-[641px]:flex"
                    aria-label="Next image"
                  >
                    <ChevronRight size={19} />
                  </button>

                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/18 px-3 py-2 backdrop-blur min-[641px]:hidden">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setImageIndex(index)}
                        className={`h-1.5 rounded-full transition-all ${
                          imageIndex === index
                            ? "w-5 bg-white"
                            : "w-1.5 bg-white/55"
                        }`}
                        aria-label={`Show image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 hidden grid-cols-4 gap-3 min-[641px]:grid">
                {images.slice(0, 4).map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setImageIndex(index)}
                    className={`overflow-hidden rounded-2xl border-2 bg-[#eee7df] ${
                      imageIndex === index
                        ? "border-[#1d1d19]"
                        : "border-transparent"
                    }`}
                    aria-label={`Show image ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-[1025px]:sticky min-[1025px]:top-28 min-[1025px]:self-start">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">
              {product.category || "Skincare"}
            </p>

            <h1 className="mt-3 max-w-xl font-serif text-5xl leading-[0.92] tracking-[-0.06em] sm:text-6xl">
              {product.name}
            </h1>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex gap-1 text-[#8a7c6d]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={14} fill="currentColor" />
                ))}
              </div>
              <span className="text-xs text-black/40">
                4.9 · 148 reviews
              </span>
            </div>

            <div className="mt-6 text-xl font-semibold">
              {formatCurrency(product.price, currency)}
            </div>

            <p className="mt-5 max-w-xl text-base leading-7 text-black/55">
              {product.description}
            </p>

            <div className="mt-7 rounded-[1.5rem] border border-black/10 bg-white p-4">
              <button
                type="button"
                onClick={() => setSubscribe((value) => !value)}
                className="flex min-h-11 w-full items-center justify-between gap-5 text-left"
              >
                <div>
                  <p className="text-sm font-semibold">
                    Subscribe & save 10%
                  </p>
                  <p className="mt-1 text-xs leading-5 text-black/42">
                    Flexible delivery. Skip when you need to.
                  </p>
                </div>

                <span
                  className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition ${
                    subscribe ? "bg-[#1d1d19]" : "bg-black/10"
                  }`}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white shadow-sm transition ${
                      subscribe ? "translate-x-5" : ""
                    }`}
                  />
                </span>
              </button>
            </div>

            <div className="mt-6 grid gap-2.5 text-sm text-black/55">
              <div className="flex min-h-11 items-center gap-3">
                <Check size={16} />
                Thoughtful, ingredient-led formula
              </div>
              <div className="flex min-h-11 items-center gap-3">
                <Check size={16} />
                Designed for a simple routine
              </div>
              <div className="flex min-h-11 items-center gap-3">
                <Check size={16} />
                Secure checkout
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAdd(product)}
              disabled={getStock(product) === 0}
              className="mt-7 hidden min-h-[54px] w-full rounded-full bg-[#1d1d19] text-base font-semibold text-white min-[641px]:block disabled:cursor-not-allowed disabled:opacity-40"
            >
              {getStock(product) === 0
                ? "Sold out"
                : subscribe
                  ? "Add to subscription"
                  : "Add to bag"}
            </button>

            <div className="mt-4 flex flex-col gap-2 border-t border-black/10 pt-4 text-sm text-black/40 min-[641px]:flex-row min-[641px]:justify-between">
              <span>
                {getStock(product) > 0
                  ? `${getStock(product)} available`
                  : "Currently unavailable"}
              </span>
              <span>
                Delivery {getDelivery(product)}
              </span>
            </div>

            <div className="mt-5 border-t border-black/10">
              <Accordion
                title="Ingredients"
                open={openDetails === "ingredients"}
                onToggle={() =>
                  setOpenDetails((current) =>
                    current === "ingredients" ? null : "ingredients",
                  )
                }
              >
                <p>
                  Ingredient details will appear here as product data is completed.
                </p>
              </Accordion>

              <Accordion
                title="Why it works"
                open={openDetails === "works"}
                onToggle={() =>
                  setOpenDetails((current) =>
                    current === "works" ? null : "works",
                  )
                }
              >
                <p>
                  The formula is designed around a clear purpose, with ingredients chosen to fit a consistent daily routine.
                </p>
              </Accordion>

              <Accordion
                title="How to use"
                open={openDetails === "use"}
                onToggle={() =>
                  setOpenDetails((current) =>
                    current === "use" ? null : "use",
                  )
                }
              >
                <p>
                  Follow the product directions and introduce new actives gradually.
                </p>
              </Accordion>

              <Accordion
                title="Shipping & returns"
                open={openDetails === "shipping"}
                onToggle={() =>
                  setOpenDetails((current) =>
                    current === "shipping" ? null : "shipping",
                  )
                }
              >
                <p>
                  Delivery estimates are shown for your detected market. Store policies apply to returns and refunds.
                </p>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-black/10 bg-[#ece8e1] px-5 py-14 sm:px-8 min-[1025px]:px-10 min-[1025px]:py-20">
          <div className="mx-auto max-w-[1380px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
              Complete the ritual
            </p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-0.05em] sm:text-5xl">
              Pair it with the essentials.
            </h2>

            <div className="mt-8 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[641px]:grid min-[641px]:grid-cols-2 min-[1025px]:grid-cols-4">
              {related.map((item, index) => (
                <div
                  key={item.id}
                  className="min-w-[78%] snap-start min-[641px]:min-w-0"
                >
                  <ProductCard
                    product={item}
                    index={index}
                    onProduct={onProduct}
                    onAdd={onAdd}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!galleryVisible && getStock(product) > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-[88] border-t border-black/10 bg-[#f8f6f1]/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-10px_35px_rgba(20,20,16,0.12)] backdrop-blur-xl min-[641px]:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{product.name}</p>
              <p className="mt-1 text-base font-semibold">
                {formatCurrency(product.price, currency)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAdd(product)}
              className="min-h-12 shrink-0 rounded-full bg-[#1d1d19] px-5 text-sm font-semibold text-white"
            >
              Add to bag
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Accordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-black/10">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-16 w-full items-center justify-between text-left text-base font-semibold"
      >
        {title}
        <ChevronDown
          size={18}
          className={`transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-5 text-sm leading-6 text-black/50">
          {children}
        </div>
      )}
    </div>
  );
}

function CartPage({
  cart,
  currency,
  summary,
  onBack,
  onQuantity,
  onRemove,
  onCheckout,
}: {
  cart: CartItem[];
  currency: string;
  summary: {
    subtotal: number;
    shipping: number;
    total: number;
    itemCount: number;
  };
  onBack: () => void;
  onQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
}) {
  return (
    <main className="mx-auto max-w-[1380px] px-5 py-10 sm:px-8 sm:py-14 min-[1025px]:px-10 min-[1025px]:py-20">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">
        Your bag
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-[-0.06em] sm:text-6xl">
        {cart.length ? "Ready when you are." : "Your bag is empty."}
      </h1>

      {!cart.length ? (
        <button
          type="button"
          onClick={onBack}
          className="mt-8 min-h-12 rounded-full bg-[#1d1d19] px-6 text-sm font-semibold text-white"
        >
          Shop the collection
        </button>
      ) : (
        <div className="mt-10 grid gap-8 min-[1025px]:grid-cols-[1fr_390px]">
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-4 rounded-[1.6rem] bg-white p-4"
              >
                <img
                  src={getImage(item.product)}
                  alt={item.product.name}
                  loading="lazy"
                  className="h-28 w-24 shrink-0 rounded-2xl object-cover"
                />

                <div className="min-w-0 flex-1 py-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/35">
                        {item.product.category || "Skincare"}
                      </p>
                      <h2 className="mt-2 text-base font-semibold">
                        {item.product.name}
                      </h2>
                      <p className="mt-1 text-sm text-black/40">
                        {formatCurrency(
                          item.product.price,
                          item.product.currency || "USD",
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(item.product.id)}
                      className="min-h-11 min-w-11 rounded-full text-sm text-black/35 hover:bg-black/5"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onQuantity(
                          item.product.id,
                          Math.max(1, item.quantity - 1),
                        )
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onQuantity(
                          item.product.id,
                          item.quantity + 1,
                        )
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10"
                      aria-label="Increase quantity"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-[2rem] bg-[#1d1d19] p-6 text-white min-[1025px]:sticky min-[1025px]:top-28">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Order summary
            </p>
            <div className="mt-8 space-y-4 text-sm">
              <SummaryRow
                label="Subtotal"
                value={formatCurrency(summary.subtotal, currency)}
              />
              <SummaryRow
                label="Shipping"
                value={formatCurrency(summary.shipping, currency)}
              />
            </div>
            <div className="mt-6 border-t border-white/10 pt-5">
              <SummaryRow
                label="Total"
                value={formatCurrency(summary.total, currency)}
                large
              />
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="mt-7 min-h-14 w-full rounded-full bg-white text-sm font-semibold text-[#1d1d19]"
            >
              Continue to checkout
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}

function SummaryRow({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={large ? "font-semibold" : "text-white/45"}>
        {label}
      </span>
      <span className={large ? "text-xl font-bold" : "font-semibold"}>
        {value}
      </span>
    </div>
  );
}

function CartPanel({
  open,
  cart,
  currency,
  summary,
  onClose,
  onQuantity,
  onRemove,
  onCheckout,
  onContinue,
}: {
  open: boolean;
  cart: CartItem[];
  currency: string;
  summary: {
    subtotal: number;
    shipping: number;
    total: number;
    itemCount: number;
  };
  onClose: () => void;
  onQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  onContinue: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/35">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full"
        aria-label="Close cart"
      />

      <aside className="absolute bottom-0 right-0 flex h-[92vh] w-full flex-col rounded-t-[2rem] bg-[#f8f6f1] shadow-2xl min-[641px]:bottom-auto min-[641px]:top-0 min-[641px]:h-full min-[641px]:w-[430px] min-[641px]:rounded-none min-[641px]:rounded-l-[2rem]">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">
              Shopping bag
            </p>
            <h2 className="mt-1 font-serif text-3xl">
              {summary.itemCount} {summary.itemCount === 1 ? "item" : "items"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5"
            aria-label="Close cart"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {cart.length ? (
            <div className="space-y-5">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 border-b border-black/10 pb-5"
                >
                  <img
                    src={getImage(item.product)}
                    alt={item.product.name}
                    loading="lazy"
                    className="h-24 w-20 shrink-0 rounded-2xl object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">
                          {item.product.name}
                        </h3>
                        <p className="mt-1 text-sm text-black/42">
                          {formatCurrency(
                            item.product.price,
                            item.product.currency || currency,
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemove(item.product.id)}
                        className="min-h-11 min-w-11 rounded-full text-sm text-black/35"
                      >
                        ×
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onQuantity(
                            item.product.id,
                            Math.max(1, item.quantity - 1),
                          )
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onQuantity(
                            item.product.id,
                            item.quantity + 1,
                          )
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
              <ShoppingBag size={28} />
              <h3 className="mt-5 font-serif text-3xl">Your bag is empty.</h3>
              <p className="mt-3 max-w-xs text-sm leading-6 text-black/45">
                Start with one of the everyday essentials.
              </p>
              <button
                type="button"
                onClick={onContinue}
                className="mt-7 min-h-12 rounded-full bg-[#1d1d19] px-6 text-sm font-semibold text-white"
              >
                Shop skincare
              </button>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-black/10 bg-[#f8f6f1] p-5 pb-[max(20px,env(safe-area-inset-bottom))]">
            <SummaryRow
              label="Subtotal"
              value={formatCurrency(summary.subtotal, currency)}
            />
            <div className="mt-2">
              <SummaryRow
                label="Shipping"
                value={formatCurrency(summary.shipping, currency)}
              />
            </div>
            <div className="mt-4 border-t border-black/10 pt-4">
              <SummaryRow
                label="Total"
                value={formatCurrency(summary.total, currency)}
                large
              />
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="mt-5 min-h-14 w-full rounded-full bg-[#1d1d19] text-sm font-semibold text-white"
            >
              Checkout
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

function ContactPage({ brandName }: { brandName: string }) {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <main>
      <section className="bg-[#dfe6db] px-5 py-14 sm:px-8 sm:py-20 min-[1025px]:px-10 min-[1025px]:py-24">
        <div className="mx-auto grid max-w-[1380px] gap-10 min-[1025px]:grid-cols-[0.8fr_1.2fr] min-[1025px]:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
              Contact
            </p>
            <h1 className="mt-4 max-w-2xl font-serif text-5xl leading-[0.9] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Let’s talk skin.
            </h1>
          </div>
          <p className="max-w-xl text-base leading-7 text-black/52 lg:justify-self-end">
            Questions about a product, an order or building your routine? Reach {brandName} here.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1380px] gap-10 px-5 py-12 sm:px-8 sm:py-16 min-[1025px]:grid-cols-[0.7fr_1.3fr] min-[1025px]:px-10 min-[1025px]:py-24">
        <div>
          <div className="rounded-[2rem] bg-[#1d1d19] p-6 text-white sm:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Studio hours
            </p>
            <p className="mt-4 font-serif text-3xl">Mon — Fri</p>
            <p className="mt-2 text-sm text-white/48">09:00 — 17:00</p>
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-sm leading-6 text-white/52">
                Replies are handled during business hours.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="rounded-[2rem] border border-black/10 bg-white p-5 sm:p-8"
        >
          {sent ? (
            <div className="flex min-h-[430px] flex-col justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dfe6db]">
                <Check size={20} />
              </div>
              <h2 className="mt-5 font-serif text-4xl tracking-[-0.04em]">
                Message received.
              </h2>
              <p className="mt-3 max-w-md text-base leading-7 text-black/48">
                Thanks for reaching out. Your message has been captured for this storefront preview.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-7 min-h-12 w-fit rounded-full bg-[#1d1d19] px-6 text-sm font-semibold text-white"
              >
                Send another
              </button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">
                  Send a note
                </p>
                <h2 className="mt-3 font-serif text-4xl tracking-[-0.04em]">
                  How can we help?
                </h2>
              </div>

              <div className="mt-8 grid gap-5">
                <Field
                  label="Name"
                  value={name}
                  onChange={setName}
                  placeholder="Your name"
                />
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                />
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-black/65">
                    Message
                  </span>
                  <textarea
                    required
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={6}
                    className="w-full resize-none rounded-2xl border border-black/10 bg-[#f8f6f1] px-4 py-3 text-base outline-none focus:border-black/25"
                    placeholder="Tell us what you need help with"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="mt-7 min-h-14 w-full rounded-full bg-[#1d1d19] text-sm font-semibold text-white"
              >
                Send message
              </button>
            </>
          )}
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-black/65">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-black/10 bg-[#f8f6f1] px-4 text-base outline-none focus:border-black/25"
        placeholder={placeholder}
      />
    </label>
  );
}

function FooterLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center text-left text-sm text-white/58 hover:text-white"
    >
      {label}
    </button>
  );
}

function MobileBottomBar({
  page,
  cartCount,
  onShop,
  onSearch,
  onCart,
  onAccount,
}: {
  page: Page;
  cartCount: number;
  onShop: () => void;
  onSearch: () => void;
  onCart: () => void;
  onAccount: () => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[70] border-t border-black/10 bg-[#f8f6f1]/96 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(20,20,16,0.08)] backdrop-blur-xl min-[641px]:hidden">
      <div className="grid grid-cols-4">
        <MobileTab
          active={page === "catalog"}
          icon={<ShoppingBag size={19} />}
          label="Shop"
          onClick={onShop}
        />
        <MobileTab
          active={false}
          icon={<Search size={19} />}
          label="Search"
          onClick={onSearch}
        />
        <MobileTab
          active={page === "cart"}
          icon={<CartIcon count={cartCount} />}
          label="Cart"
          onClick={onCart}
        />
        <MobileTab
          active={page === "contact"}
          icon={<UserRound size={19} />}
          label="Account"
          onClick={onAccount}
        />
      </div>
    </nav>
  );
}

function MobileTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${
        active ? "text-[#1d1d19]" : "text-black/40"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function CartIcon({ count }: { count: number }) {
  return (
    <span className="relative">
      <ShoppingBag size={19} />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1d1d19] px-1 text-[9px] text-white">
          {count}
        </span>
      )}
    </span>
  );
}
