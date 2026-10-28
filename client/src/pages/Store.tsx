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
  Truck,
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
import { useLocation, useParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import Checkout from "./Checkout";
import OrderSuccess from "./OrderSuccess";
import LuxuryStorefront from "./LuxuryStorefront";

import type { Product, ProductVariant } from "../types/product";
import type { MarketInfo } from "../types/market";
import type { CartItem } from "../types/cart";
import type { StoreConfig } from "../types/store";

import { DEFAULT_STORE_CONFIG } from "../types/themes/registry";
import { getPublicStore, getStoreProducts } from "../services/api";
import { detectMarket } from "../services/market";
import {
  addToCart,
  getCart,
  getCartSummary,
  removeCartItem,
  saveCart,
  updateCartItem,
} from "../utils/cart";
import { convertCurrency, formatCurrency } from "../utils/currency";
import { getDeliveryTime } from "../utils/shipping";

const MAX_STANDARD_QUANTITY = 5;

type Page =
  | "home"
  | "catalog"
  | "contact"
  | "product"
  | "cart"
  | "checkout"
  | "order-success";

function getImage(product: Product, _fallbackIndex = 0) {
  return product.image_url || product.images?.[0] || "";
}

function getImages(product: Product) {
  return Array.from(
    new Set(
      [...(product.images ?? []), product.image_url ?? ""].filter(Boolean),
    ),
  );
}

function displayPrice(
  price: number,
  productCurrency: string | undefined,
  currency: string,
) {
  return formatCurrency(
    convertCurrency(price, productCurrency || "USD", currency),
    currency,
  );
}

function getDelivery(product: Product) {
  return (
    product.delivery_time?.trim() || "Delivery estimate provided at checkout"
  );
}

function getStock(product: Product, variant?: ProductVariant) {
  if (variant) {
    const stock = Number(variant.stock);
    return Number.isFinite(stock) && stock >= 0 ? stock : 0;
  }
  if (product.variants?.length) {
    return product.variants.reduce(
      (total, item) => total + Math.max(0, Number(item.stock) || 0),
      0,
    );
  }
  return typeof product.stock === "number" ? product.stock : 0;
}

function getSellingPrice(product: Product, variant?: ProductVariant) {
  if (product.price_override !== null && product.price_override !== undefined) {
    return Number(product.price_override) || 0;
  }

  if (variant && String(variant.price ?? "").trim() !== "") {
    const price = Number(variant.price);
    if (Number.isFinite(price) && price >= 0) return price;
  }
  return Number(product.price) || 0;
}

function getVariantLabel(variant: ProductVariant) {
  const name = String(variant.name ?? "").trim();
  const value = String(variant.value ?? "").trim();
  return name && value && name.toLowerCase() !== value.toLowerCase()
    ? `${name}: ${value}`
    : name || value || "Selected option";
}

function storeBrand(store: StoreConfig) {
  // Use the name saved for this store in Store Management.
  return store.name?.trim() || "My Store";
}

function storeTagline(store: StoreConfig) {
  // Use this store's own description.
  return store.description?.trim() || "Discover our collection.";
}

export default function Store() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const [store, setStore] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);
  const [products, setProducts] = useState<Product[]>([]);
  const [market, setMarket] = useState<MarketInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeLoadError, setStoreLoadError] = useState("");
  const [page, setPage] = useState<Page>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [bulkEnquiry, setBulkEnquiry] = useState<{
    product: Product;
    quantity: number;
  } | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(
    null,
  );
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
      setLoading(true);
      setStoreLoadError("");
      setSelectedProduct(null);

      try {
        if (!slug?.trim()) {
          throw new Error("A store slug is required to open this storefront.");
        }

        const [publicStore, storeProducts, marketData] = await Promise.all([
          getPublicStore(slug),
          getStoreProducts(slug),
          detectMarket(),
        ]);

        if (!mounted) return;

        // Keep the existing storefront theme defaults while applying the
        // identity returned for this specific store. Product data is never
        // loaded from the global /api/products endpoint here.
        
        // Convert the API's logo field into the storefront's logoUrl field.
        const publicStoreDetails = publicStore as unknown as {
          id?: string;
          name?: string | null;
          description?: string | null;
          logo_url?: string | null;
          logoUrl?: string | null;
        };

        setStore({
          ...DEFAULT_STORE_CONFIG,
          ...(publicStoreDetails.id
            ? { id: publicStoreDetails.id }
            : {}),
          name:
            publicStoreDetails.name || DEFAULT_STORE_CONFIG.name,
          description:
            publicStoreDetails.description ||
            DEFAULT_STORE_CONFIG.description,
          logoUrl:
            publicStoreDetails.logoUrl ||
            publicStoreDetails.logo_url ||
            DEFAULT_STORE_CONFIG.logoUrl,
        });

        setProducts(Array.isArray(storeProducts) ? storeProducts : []);
        setMarket(marketData);
        setStoreLoadError("");
      } catch (error) {
        console.error("Unable to load storefront:", error);

        if (mounted) {
          setStoreLoadError(
            error instanceof Error
              ? error.message
              : "We could not load this storefront. Please try again shortly.",
          );
          // Do not fall back to global products if a store lookup fails.
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
  }, [slug]);

  useEffect(() => {
    if ((location.state as { openCart?: boolean } | null)?.openCart) {
      setCart(getCart());
      setCartOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    const syncCart = () => setCart(getCart());
    window.addEventListener("store-cart-updated", syncCart);

    return () => {
      window.removeEventListener("store-cart-updated", syncCart);
    };
  }, []);

  const brandName = storeBrand(store);
  const tagline = storeTagline(store);
  const activeCurrency = market?.currency || "USD";
  const activeCountry = market?.countryCode || "US";

  const displayProducts = useMemo<Product[]>(() => {
    return products.filter((product) => Number(product.active) === 1);
  }, [products]);

  const cartSummary = useMemo(
    () => getCartSummary(cart, activeCountry, activeCurrency),
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

  function showBulkEnquiry(product: Product, requestedQuantity: number) {
    setBulkEnquiry({ product, quantity: requestedQuantity });
  }

  function addProduct(product: Product, variant?: ProductVariant) {
    if ((product.variants?.length ?? 0) > 0 && !variant) {
      openProduct(product);
      setToast("Choose an option before adding this product.");
      window.setTimeout(() => setToast(""), 2400);
      return;
    }

    const stock = getStock(product, variant);
    const existing = cart.find(
      (item) =>
        item.product.id === product.id &&
        item.variant_id === (variant?.id ?? undefined),
    );
    const requestedQuantity = (existing?.quantity ?? 0) + 1;

    if (requestedQuantity > MAX_STANDARD_QUANTITY) {
      showBulkEnquiry(product, requestedQuantity);
      setCartOpen(true);
      return;
    }
    if (stock <= 0) {
      setToast("This option is currently out of stock.");
      window.setTimeout(() => setToast(""), 2400);
      return;
    }
    if (requestedQuantity > stock) {
      setToast(`Only ${stock} available for this option.`);
      window.setTimeout(() => setToast(""), 2400);
      return;
    }

    const next = addToCart(cart, product, 1, variant);
    setCart(next);
    saveCart(next);
    setCartOpen(true);
    setToast(
      `${product.name}${variant ? ` · ${getVariantLabel(variant)}` : ""} added to bag`,
    );
    window.setTimeout(() => setToast(""), 2200);
  }

  function changeQuantity(
    productId: string,
    quantity: number,
    variantId?: string,
  ) {
    const item = cart.find(
      (cartItem) =>
        cartItem.product.id === productId && cartItem.variant_id === variantId,
    );
    if (item && quantity > MAX_STANDARD_QUANTITY) {
      showBulkEnquiry(item.product, quantity);
      return;
    }
    const stock = item
      ? item.variant_id
        ? Number(item.variant_stock)
        : getStock(item.product)
      : 0;
    if (item && quantity > stock) {
      setToast(`Only ${stock} available for this option.`);
      window.setTimeout(() => setToast(""), 2400);
      return;
    }
    const next = updateCartItem(cart, productId, quantity, variantId);
    setCart(next);
    saveCart(next);
  }

  function removeProduct(productId: string, variantId?: string) {
    const next = removeCartItem(cart, productId, variantId);
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
    shippingFee: number,
    completedConfirmationToken: string,
  ) {
    const single = cart.length === 1 ? cart[0].product : undefined;

    setOrderId(completedOrderId);
    setConfirmationToken(completedConfirmationToken);
    setOrderState({
      product: single,
      country: activeCountry,
      currency: activeCurrency,
      shippingFee,
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
        storeId={store.id}
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
        confirmationToken={confirmationToken}
        onContinueShopping={() => go("catalog")}
        onBackHome={() => go("home")}
      />
    );
  }

  // Use the luxury design for this store while keeping the existing
  // store-specific products, cart, product details, and checkout logic.
  if (page === "home") {
    return (
      <LuxuryStorefront
        products={displayProducts}
        storeName={brandName}
        tagline={tagline}
        homeHref={`/store/${encodeURIComponent(slug ?? "")}`}
        storeLoadError={storeLoadError}
        currency={activeCurrency}
        loading={loading}
        cartCount={cartSummary.itemCount}
        onProductClick={openProduct}
        onAddToCart={(product) => addProduct(product)}
        onCartClick={() => go("cart")}
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
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#1d1d19] text-white ring-1 ring-black/5">
              {store.logoUrl ? (
                <img
                  src={store.logoUrl}
                  alt={`${brandName} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Sparkles size={17} />
              )}
            </span>
            <span className="font-serif text-[25px] tracking-[-0.05em]">
              {brandName}
            </span>
          </button>

          <nav className="hidden items-center gap-9 min-[641px]:flex">
            <HeaderLink
              active={false}
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

      {storeLoadError && (
        <div
          role="alert"
          className="border-b border-rose-200 bg-rose-50 px-5 py-4 text-center text-sm text-rose-900"
        >
          <p className="font-semibold">
            This storefront is temporarily unavailable.
          </p>
          <p className="mt-1 text-rose-800/80">{storeLoadError}</p>
        </div>
      )}

      {mobileMenu && (
        <MobileMenu
          brandName={brandName}
          onNavigate={go}
          onClose={() => setMobileMenu(false)}
        />
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={
              reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8, scale: 0.96 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            className="fixed right-4 top-24 z-[90] rounded-full bg-[#1d1d19] px-5 py-3 text-sm font-semibold text-white shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

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
          const bulkItem = cart.find(
            (item) => item.quantity > MAX_STANDARD_QUANTITY,
          );
          if (bulkItem) {
            showBulkEnquiry(bulkItem.product, bulkItem.quantity);
            return;
          }
          setCartOpen(false);
          go("checkout");
        }}
        onContinue={() => {
          setCartOpen(false);
          go("catalog");
        }}
      />

      <BulkEnquiryModal
        enquiry={bulkEnquiry}
        store={store}
        onClose={() => setBulkEnquiry(null)}
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

/** Shared, explicit delivery notice for product and catalog pages. */
function DeliveryNotice({ className = "" }: { className?: string }) {
  return (
    <section
      aria-label="Delivery information"
      className={`bg-[#f3ecdc] px-5 py-4 sm:px-8 ${className}`}
    >
      <div className="mx-auto flex max-w-[1380px] items-start gap-3">
        <Truck
          size={21}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-[#8b6b35]"
        />
        <div>
          <p className="text-sm font-semibold text-[#183c2d]">
            Estimated delivery timeframe
          </p>
          <p className="mt-1 text-sm leading-6 text-[#514a3d]">
            Due to high demand, please allow 14–21 business days for delivery.
          </p>
          <p className="mt-1 text-xs leading-5 text-[#514a3d]/80">
            Your checkout may show a destination-specific delivery estimate.
          </p>
        </div>
      </div>
    </section>
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
  const [sort, setSort] = useState("featured");

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

    const result = products.filter((product) => {
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.description || "").toLowerCase().includes(query);

      const matchesCategory =
        category === "all" || product.category === category;

      return matchesQuery && matchesCategory;
    });

    if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sort === "price-low") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sort === "price-high") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return result;
  }, [products, search, category, sort]);

  const formatPrice = (price: number, productCurrency?: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(
      convertCurrency(Number(price) || 0, productCurrency || "USD", currency),
    );

  return (
    <main className="min-h-screen bg-[#faf8f2] text-[#183c2d]">
      {/* Catalog banner */}
      <section className="bg-[#153c2c] px-6 py-14 text-white sm:px-10 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[#dfc18b]">
            Discover something special
          </p>

          <h1 className="mt-4 font-serif text-4xl sm:text-6xl">
            The Christmas Collection
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
            Explore our collection of thoughtful finds for the festive season.
            Find something for your home, your celebrations, or someone special.
          </p>

          <div className="mt-7 flex items-center gap-3 text-xs text-white/60">
            <span className="h-px w-8 bg-[#dfc18b]" />
            {products.length} {products.length === 1 ? "PRODUCT" : "PRODUCTS"}
          </div>
        </div>
      </section>

      {/* Keep delivery timing visible before customers browse products. */}
      <DeliveryNotice className="border-b border-[#e7d9bd]" />

      {/* Catalog content */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-10 sm:py-16">
        {/* Search and filters */}
        <div className="mb-10 border-b border-[#e7e0d2] pb-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:max-w-md">
              <label
                htmlFor="christmas-product-search"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#315a42]"
              >
                Find your favourites
              </label>

              <input
                id="christmas-product-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                className="w-full border border-[#d9d0be] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#315a42] focus:ring-1 focus:ring-[#315a42]"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:min-w-[380px]">
              <div>
                <label
                  htmlFor="christmas-category"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#315a42]"
                >
                  Category
                </label>

                <select
                  id="christmas-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full border border-[#d9d0be] bg-white px-3 py-3 text-sm outline-none focus:border-[#315a42]"
                >
                  <option value="all">All categories</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="christmas-sort"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#315a42]"
                >
                  Sort by
                </label>

                <select
                  id="christmas-sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="w-full border border-[#d9d0be] bg-white px-3 py-3 text-sm outline-none focus:border-[#315a42]"
                >
                  <option value="featured">Featured</option>
                  <option value="name">Name: A–Z</option>
                  <option value="price-low">Price: Low to high</option>
                  <option value="price-high">Price: High to low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold text-[#183c2d]">
                {filtered.length}
              </span>{" "}
              of {products.length} products
            </p>

            {(search || category !== "all" || sort !== "featured") && (
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setSort("featured");
                }}
                className="text-xs font-semibold text-[#315a42] underline underline-offset-4"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Product grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => {
              const item = product as Product & {
                image_url?: string;
                imageUrl?: string;
              };

              const image = item.image_url || item.imageUrl;

              return (
                <article key={product.id} className="group min-w-0">
                  <button
                    type="button"
                    onClick={() => onProduct(product)}
                    aria-label={`View ${product.name}`}
                    className="block w-full overflow-hidden bg-[#eee9de] text-left"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-3 text-center text-sm text-gray-500">
                          No product image available
                        </div>
                      )}

                      <span className="absolute left-3 top-3 bg-[#faf8f2]/95 px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#183c2d]">
                        {product.category || "Collection"}
                      </span>
                    </div>
                  </button>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => onProduct(product)}
                      className="text-left text-sm font-semibold leading-5 transition hover:text-[#a47c40] sm:text-base"
                    >
                      {product.name}
                    </button>

                    <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-gray-500">
                      {product.description ||
                        "Discover more about this product."}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-semibold">
                        {formatPrice(
                          getSellingPrice(product),
                          product.currency,
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => onAdd(product)}
                        className="border border-[#183c2d] px-3 py-2 text-xs font-semibold transition hover:bg-[#153c2c] hover:text-white"
                      >
                        Add to bag
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-[#d9d0be] px-6 py-16 text-center">
            <p className="font-serif text-2xl">
              {products.length === 0
                ? "Your collection is taking shape"
                : "No matching products found"}
            </p>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-600">
              {products.length === 0
                ? "Products added to this store will appear here."
                : "Try another search or category to discover available products."}
            </p>

            {(search || category !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
                className="mt-6 bg-[#153c2c] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#28553e]"
              >
                Show all products
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function ProductCard({
  product,
  index,
  currency,
  onProduct,
  onAdd,
}: {
  product: Product;
  index: number;
  currency: string;
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
            {product.variants?.length
              ? `From ${displayPrice(Math.min(...product.variants.map((variant) => getSellingPrice(product, variant))), product.currency, currency)}`
              : displayPrice(
                  getSellingPrice(product),
                  product.currency,
                  currency,
                )}
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
          {product.variants?.length ? "Choose options" : "Add to bag"}
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
  onAdd: (product: Product, variant?: ProductVariant) => void;
}) {
  const images = getImages(product);
  const related = products.filter((item) => item.id !== product.id).slice(0, 4);

  const [imageIndex, setImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants?.[0]?.id ?? "",
  );
  const [openDetails, setOpenDetails] = useState<string | null>(null);

  const selectedVariant = product.variants?.find(
    (variant) => String(variant.id) === selectedVariantId,
  );

  const currentPrice = getSellingPrice(product, selectedVariant);
  const currentStock = getStock(product, selectedVariant);
  const hasVariants = (product.variants?.length ?? 0) > 0;

  const touchStartX = useRef<number | null>(null);
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const [galleryVisible, setGalleryVisible] = useState(true);

  useEffect(() => {
    // Reset the gallery and variant selection when a different product opens.
    setImageIndex(0);
    setSelectedVariantId(product.variants?.[0]?.id ?? "");
    setOpenDetails(null);
  }, [product.id, product.variants]);

  useEffect(() => {
    const gallery = galleryRef.current;

    if (!gallery || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setGalleryVisible(entry.isIntersecting),
      { threshold: 0.2 },
    );

    observer.observe(gallery);

    return () => observer.disconnect();
  }, []);

  function previousImage() {
    setImageIndex((index) =>
      index <= 0 ? Math.max(images.length - 1, 0) : index - 1,
    );
  }

  function nextImage() {
    setImageIndex((index) => (index >= images.length - 1 ? 0 : index + 1));
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;

    const difference = endX - touchStartX.current;

    if (Math.abs(difference) > 45 && images.length > 1) {
      if (difference < 0) {
        nextImage();
      } else {
        previousImage();
      }
    }

    touchStartX.current = null;
  }

  function toggleDetails(section: string) {
    setOpenDetails((current) => (current === section ? null : section));
  }

  function handleAddToCart() {
    if (currentStock <= 0) return;
    if (hasVariants && !selectedVariant) return;

    onAdd(product, selectedVariant);
  }

  const category = product.category?.trim() || "Products";
  const delivery = getDelivery(product);

  return (
    <main className="bg-[#f8f6f1] text-[#1d1d19]">
      <section className="mx-auto max-w-[1380px] px-5 py-6 sm:px-8 sm:py-10 min-[1025px]:px-10 min-[1025px]:py-12">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-black/55 transition hover:text-black"
        >
          <ChevronLeft size={17} />
          Back to products
        </button>

        <div className="grid gap-8 min-[1025px]:grid-cols-[1.05fr_0.95fr] min-[1025px]:gap-14">
          {/* Product image gallery */}
          <div ref={galleryRef}>
            <div
              className="relative overflow-hidden rounded-[2rem] bg-[#eee7df]"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
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
                    aria-label="Previous product image"
                    className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm min-[641px]:flex"
                  >
                    <ChevronLeft size={19} />
                  </button>

                  <button
                    type="button"
                    onClick={nextImage}
                    aria-label="Next product image"
                    className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm min-[641px]:flex"
                  >
                    <ChevronRight size={19} />
                  </button>

                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-3 py-2 backdrop-blur min-[641px]:hidden">
                    {images.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setImageIndex(index)}
                        aria-label={`Show product image ${index + 1}`}
                        aria-current={imageIndex === index}
                        className={`h-1.5 rounded-full transition-all ${
                          imageIndex === index
                            ? "w-5 bg-white"
                            : "w-1.5 bg-white/60"
                        }`}
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
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setImageIndex(index)}
                    aria-label={`Select product image ${index + 1}`}
                    aria-pressed={imageIndex === index}
                    className={`overflow-hidden rounded-2xl border-2 bg-[#eee7df] ${
                      imageIndex === index
                        ? "border-[#1d1d19]"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product information and purchase options */}
          <div className="min-[1025px]:sticky min-[1025px]:top-28 min-[1025px]:self-start">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">
              {category}
            </p>

            <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">
              {product.name}
            </h1>

            <p className="mt-5 text-2xl font-semibold tracking-tight">
              {displayPrice(currentPrice, product.currency, currency)}
            </p>

            {product.description?.trim() && (
              <p className="mt-5 max-w-xl whitespace-pre-line text-base leading-7 text-black/60">
                {product.description}
              </p>
            )}

            {/* Select a real product variant when variants exist. */}
            {hasVariants && (
              <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="product-variant"
                    className="text-sm font-semibold"
                  >
                    Choose an option
                  </label>

                  <span className="text-xs text-black/45">
                    {product.variants!.length} available options
                  </span>
                </div>

                <select
                  id="product-variant"
                  value={selectedVariantId}
                  onChange={(event) => setSelectedVariantId(event.target.value)}
                  className="mt-3 h-12 w-full rounded-xl border border-black/10 bg-[#f8f6f1] px-4 text-sm outline-none focus:border-black/40"
                >
                  {product.variants!.map((variant) => {
                    const available = getStock(product, variant);

                    return (
                      <option
                        key={variant.id}
                        value={String(variant.id)}
                        disabled={available <= 0}
                      >
                        {getVariantLabel(variant)} ·{" "}
                        {displayPrice(
                          getSellingPrice(product, variant),
                          product.currency,
                          currency,
                        )}
                        {available <= 0
                          ? " · Sold out"
                          : ` · ${available} available`}
                      </option>
                    );
                  })}
                </select>

                {selectedVariant && (
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                    <span className="text-black/50">
                      Selected: {getVariantLabel(selectedVariant)}
                    </span>

                    <span
                      className={
                        currentStock > 0
                          ? "font-semibold text-emerald-700"
                          : "font-semibold text-rose-700"
                      }
                    >
                      {currentStock > 0
                        ? `${currentStock} in stock`
                        : "Out of stock"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Delivery estimate */}
            <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex items-start gap-3">
                <Truck size={19} className="mt-0.5 shrink-0 text-black/60" />

                <div>
                  <p className="text-sm font-semibold">Delivery information</p>

                  <p className="mt-1 text-sm leading-6 text-black/55">
                    {delivery ||
                      "Delivery information will be confirmed during checkout."}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-black/40">
                    Available delivery options and charges are confirmed during
                    checkout.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 border-y border-black/10 py-4">
              <span className="text-sm text-black/55">Availability</span>

              <span
                className={`text-sm font-semibold ${
                  currentStock > 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {currentStock > 0
                  ? `${currentStock} in stock`
                  : "Currently unavailable"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={currentStock <= 0 || (hasVariants && !selectedVariant)}
              className="mt-6 hidden min-h-[54px] w-full rounded-full bg-[#1d1d19] px-5 text-base font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 min-[641px]:block"
            >
              {currentStock <= 0 ? "Sold out" : "Add to cart"}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-black/40">
              Final order totals and delivery charges are shown during checkout.
            </p>

            {/* Product information accordions */}
            <div className="mt-5 border-t border-black/10">
              <Accordion
                title="Product details"
                open={openDetails === "details"}
                onToggle={() => toggleDetails("details")}
              >
                <p className="whitespace-pre-line">
                  {product.description?.trim() ||
                    "Additional product details have not been provided by this store yet."}
                </p>
              </Accordion>

              <Accordion
                title="Shipping information"
                open={openDetails === "shipping"}
                onToggle={() => toggleDetails("shipping")}
              >
                <p>
                  Delivery availability, estimated delivery times, shipping
                  charges, and applicable restrictions are confirmed during
                  checkout and are subject to this store's shipping policies.
                </p>
              </Accordion>

              <Accordion
                title="Returns and refunds"
                open={openDetails === "returns"}
                onToggle={() => toggleDetails("returns")}
              >
                <p>
                  Return eligibility and refund conditions are governed by this
                  store's published returns and refund policy. Please review
                  that policy before placing your order.
                </p>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* Related products come only from this store's product collection. */}
      {related.length > 0 && (
        <section className="border-t border-black/10 bg-[#eeeae3] px-5 py-14 sm:px-8 min-[1025px]:px-10 min-[1025px]:py-20">
          <div className="mx-auto max-w-[1380px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">
              Discover more
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              You may also like
            </h2>

            <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[641px]:grid min-[641px]:grid-cols-2 min-[1025px]:grid-cols-4">
              {related.map((item, index) => (
                <div
                  key={item.id}
                  className="min-w-[78%] snap-start min-[641px]:min-w-0"
                >
                  <ProductCard
                    product={item}
                    index={index}
                    currency={currency}
                    onProduct={onProduct}
                    onAdd={onAdd}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mobile purchase bar appears when the main gallery is off-screen. */}
      {!galleryVisible && currentStock > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-[88] border-t border-black/10 bg-[#f8f6f1]/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-10px_35px_rgba(20,20,16,0.12)] backdrop-blur-xl min-[641px]:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{product.name}</p>

              <p className="mt-1 text-base font-semibold">
                {displayPrice(currentPrice, product.currency, currency)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={hasVariants && !selectedVariant}
              className="min-h-12 shrink-0 rounded-full bg-[#1d1d19] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add to cart
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
        <div className="pb-5 text-sm leading-6 text-black/50">{children}</div>
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
  onQuantity: (productId: string, quantity: number, variantId?: string) => void;
  onRemove: (productId: string, variantId?: string) => void;
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
                key={`${item.product.id}:${item.variant_id ?? "default"}`}
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
                      {item.variant_name && (
                        <p className="mt-1 text-xs text-black/45">
                          {item.variant_name}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-black/40">
                        {displayPrice(
                          item.product.price_override ??
                            item.unit_price ??
                            item.product.price,
                          item.product.currency,
                          currency,
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(item.product.id, item.variant_id)}
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
                          item.variant_id,
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
                          item.variant_id,
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
      <span className={large ? "font-semibold" : "text-white/45"}>{label}</span>
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
  onQuantity: (productId: string, quantity: number, variantId?: string) => void;
  onRemove: (productId: string, variantId?: string) => void;
  onCheckout: () => void;
  onContinue: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-black/35"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-0 h-full w-full"
            aria-label="Close cart"
          />

          <motion.aside
            initial={reduceMotion ? { x: 0 } : { x: 440 }}
            animate={{ x: 0 }}
            exit={reduceMotion ? { x: 0 } : { x: 440 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="absolute bottom-0 right-0 flex h-[92vh] w-full flex-col rounded-t-[2rem] bg-[#f8f6f1] shadow-2xl min-[641px]:bottom-auto min-[641px]:top-0 min-[641px]:h-full min-[641px]:w-[430px] min-[641px]:rounded-none min-[641px]:rounded-l-[2rem]"
          >
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">
                  Shopping bag
                </p>
                <h2 className="mt-1 font-serif text-3xl">
                  {summary.itemCount}{" "}
                  {summary.itemCount === 1 ? "item" : "items"}
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
                      key={`${item.product.id}:${item.variant_id ?? "default"}`}
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
                            {item.variant_name && (
                              <p className="mt-1 text-xs text-black/45">
                                {item.variant_name}
                              </p>
                            )}
                            <p className="mt-1 text-sm text-black/42">
                              {displayPrice(
                                item.product.price_override ??
                                  item.unit_price ??
                                  item.product.price,
                                item.product.currency,
                                currency,
                              )}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              onRemove(item.product.id, item.variant_id)
                            }
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
                                item.variant_id,
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
                  <h3 className="mt-5 font-serif text-3xl">
                    Your bag is empty.
                  </h3>
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
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
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
            Questions about a product, an order or building your routine? Reach{" "}
            {brandName} here.
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
                Thanks for reaching out. Your message has been captured for this
                storefront preview.
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

type BulkEnquiry = { product: Product; quantity: number };

function BulkEnquiryModal({
  enquiry,
  store,
  onClose,
}: {
  enquiry: BulkEnquiry | null;
  store: StoreConfig;
  onClose: () => void;
}) {
  const settings = (store.settings ?? {}) as unknown as Record<string, unknown>;
  const rawNumber = String(
    settings.whatsappNumber ??
      settings.whatsapp_number ??
      settings.contactPhone ??
      settings.phone ??
      "",
  );
  const whatsappNumber = rawNumber.replace(/\D/g, "");
  const message = enquiry
    ? `Hello, I would like to place a bulk order for ${enquiry.product.name}. I tried to order ${enquiry.quantity} units. Please let me know the bulk-order options and pricing.`
    : "";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <AnimatePresence>
      {enquiry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-enquiry-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="w-full max-w-md rounded-[2rem] bg-[#f8f6f1] p-6 text-[#1d1d19] shadow-2xl sm:p-8"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e6eee5] text-[#246b43]">
              <ShoppingBag size={22} />
            </div>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40">
              Bulk order request
            </p>
            <h2
              id="bulk-enquiry-title"
              className="mt-2 font-serif text-3xl leading-tight"
            >
              Need more than {MAX_STANDARD_QUANTITY}?
            </h2>
            <p className="mt-3 text-sm leading-6 text-black/60">
              You can order up to {MAX_STANDARD_QUANTITY} units of one product
              through regular checkout. If you need more of{" "}
              <strong>{enquiry.product.name}</strong>, contact us on WhatsApp
              and we’ll help arrange a bulk order.
            </p>
            <div className="mt-5 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-black/50">Requested quantity</span>
                <strong>{enquiry.quantity} units</strong>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-black/50">Regular checkout limit</span>
                <strong>{MAX_STANDARD_QUANTITY} units</strong>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {whatsappNumber ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-12 items-center justify-center rounded-full bg-[#1d1d19] px-5 text-sm font-semibold text-white transition hover:bg-black"
                >
                  Contact us on WhatsApp
                </a>
              ) : (
                <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                  WhatsApp contact is not configured for this store yet. Add the
                  store’s WhatsApp number to its settings to enable direct bulk
                  enquiries.
                </p>
              )}
              <button
                type="button"
                onClick={onClose}
                className="min-h-12 rounded-full border border-black/10 px-5 text-sm font-semibold hover:bg-white"
              >
                Continue with regular order
              </button>
            </div>
            <p className="mt-4 text-center text-xs leading-5 text-black/40">
              Your extra quantity has not been added to the cart or submitted as
              an order.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
