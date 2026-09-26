import {
useEffect,
useMemo,
useState,
} from "react";

import StoreHeader from "../../components/store/StoreHeader";
import StoreSectionRenderer from "../../components/store/StoreSectionRenderer";
import StoreProductCard from "../../components/store/StoreProductCard";
import StoreCatalogControls from "../../components/store/StoreCatalogControls";
import StoreFooter from "../../components/store/StoreFooter";
import Checkout from "../Checkout";
import OrderSuccess from "../OrderSuccess";

import {
AboutPage,
ContactPage,
FAQPage,
PrivacyPolicyPage,
RefundPolicyPage,
ShippingPolicyPage,
TermsPage,
} from "./StoreInfoPages";

import type { Product } from "../../types/product";
import type {
StoreConfig,
StorePageType,
} from "../../types/store";
import type { MarketInfo } from "../../types/market";
import type { CartItem } from "../../types/cart";

import { DEFAULT_STORE_CONFIG } from "../../themes/registry";
import {
getProducts,
getStoreConfig,
} from "../../services/api";
import { detectMarket } from "../../services/market";

import {
addToCart,
getCart,
getCartSummary,
removeCartItem,
saveCart,
updateCartItem,
} from "../../utils/cart";

import { formatCurrency } from "../../utils/currency";
import { getDeliveryTime } from "../../utils/shipping";

