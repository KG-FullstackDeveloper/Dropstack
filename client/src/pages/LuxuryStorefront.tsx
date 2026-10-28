import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingBag,
  Sun,
  Moon,
  ArrowUpRight,
  SlidersHorizontal,
  Zap,
  ShieldCheck,
  Truck,
  Headphones,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../services/api";
import type { Product } from "../types/product";
import { convertCurrency } from "../utils/currency";
import "./LuxuryStorefront.css";

interface LuxuryStorefrontProps {
  products?: Product[];
  storeName?: string;
  tagline?: string;
  homeHref?: string;
  storeLoadError?: string;
  currency?: string;
  loading?: boolean;
  cartCount?: number;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onCartClick?: () => void;
}

export default function LuxuryStorefront({
  products: suppliedProducts,
  storeName = "MEO",
  tagline = "Thoughtfully selected electronics and everyday innovations designed to make more possible.",
  homeHref = "/luxury-store",
  storeLoadError = "",
  currency = "NGN",
  loading: externalLoading = false,
  cartCount = 0,
  onProductClick,
  onAddToCart,
  onCartClick,
}: LuxuryStorefrontProps) {
  const navigate = useNavigate();

  const [loadedProducts, setLoadedProducts] = useState<Product[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // Load active products from the existing backend when products
  // have not already been provided by a parent component.
  useEffect(() => {
    if (suppliedProducts !== undefined) {
      setInternalLoading(false);
      setError("");
      return;
    }

    let active = true;

    async function loadProducts() {
      try {
        setInternalLoading(true);
        setError("");

        const items = await getProducts();

        if (active) {
          setLoadedProducts(
            items.filter((product) => Number(product.active) === 1),
          );
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load products.",
          );
        }
      } finally {
        if (active) {
          setInternalLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, [suppliedProducts]);

  const products = suppliedProducts ?? loadedProducts;
  const loading = externalLoading || internalLoading;
  const displayedError = storeLoadError || error;

  // Convert the stored base price to the visitor's currency.
  const formatPrice = (price: number, productCurrency?: string) => {
    const currencyCode = currency;
    const convertedPrice = convertCurrency(
      price,
      productCurrency || "USD",
      currencyCode,
    );

    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 2,
      }).format(convertedPrice);
    } catch {
      return `${currencyCode} ${convertedPrice.toLocaleString()}`;
    }
  };

  // Support the existing image_url and images fields.
  const getImage = (product: Product): string => {
    return product.image_url || product.images?.[0] || "";
  };

  // Create filter options from the actual product categories.
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

  // Filter products by category and searchable text.
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

  function handleProductClick(product: Product) {
    if (onProductClick) {
      onProductClick(product);
      return;
    }

    // Use the existing product detail route.
    navigate(`/product/${encodeURIComponent(product.id)}`);
  }

  function resetFilters() {
    setSearch("");
    setCategory("All");
  }

  return (
    <main
      className={`luxury-store ${darkMode ? "luxury-dark" : "luxury-light"}`}
    >
      {/* Announcement bar */}
      <div className="luxury-announcement">
        <Zap size={14} />
        <span>TECHNOLOGY, REFINED.</span>
        <span className="announcement-divider">—</span>
        <span>Discover your next upgrade.</span>
      </div>

      {/* Store navigation */}
      <header className="luxury-header">
        <a
          className="luxury-logo"
          href={homeHref}
          aria-label={`${storeName} home`}
        >
          {storeName}
          <span>.</span>
          <small>TECHNOLOGY</small>
        </a>

        <nav className="luxury-nav" aria-label="Main navigation">
          <a href="#collection">Shop</a>
          <a href="#benefits">Why {storeName}</a>
        </nav>

        <div className="luxury-header-actions">
          <button
            type="button"
            className="luxury-icon-button"
            onClick={() => setDarkMode((current) => !current)}
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          <button
            type="button"
            className="luxury-cart-button"
            onClick={onCartClick}
            aria-label={`Shopping cart, ${cartCount} items`}
          >
            <ShoppingBag size={19} />
            <span>Bag</span>
            <span className="luxury-cart-count">{cartCount}</span>
          </button>
        </div>
      </header>

      {/* Hero section */}
      <section className="luxury-hero">
        <div className="luxury-hero-content">
          <span className="luxury-eyebrow">
            <span className="luxury-eyebrow-line" />
            THE NEXT GENERATION
          </span>

          <h1>
            Technology
            <br />
            with <em>intention.</em>
          </h1>

          <p>{tagline}</p>

          <a className="luxury-primary-button" href="#collection">
            Explore collection <ArrowUpRight size={18} />
          </a>

          <div className="luxury-hero-note">
            <ShieldCheck size={17} />
            <span>Shop with confidence</span>
          </div>
        </div>

        <div
          className="luxury-hero-visual"
          aria-label="Abstract premium technology artwork"
        >
          <div className="luxury-orbit orbit-one" />
          <div className="luxury-orbit orbit-two" />
          <div className="luxury-orbit orbit-three" />

          <div className="luxury-hero-core">
            <span>ME</span>
            <span>O</span>
          </div>

          <div className="luxury-visual-caption">
            <span>DESIGNED FOR WHAT'S NEXT</span>
            <span>01 / INNOVATION</span>
          </div>
        </div>

        <div className="luxury-hero-index">01 — 04</div>
      </section>

      {/* Benefits */}
      <section className="luxury-benefits" id="benefits">
        <div>
          <Truck size={21} />
          <span>
            <strong>Delivery options</strong>
            <small>Clear delivery information at checkout</small>
          </span>
        </div>

        <div>
          <ShieldCheck size={21} />
          <span>
            <strong>Secure shopping</strong>
            <small>A straightforward shopping experience</small>
          </span>
        </div>

        <div>
          <Headphones size={21} />
          <span>
            <strong>Customer support</strong>
            <small>Help when you need it</small>
          </span>
        </div>
      </section>

      {/* Product collection */}
      <section className="luxury-collection" id="collection">
        <div className="luxury-section-heading">
          <div>
            <span className="luxury-eyebrow">THE COLLECTION</span>
            <h2>
              Good things. <em>Better technology.</em>
            </h2>
            <p>Explore the products selected for your everyday life.</p>
          </div>

          <span className="luxury-product-total">
            {String(filteredProducts.length).padStart(2, "0")} PRODUCTS
          </span>
        </div>

        <div className="luxury-product-tools">
          <div className="luxury-search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="luxury-category-label">
            <SlidersHorizontal size={17} />
            <span>FILTER</span>
          </div>
        </div>

        <div className="luxury-categories">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? "active" : ""}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="luxury-empty">
            <div className="luxury-loading-mark" />
            <p>Loading the collection...</p>
          </div>
        ) : displayedError ? (
          <div className="luxury-empty" role="alert">
            <h3>This storefront is temporarily unavailable.</h3>
            <p>{displayedError}</p>

            <button
              type="button"
              className="luxury-reset-button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="luxury-empty">
            <ShoppingBag size={32} strokeWidth={1.2} />
            <h3>No products found</h3>

            <p>
              {products.length === 0
                ? "Your active products will appear here when available."
                : "Try another search or choose a different category."}
            </p>

            <button
              type="button"
              className="luxury-reset-button"
              onClick={resetFilters}
            >
              View all products
            </button>
          </div>
        ) : (
          <div className="luxury-product-grid">
            {filteredProducts.map((product, index) => {
              const image = getImage(product);

              return (
                <article className="luxury-product-card" key={product.id}>
                  <button
                    type="button"
                    className="luxury-product-image"
                    onClick={() => handleProductClick(product)}
                    aria-label={`View ${product.name}`}
                  >
                    {image ? (
                      <img src={image} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="luxury-no-image">
                        <ShoppingBag size={30} strokeWidth={1} />
                        <span>PRODUCT IMAGE</span>
                      </div>
                    )}

                    <span className="luxury-product-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="luxury-view-product">
                      View <ArrowUpRight size={15} />
                    </span>
                  </button>

                  <div className="luxury-product-info">
                    <span className="luxury-product-category">
                      {product.category || "Technology"}
                    </span>

                    <button
                      type="button"
                      className="luxury-product-name"
                      onClick={() => handleProductClick(product)}
                    >
                      {product.name}
                    </button>

                    <div className="luxury-product-bottom">
                      <strong>
                        {formatPrice(
                          Number(product.price_override ?? product.price) || 0,
                          product.currency,
                        )}
                      </strong>

                      <button
                        type="button"
                        className="luxury-add-button"
                        onClick={() => onAddToCart?.(product)}
                        aria-label={`Add ${product.name} to cart`}
                        title="Add to cart"
                      >
                        <ShoppingBag size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="luxury-footer">
        <a className="luxury-logo" href={homeHref}>
          {storeName}
          <span>.</span>
          <small>TECHNOLOGY</small>
        </a>

        <p>Better technology. More possibilities.</p>

        <span>
          © {new Date().getFullYear()} {storeName}. All rights reserved.
        </span>
      </footer>
    </main>
  );
}
