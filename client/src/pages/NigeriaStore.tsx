import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Menu,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import Checkout from "./Checkout";
import OrderSuccess from "./OrderSuccess";

import type { CartItem } from "../types/cart";
import type { MarketInfo } from "../types/market";
import type { Product } from "../types/product";

import { getProducts } from "../services/api";
import { convertCurrency, formatCurrency } from "../utils/currency";
import { getDeliveryTime, getShippingFee } from "../utils/shipping";

const NIGERIA_MARKET: MarketInfo = {
  countryCode: "NG",
  countryName: "Nigeria",
  currency: "NGN",
  market: "AFRICA",
};

type Page = "home" | "shop" | "product" | "cart" | "checkout" | "success";

type ActiveProduct = Product & {
  active?: number | boolean;
};

function isActive(product: ActiveProduct) {
  return product.active === undefined || Boolean(product.active);
}

function nairaPrice(product: Product) {
  return convertCurrency(
    Number(product.price) || 0,
    product.currency || "USD",
    "NGN",
  );
}

export default function NigeriaStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<Page>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderCustomer, setOrderCustomer] = useState<{
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        const data = await getProducts();
        if (mounted) {
          setProducts(
            data.filter((product) => isActive(product as ActiveProduct)),
          );
        }
      } catch (error) {
        console.error("Unable to load Nigeria store products:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadProducts();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) =>
      [product.name, product.category, product.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [products, search]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + nairaPrice(item.product) * item.quantity,
        0,
      ),
    [cart],
  );

  const shipping = getShippingFee("NG", "NGN");
  const total = subtotal + shipping;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function navigate(next: Page) {
    setView(next);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addProduct(product: Product, quantity = 1) {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...current, { product, quantity }];
    });
    setView("cart");
  }

  function updateQuantity(productId: string, quantity: number) {
    setCart((current) =>
      quantity <= 0
        ? current.filter((item) => item.product.id !== productId)
        : current.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item,
          ),
    );
  }

  function startCheckout() {
    if (cart.length > 0) navigate("checkout");
  }

  if (view === "checkout") {
    return (
      <Checkout
        cart={cart}
        market={NIGERIA_MARKET}
        onBack={() => navigate("cart")}
        onComplete={(nextOrderId, customer, nextTotal) => {
          setOrderId(nextOrderId);
          setOrderCustomer(customer);
          setOrderTotal(nextTotal);
          setCart([]);
          navigate("success");
        }}
      />
    );
  }

  if (view === "success") {
    return (
      <OrderSuccess
        orderId={orderId}
        orderState={{
          currency: "NGN",
          country: "NG",
          total: orderTotal,
          deliveryTime: getDeliveryTime("NG"),
          customer: orderCustomer || undefined,
        }}
        onContinueShopping={() => navigate("shop")}
        onBackHome={() => navigate("home")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3ee] text-neutral-950">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#fbf8f4]/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenu((open) => !open)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white lg:hidden"
              aria-label="Toggle navigation"
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link to="/admin" className="group flex items-center gap-2 text-sm font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-white">
                I
              </span>
              <span>
                <span className="block text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                  Nigeria store
                </span>
                <span className="block">Igoma</span>
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex">
            <button type="button" onClick={() => navigate("home")}>Home</button>
            <button type="button" onClick={() => navigate("shop")}>Shop</button>
            <button type="button" onClick={() => navigate("cart")}>Cart</button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("shop")}
              className="hidden h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white sm:flex"
              aria-label="Search products"
            >
              <Search size={18} />
            </button>
            <button
              type="button"
              onClick={() => navigate("cart")}
              className="relative flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-bold text-white"
            >
              <ShoppingBag size={17} />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-black text-neutral-950">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="border-t border-black/10 bg-[#fbf8f4] px-4 py-4 lg:hidden">
            <div className="grid gap-2 text-left text-sm font-semibold">
              <button type="button" onClick={() => navigate("home")} className="rounded-xl px-3 py-3 text-left hover:bg-black/5">Home</button>
              <button type="button" onClick={() => navigate("shop")} className="rounded-xl px-3 py-3 text-left hover:bg-black/5">Shop</button>
              <button type="button" onClick={() => navigate("cart")} className="rounded-xl px-3 py-3 text-left hover:bg-black/5">Cart</button>
            </div>
          </div>
        )}
      </header>

      <div className="border-b border-black/10 bg-neutral-950 px-4 py-2.5 text-center text-xs font-semibold text-white">
        Nigeria only · Prices shown in Nigerian naira · Physical products
      </div>

      {view === "home" && (
        <main>
          <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">Built for Nigeria</p>
              <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                Everyday products, delivered across Nigeria.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-neutral-600 sm:text-lg">
                A dedicated physical-product store for Nigerian shoppers with local pricing, Nigerian delivery details and a simple checkout.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("shop")}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-neutral-950 px-6 text-sm font-bold text-white"
                >
                  Shop products
                  <ArrowRight size={17} />
                </button>
                <Link
                  to="/store"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-black/10 bg-white px-6 text-sm font-bold"
                >
                  Normal store
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-neutral-900 p-3 shadow-2xl">
              <div className="grid min-h-[430px] place-items-end rounded-[1.5rem] bg-[radial-gradient(circle_at_top_right,#8a7564,transparent_42%),linear-gradient(145deg,#161312,#42362f)] p-7 text-white sm:min-h-[520px] sm:p-10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Nigeria physical store</p>
                  <p className="mt-3 max-w-sm text-3xl font-black sm:text-4xl">One storefront. One Nigerian market. One checkout.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-black/10 bg-white">
            <div className="mx-auto grid max-w-7xl gap-4 px-4 py-7 sm:grid-cols-3 sm:px-6 lg:px-8">
              <Info icon={<Truck size={20} />} title="Nigeria delivery" text={getDeliveryTime("NG")} />
              <Info icon={<MapPin size={20} />} title="Nigeria addresses" text="State, city and delivery address at checkout." />
              <Info icon={<Package size={20} />} title="Physical products" text="Products are ordered and fulfilled as physical goods." />
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Featured</p>
                <h2 className="mt-2 text-3xl font-black sm:text-4xl">Shop the store</h2>
              </div>
              <button type="button" onClick={() => navigate("shop")} className="hidden items-center gap-2 text-sm font-bold sm:flex">
                View all <ArrowRight size={16} />
              </button>
            </div>
            <ProductGrid products={filteredProducts.slice(0, 6)} loading={loading} onOpen={(product) => { setSelectedProduct(product); navigate("product"); }} onAdd={addProduct} />
          </section>
        </main>
      )}

      {view === "shop" && (
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Nigeria catalog</p>
              <h1 className="mt-2 text-4xl font-black sm:text-5xl">Shop</h1>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" className="h-12 w-full rounded-full border border-black/10 bg-white pl-11 pr-4 text-sm outline-none focus:border-neutral-950" />
            </div>
          </div>
          <ProductGrid products={filteredProducts} loading={loading} onOpen={(product) => { setSelectedProduct(product); navigate("product"); }} onAdd={addProduct} />
        </main>
      )}

      {view === "product" && selectedProduct && (
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <button type="button" onClick={() => navigate("shop")} className="mb-7 inline-flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft size={17} /> Back to shop
          </button>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="overflow-hidden rounded-[2rem] bg-white">
              {selectedProduct.image_url ? (
                <img src={selectedProduct.image_url} alt={selectedProduct.name} className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-neutral-100 text-neutral-400">Product image</div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">{selectedProduct.category || "Product"}</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{selectedProduct.name}</h1>
              <p className="mt-5 text-2xl font-black">{formatCurrency(nairaPrice(selectedProduct), "NGN")}</p>
              <p className="mt-5 text-base leading-8 text-neutral-600">{selectedProduct.description || "Quality physical product available to customers in Nigeria."}</p>
              <div className="mt-8 rounded-2xl border border-black/10 bg-white p-5">
                <div className="flex items-start gap-3">
                  <Truck size={21} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Nigeria delivery</p>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">{getDeliveryTime("NG")}. Shipping is calculated at checkout.</p>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => addProduct(selectedProduct)} className="mt-6 min-h-14 w-full rounded-2xl bg-neutral-950 px-6 text-sm font-bold text-white sm:w-auto sm:min-w-64">
                Add to cart
              </button>
            </div>
          </div>
        </main>
      )}

      {view === "cart" && (
        <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Your Nigeria order</p>
              <h1 className="mt-2 text-4xl font-black">Cart</h1>
            </div>
            <button type="button" onClick={() => navigate("shop")} className="text-sm font-bold">Continue shopping</button>
          </div>

          {cart.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-dashed border-black/15 bg-white p-12 text-center">
              <ShoppingBag className="mx-auto" size={28} />
              <h2 className="mt-4 text-2xl font-black">Your cart is empty</h2>
              <button type="button" onClick={() => navigate("shop")} className="mt-5 rounded-full bg-neutral-950 px-6 py-3 text-sm font-bold text-white">Start shopping</button>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex gap-4 rounded-2xl border border-black/10 bg-white p-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      {item.product.image_url && <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold">{item.product.name}</h2>
                      <p className="mt-1 text-sm text-neutral-500">{formatCurrency(nairaPrice(item.product), "NGN")}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10"><Minus size={15} /></button>
                        <span className="min-w-5 text-center text-sm font-bold">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10"><Plus size={15} /></button>
                      </div>
                    </div>
                    <p className="text-sm font-black">{formatCurrency(nairaPrice(item.product) * item.quantity, "NGN")}</p>
                  </div>
                ))}
              </div>

              <aside className="h-fit rounded-[2rem] bg-neutral-950 p-6 text-white lg:sticky lg:top-24">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Nigeria checkout</p>
                <div className="mt-6 flex items-center justify-between text-sm text-white/70"><span>Subtotal</span><span>{formatCurrency(subtotal, "NGN")}</span></div>
                <div className="mt-3 flex items-center justify-between text-sm text-white/70"><span>Shipping</span><span>{formatCurrency(shipping, "NGN")}</span></div>
                <div className="my-5 border-t border-white/10" />
                <div className="flex items-center justify-between"><span className="font-semibold">Total</span><span className="text-xl font-black">{formatCurrency(total, "NGN")}</span></div>
                <button type="button" onClick={startCheckout} className="mt-6 min-h-13 w-full rounded-2xl bg-white px-5 text-sm font-black text-neutral-950">Continue to checkout</button>
                <p className="mt-4 text-xs leading-5 text-white/50">Nigeria addresses only. Payment and order confirmation are handled at checkout.</p>
              </aside>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

function Info({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-black/10 bg-[#f7f3ee] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">{icon}</div>
      <div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-neutral-500">{text}</p></div>
    </div>
  );
}

function ProductGrid({
  products,
  loading,
  onOpen,
  onAdd,
}: {
  products: Product[];
  loading: boolean;
  onOpen: (product: Product) => void;
  onAdd: (product: Product) => void;
}) {
  if (loading) {
    return <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="overflow-hidden rounded-3xl bg-white"><div className="aspect-[4/5] animate-pulse bg-neutral-200" /><div className="space-y-3 p-5"><div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" /><div className="h-4 w-1/3 animate-pulse rounded bg-neutral-100" /></div></div>)}</div>;
  }

  if (products.length === 0) {
    return <div className="mt-8 rounded-3xl border border-dashed border-black/15 bg-white p-12 text-center text-sm text-neutral-500">No products have been added to this store yet.</div>;
  }

  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <article key={product.id} className="group overflow-hidden rounded-3xl bg-white">
          <button type="button" onClick={() => onOpen(product)} className="block w-full text-left">
            <div className="aspect-[4/5] overflow-hidden bg-neutral-100">
              {product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-sm text-neutral-400">Product image</div>}
            </div>
          </button>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">{product.category || "Product"}</p><h3 className="mt-1 font-bold">{product.name}</h3></div>
              <p className="shrink-0 text-sm font-black">{formatCurrency(nairaPrice(product), "NGN")}</p>
            </div>
            <button type="button" onClick={() => onAdd(product)} className="mt-5 min-h-11 w-full rounded-xl bg-neutral-950 text-sm font-bold text-white">Add to cart</button>
          </div>
        </article>
      ))}
    </div>
  );
}
