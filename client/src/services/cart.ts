export interface CartItem {
  productId: string;
  quantity: number;
}

const CART_KEY = "meo_store_cart";

export function getCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is CartItem =>
        typeof item?.productId === "string" &&
        typeof item?.quantity === "number" &&
        item.quantity > 0
    );
  } catch {
    return [];
  }
}

export function saveCart(
  cart: CartItem[]
): void {
  localStorage.setItem(
    CART_KEY,
    JSON.stringify(cart)
  );
}

export function addToCart(
  productId: string,
  quantity = 1
): CartItem[] {
  const cart = getCart();

  const existing = cart.find(
    (item) => item.productId === productId
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      productId,
      quantity,
    });
  }

  saveCart(cart);

  return cart;
}

export function updateCartItem(
  productId: string,
  quantity: number
): CartItem[] {
  const cart = getCart();

  const item = cart.find(
    (entry) => entry.productId === productId
  );

  if (!item) {
    return cart;
  }

  if (quantity <= 0) {
    return removeFromCart(productId);
  }

  item.quantity = quantity;

  saveCart(cart);

  return cart;
}

export function removeFromCart(
  productId: string
): CartItem[] {
  const cart = getCart().filter(
    (item) => item.productId !== productId
  );

  saveCart(cart);

  return cart;
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
}

export function getCartCount(
  cart: CartItem[] = getCart()
): number {
  return cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );
}