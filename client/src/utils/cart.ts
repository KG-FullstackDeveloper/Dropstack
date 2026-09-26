import type { CartItem, CartSummary } from "../types/cart";
import { getShippingFee } from "./shipping";
import { convertCurrency } from "./currency";

const CART_STORAGE_KEY = "custom_ecommerce_cart";

export function getCart(): CartItem[] {
try {
const stored = localStorage.getItem(CART_STORAGE_KEY);

if (!stored) {
  return [];
}

const parsed = JSON.parse(stored);

if (!Array.isArray(parsed)) {
  return [];
}

return parsed;

} catch {
return [];
}
}

export function saveCart(cart: CartItem[]): void {
localStorage.setItem(
CART_STORAGE_KEY,
JSON.stringify(cart),
);

window.dispatchEvent(
new CustomEvent("store-cart-updated"),
);
}

export function addToCart(
cart: CartItem[],
product: CartItem["product"],
quantity = 1,
): CartItem[] {
const existing = cart.find(
(item) => item.product.id === product.id,
);

if (existing) {
return cart.map((item) =>
item.product.id === product.id
? {
...item,
quantity: item.quantity + quantity,
}
: item,
);
}

return [
...cart,
{
product,
quantity,
},
];
}

export function updateCartItem(
cart: CartItem[],
productId: string,
quantity: number,
): CartItem[] {
if (quantity <= 0) {
return removeCartItem(cart, productId);
}

return cart.map((item) =>
item.product.id === productId
? {
...item,
quantity,
}
: item,
);
}

export function removeCartItem(
cart: CartItem[],
productId: string,
): CartItem[] {
return cart.filter(
(item) => item.product.id !== productId,
);
}

export function clearCart(): void {
localStorage.removeItem(CART_STORAGE_KEY);

window.dispatchEvent(
new CustomEvent("store-cart-updated"),
);
}

export function getCartCount(
cart: CartItem[],
): number {
return cart.reduce(
(total, item) => total + item.quantity,
0,
);
}

export function getCartSummary(
cart: CartItem[],
country = "NG",
currency = "NGN",
): CartSummary {
const subtotal = cart.reduce(
(total, item) => {
const productCurrency =
item.product.currency || "USD";

  const convertedPrice = convertCurrency(
    item.product.price,
    productCurrency,
    currency,
  );

  return total + convertedPrice * item.quantity;
},
0,

);

const shipping =
cart.length > 0
? getShippingFee(country, currency)
: 0;

return {
subtotal,
shipping,
total: subtotal + shipping,
itemCount: getCartCount(cart),
};
}