export default function Store() {
const [store, setStore] =
useState<StoreConfig>(DEFAULT_STORE_CONFIG);

const [products, setProducts] =
useState<Product[]>([]);

const [loadingProducts, setLoadingProducts] =
useState(true);

const [market, setMarket] =
useState<MarketInfo | null>(null);

const [currentPage, setCurrentPage] =
useState<StorePageType>("home");

const [selectedProduct, setSelectedProduct] =
useState<Product | null>(null);

const [orderId, setOrderId] =
useState<string | null>(null);

const [orderSuccessState, setOrderSuccessState] =
useState<{
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

const [cart, setCart] =
useState<CartItem[]>([]);

const [cartMessage, setCartMessage] =
useState("");

useEffect(() => {
let mounted = true;

async function loadStore() {
  try {
    const data = await getStoreConfig();

    if (mounted && data) {
      setStore(data);
    }
  } catch {
    if (mounted) {
      setStore(DEFAULT_STORE_CONFIG);
    }
  }
}

async function loadProducts() {
  setLoadingProducts(true);

  try {
    const data = await getProducts();

    if (mounted) {
      setProducts(data);
    }
  } catch (error) {
    console.error(
      "Failed to load products:",
      error,
    );
  } finally {
    if (mounted) {
      setLoadingProducts(false);
    }
  }
}

async function loadMarket() {
  try {
    const detected = await detectMarket();

    if (mounted) {
      setMarket(detected);
    }
  } catch (error) {
    console.error(
      "Failed to detect market:",
      error,
    );
  }
}

loadStore();
loadProducts();
loadMarket();

setCart(getCart());

return () => {
  mounted = false;
};

}, []);

useEffect(() => {
const handleCartUpdate = () => {
setCart(getCart());
};

window.addEventListener(
  "store-cart-updated",
  handleCartUpdate,
);

return () => {
  window.removeEventListener(
    "store-cart-updated",
    handleCartUpdate,
  );
};

}, []);

const activeCurrency =
market?.currency || "NGN";

const activeCountry =
market?.countryCode || "NG";

const cartSummary = useMemo(
() =>
getCartSummary(
cart,
activeCountry,
activeCurrency,
),
[
cart,
activeCountry,
activeCurrency,
],
);

function navigate(page: StorePageType) {
setCurrentPage(page);

if (page !== "product") {
  setSelectedProduct(null);
}

window.scrollTo({
  top: 0,
  behavior: "smooth",
});

}

function openProduct(product: Product) {
setSelectedProduct(product);
setCurrentPage("product");

window.scrollTo({
  top: 0,
  behavior: "smooth",
});

}

function handleAddToCart(product: Product) {
const nextCart = addToCart(
cart,
product,
1,
);

setCart(nextCart);
saveCart(nextCart);

setCartMessage(
  `${product.name} added to your cart.`,
);

window.setTimeout(() => {
  setCartMessage("");
}, 2500);

}

function handleUpdateQuantity(
productId: string,
quantity: number,
) {
const nextCart = updateCartItem(
cart,
productId,
quantity,
);

setCart(nextCart);
saveCart(nextCart);

}

function handleRemoveFromCart(
productId: string,
) {
const nextCart = removeCartItem(
cart,
productId,
);

setCart(nextCart);
saveCart(nextCart);

}

function handleCheckoutComplete(
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
const product =
cart.length === 1
? cart[0].product
: undefined;

setOrderId(completedOrderId);

setOrderSuccessState({
  product,
  country: activeCountry,
  currency: activeCurrency,
  shippingFee: cartSummary.shipping,
  deliveryTime:
    getDeliveryTime(activeCountry),
  total,
  customer,
});

setCart([]);
saveCart([]);

setCurrentPage("order-success");

window.scrollTo({
  top: 0,
  behavior: "smooth",
});

}

if (currentPage === "checkout") {
return (
<Checkout
cart={cart}
market={market}
onBack={() => navigate("cart")}
onComplete={handleCheckoutComplete}
/>
);
}

if (currentPage === "order-success") {
return (
<OrderSuccess
orderId={orderId}
orderState={
orderSuccessState || undefined
}
onContinueShopping={() =>
navigate("catalog")
}
onBackHome={() =>
navigate("home")
}
/>
);
}

return (
<div className="min-h-screen bg-white text-slate-950">
<StoreHeader store={store} currentPage={currentPage} cartCount={cartSummary.itemCount} onNavigate={navigate} />

  {cartMessage && (
    <div className="fixed right-4 top-20 z-50 rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-xl">
      {cartMessage}
    </div>
  )}

  {currentPage === "home" && (
    <HomePage
      products={products}
      loading={loadingProducts}
      onProductClick={openProduct}
    />
  )}

  {currentPage === "catalog" && (
    <CatalogPage
      products={products}
      loading={loadingProducts}
      onProductClick={openProduct}
    />
  )}

  {currentPage === "product" &&
    selectedProduct && (
      <ProductPage
        product={selectedProduct}
        products={products}
        onProductClick={openProduct}
        onAddToCart={handleAddToCart}
      />
    )}

  {currentPage === "cart" && (
    <CartPage
      cart={cart}
      summary={cartSummary}
      currency={activeCurrency}
      onUpdateQuantity={
        handleUpdateQuantity
      }
      onRemove={handleRemoveFromCart}
      onCheckout={() =>
        navigate("checkout")
      }
      onContinueShopping={() =>
        navigate("catalog")
      }
    />
  )}

  {currentPage === "contact" && (
    <ContactPage
      storeName={store.name}
      onBackHome={() =>
        navigate("home")
      }
    />
  )}

  {currentPage === "about" && (
    <AboutPage
      storeName={store.name}
      onBackHome={() =>
        navigate("home")
      }
    />
  )}

  {currentPage === "faq" && (
    <FAQPage
      onBackHome={() =>
        navigate("home")
      }
    />
  )}

  {currentPage === "shipping" && (
    <ShippingPolicyPage
      onBackHome={() =>
        navigate("home")
      }
    />
  )}

  {currentPage === "refund" && (
    <RefundPolicyPage
      onBackHome={() =>
        navigate("home")
      }
    />
  )}

  {currentPage === "privacy" && (
    <PrivacyPolicyPage
      onBackHome={() =>
        navigate("home")
      }
    />
  )}

  {currentPage === "terms" && (
    <TermsPage
      onBackHome={() =>
        navigate("home")
      }
    />
  )}

  <StoreFooter
    store={store}
    onNavigate={navigate}
  />

  <button
    type="button"
    onClick={() =>
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }
    className="fixed bottom-5 left-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg transition hover:-translate-y-1"
    aria-label="Scroll to top"
  >
    ↑
  </button>
</div>

);
}

function HomePage({
products,
loading,
onProductClick,
}: {
products: Product[];
loading: boolean;
onProductClick: (product: Product) => void;
}) {
const featuredProducts =
products.slice(0, 8);

return (
<main>
<StoreSectionRenderer products={products} loading={loading} onProductClick={onProductClick} />

  {featuredProducts.length > 0 && (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Featured
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Featured products
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {featuredProducts.map(
          (product) => (
            <StoreProductCard
              key={product.id}
              product={product}
              onClick={() =>
                onProductClick(product)
              }
            />
          ),
        )}
      </div>
    </section>
  )}
</main>

);
}

function CatalogPage({
products,
loading,
onProductClick,
}: {
products: Product[];
loading: boolean;
onProductClick: (product: Product) => void;
}) {
const [search, setSearch] =
useState("");

const [category, setCategory] =
useState("all");

const [sort, setSort] =
useState<
"featured" |
"price-low" |
"price-high" |
"name"
>("featured");

const categories = useMemo(
() =>
Array.from(
new Set(
products
.map(
(product) =>
product.category,
)
.filter(Boolean),
),
).sort((a, b) =>
a.localeCompare(b),
),
[products],
);

const filteredProducts = useMemo(() => {
const query = search
.trim()
.toLowerCase();

const filtered = products.filter(
  (product) => {
    const matchesSearch =
      !query ||
      product.name
        .toLowerCase()
        .includes(query) ||
      product.description
        .toLowerCase()
        .includes(query) ||
      product.category
        .toLowerCase()
        .includes(query);

    const matchesCategory =
      category === "all" ||
      product.category === category;

    return (
      matchesSearch &&
      matchesCategory
    );
  },
);

return [...filtered].sort(
  (a, b) => {
    if (sort === "price-low") {
      return a.price - b.price;
    }

    if (sort === "price-high") {
      return b.price - a.price;
    }

    if (sort === "name") {
      return a.name.localeCompare(
        b.name,
      );
    }

    return 0;
  },
);

}, [
products,
search,
category,
sort,
]);

function clearFilters() {
setSearch("");
setCategory("all");
setSort("featured");
}

return (
<main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
<div className="mb-8">
<p className="text-sm font-medium text-slate-500">
Shop
</p>

    <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
      All products
    </h1>

    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
      Browse our available products
      and find something that fits
      what you need.
    </p>
  </div>

  <StoreCatalogControls
    search={search}
    category={category}
    sort={sort}
    categories={categories}
    resultCount={
      filteredProducts.length
    }
    onSearchChange={setSearch}
    onCategoryChange={setCategory}
    onSortChange={setSort}
    onClear={clearFilters}
  />

  {loading ? (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({
        length: 8,
      }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
        >
          <div className="aspect-square animate-pulse bg-slate-100" />

          <div className="space-y-3 p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />

            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />

            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  ) : filteredProducts.length === 0 ? (
    <div className="rounded-3xl border border-dashed border-slate-300 px-6 py-20 text-center">
      <h2 className="text-lg font-semibold text-slate-950">
        No products found
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Try another search or category.
      </p>

      <button
        type="button"
        onClick={clearFilters}
        className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Clear filters
      </button>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {filteredProducts.map(
        (product) => (
          <StoreProductCard
            key={product.id}
            product={product}
            onClick={() =>
              onProductClick(product)
            }
          />
        ),
      )}
    </div>
  )}
</main>

);
}

function ProductPage({
product,
products,
onProductClick,
onAddToCart,
}: {
product: Product;
products: Product[];
onProductClick: (product: Product) => void;
onAddToCart: (product: Product) => void;
}) {
const relatedProducts =
products
.filter(
(item) =>
item.id !== product.id &&
item.category ===
product.category,
)
.slice(0, 4);

return (
<main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
<div className="grid gap-10 lg:grid-cols-2">
<div className="aspect-square overflow-hidden rounded-3xl bg-slate-100">
{product.image_url ? (
<img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
) : (
<div className="flex h-full items-center justify-center text-sm text-slate-400">
No image
</div>
)}
</div>

    <div className="flex flex-col justify-center">
      <p className="text-sm font-medium text-slate-500">
        {product.category}
      </p>

      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        {product.name}
      </h1>

      <p className="mt-5 text-2xl font-bold text-slate-950">
        {formatCurrency(
          product.price,
          product.currency ||
            "USD",
        )}
      </p>

      <p className="mt-6 whitespace-pre-line text-base leading-8 text-slate-600">
        {product.description}
      </p>

      {product.delivery_time && (
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          {product.delivery_time}
        </div>
      )}

      <button
        type="button"
        onClick={() =>
          onAddToCart(product)
        }
        className="mt-8 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Add to cart
      </button>
    </div>
  </div>

  {relatedProducts.length > 0 && (
    <section className="mt-20">
      <h2 className="text-2xl font-bold tracking-tight text-slate-950">
        Related products
      </h2>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {relatedProducts.map(
          (related) => (
            <StoreProductCard
              key={related.id}
              product={related}
              onClick={() =>
                onProductClick(
                  related,
                )
              }
            />
          ),
        )}
      </div>
    </section>
  )}
</main>

);
}

function CartPage({
cart,
summary,
currency,
onUpdateQuantity,
onRemove,
onCheckout,
onContinueShopping,
}: {
cart: CartItem[];
summary: {
subtotal: number;
shipping: number;
total: number;
itemCount: number;
};
currency: string;
onUpdateQuantity: (
productId: string,
quantity: number,
) => void;
onRemove: (productId: string) => void;
onCheckout: () => void;
onContinueShopping: () => void;
}) {
if (cart.length === 0) {
return (
<main className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
<h1 className="text-3xl font-bold tracking-tight text-slate-950">
Your cart is empty
</h1>

    <p className="mt-3 text-sm text-slate-500">
      Add products to your cart
      to continue.
    </p>

    <button
      type="button"
      onClick={onContinueShopping}
      className="mt-8 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white"
    >
      Continue shopping
    </button>
  </main>
);

}

return (
<main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
<h1 className="text-3xl font-bold tracking-tight text-slate-950">
Your cart
</h1>

  <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
    <div className="space-y-4">
      {cart.map((item) => (
        <div
          key={item.product.id}
          className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-4"
        >
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
            {item.product.image_url ? (
              <img
                src={
                  item.product
                    .image_url
                }
                alt={
                  item.product.name
                }
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No image
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-950">
              {item.product.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {formatCurrency(
                item.product.price,
                item.product
                  .currency ||
                  "USD",
              )}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  onUpdateQuantity(
                    item.product.id,
                    item.quantity -
                      1,
                  )
                }
                className="h-8 w-8 rounded-lg border border-slate-200"
              >
                −
              </button>

              <span className="w-6 text-center text-sm font-medium">
                {item.quantity}
              </span>

              <button
                type="button"
                onClick={() =>
                  onUpdateQuantity(
                    item.product.id,
                    item.quantity +
                      1,
                  )
                }
                className="h-8 w-8 rounded-lg border border-slate-200"
              >
                +
              </button>

              <button
                type="button"
                onClick={() =>
                  onRemove(
                    item.product.id,
                  )
                }
                className="ml-3 text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>

    <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">
        Order summary
      </h2>

      <div className="mt-6 space-y-4 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">
            Subtotal
          </span>

          <span className="font-medium">
            {formatCurrency(
              summary.subtotal,
              currency,
            )}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">
            Shipping
          </span>

          <span className="font-medium">
            {formatCurrency(
              summary.shipping,
              currency,
            )}
          </span>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="flex justify-between text-base">
            <span className="font-semibold">
              Total
            </span>

            <span className="font-bold">
              {formatCurrency(
                summary.total,
                currency,
              )}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Checkout
      </button>
    </aside>
  </div>
</main>

);
}