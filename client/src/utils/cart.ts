import type { CartItem, CartSummary } from "../types/cart";
import type { Product, ProductVariant } from "../types/product";
import { getShippingFee } from "./shipping";
import { convertCurrency } from "./currency";

const CART_STORAGE_KEY = "custom_ecommerce_cart";

function sameLine(item: CartItem, productId: string, variantId?: string) {
  return (
    item.product.id === productId &&
    (item.variant_id || undefined) === (variantId || undefined)
  );
}

function variantLabel(variant: ProductVariant) {
  const name = String(variant.name ?? "").trim();
  const value = String(variant.value ?? "").trim();
  if (name && value && name.toLowerCase() !== value.toLowerCase())
    return `${name}: ${value}`;
  return name || value || "Selected option";
}

function variantPrice(product: Product, variant?: ProductVariant): number {
  if (product.price_override !== null && product.price_override !== undefined) {
    const override = Number(product.price_override);
    if (Number.isFinite(override) && override >= 0) return override;
  }

  const raw = String(variant?.price ?? "").trim();
  if (raw) {
    const price = Number(raw);
    if (Number.isFinite(price) && price >= 0) return price;
  }
  const basePrice = Number(product.price);
  return Number.isFinite(basePrice) && basePrice >= 0 ? basePrice : 0;
}

export function getCartItemUnitPrice(item: CartItem): number {
  if (
    item.product.price_override !== null &&
    item.product.price_override !== undefined
  ) {
    const override = Number(item.product.price_override);
    if (Number.isFinite(override) && override >= 0) return override;
  }

  return item.unit_price ?? (Number(item.product.price) || 0);
}

export function getCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    // Normalize old saved cart entries so carts created before variants still work.
    return parsed
      .filter(
        (item) =>
          item &&
          item.product &&
          Number.isSafeInteger(item.quantity) &&
          item.quantity > 0,
      )
      .map((item) => ({
        product: item.product,
        quantity: item.quantity,
        ...(typeof item.variant_id === "string"
          ? { variant_id: item.variant_id }
          : {}),
        ...(typeof item.variant_name === "string"
          ? { variant_name: item.variant_name }
          : {}),
        ...(Number.isFinite(Number(item.unit_price))
          ? { unit_price: Number(item.unit_price) }
          : {}),
        ...(Number.isFinite(Number(item.variant_stock))
          ? { variant_stock: Number(item.variant_stock) }
          : {}),
      })) as CartItem[];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("store-cart-updated"));
}

export function addToCart(
  cart: CartItem[],
  product: Product,
  quantity = 1,
  variant?: ProductVariant,
): CartItem[] {
  const variantId = variant?.id ? String(variant.id) : undefined;
  const existing = cart.find((item) => sameLine(item, product.id, variantId));
  const newLine: CartItem = {
    product,
    quantity: (existing?.quantity ?? 0) + quantity,
    ...(variantId
      ? { variant_id: variantId, variant_name: variantLabel(variant!) }
      : {}),
    unit_price: variantPrice(product, variant),
    ...(variant
      ? { variant_stock: Math.max(0, Number(variant.stock) || 0) }
      : {}),
  };

  if (existing)
    return cart.map((item) =>
      sameLine(item, product.id, variantId) ? newLine : item,
    );
  return [...cart, newLine];
}

export function updateCartItem(
  cart: CartItem[],
  productId: string,
  quantity: number,
  variantId?: string,
): CartItem[] {
  if (quantity <= 0) return removeCartItem(cart, productId, variantId);
  return cart.map((item) =>
    sameLine(item, productId, variantId) ? { ...item, quantity } : item,
  );
}

export function removeCartItem(
  cart: CartItem[],
  productId: string,
  variantId?: string,
): CartItem[] {
  return cart.filter((item) => !sameLine(item, productId, variantId));
}

export function clearCart(): void {
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("store-cart-updated"));
}

export function getCartCount(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

export function getCartSummary(
  cart: CartItem[],
  country = "NG",
  currency = "NGN",
): CartSummary {
  const subtotal = cart.reduce((total, item) => {
    const productCurrency = item.product.currency || "USD";
    const unitPrice = getCartItemUnitPrice(item);
    const convertedPrice = convertCurrency(
      unitPrice,
      productCurrency,
      currency,
    );
    return total + convertedPrice * item.quantity;
  }, 0);
  const shipping = cart.length > 0 ? getShippingFee(country, currency) : 0;
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    itemCount: getCartCount(cart),
  };
}
