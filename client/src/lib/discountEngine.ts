import type { DiscountRule } from "../types/storeSettings";

export type DiscountCartItem = {
  productId: string;
  collectionIds?: string[];
  quantity: number;
  unitPrice: number;
};

export type DiscountCart = {
  items: DiscountCartItem[];
  subtotal: number;
  shipping: number;
};

export type DiscountResult = {
  discountAmount: number;
  shippingDiscount: number;
  totalDiscount: number;
  appliedRuleId: string | null;
  reason?: string;
};

export function calculateDiscount(
  rule: DiscountRule,
  cart: DiscountCart,
  now = new Date()
): DiscountResult {
  if (!rule.active) return notApplied("Discount is inactive.");

  if (rule.startAt && now < new Date(rule.startAt)) {
    return notApplied("Discount has not started yet.");
  }

  if (rule.endAt && now > new Date(rule.endAt)) {
    return notApplied("Discount has expired.");
  }

  if (
    rule.usageLimit !== undefined &&
    rule.usageCount >= rule.usageLimit
  ) {
    return notApplied("Discount usage limit reached.");
  }

  if (
    rule.minimumOrderAmount !== undefined &&
    cart.subtotal < rule.minimumOrderAmount
  ) {
    return notApplied(
      `Minimum order amount is ${rule.minimumOrderAmount}.`
    );
  }

  const matchingItems = cart.items.filter((item) => {
    if (rule.target === "order") return true;

    if (rule.target === "products") {
      return rule.productIds.includes(item.productId);
    }

    return (item.collectionIds || []).some((id) =>
      rule.collectionIds.includes(id)
    );
  });

  const quantity = matchingItems.reduce((sum, item) => sum + item.quantity, 0);

  if (
    rule.minimumQuantity !== undefined &&
    quantity < rule.minimumQuantity
  ) {
    return notApplied(
      `Minimum quantity is ${rule.minimumQuantity}.`
    );
  }

  if (rule.type !== "free_shipping" && matchingItems.length === 0) {
    return notApplied("Cart does not contain qualifying products.");
  }

  if (rule.type === "free_shipping") {
    return {
      discountAmount: 0,
      shippingDiscount: cart.shipping,
      totalDiscount: cart.shipping,
      appliedRuleId: rule.id,
    };
  }

  if (rule.type === "percentage") {
    const amount = Math.min(
      cart.subtotal,
      Math.max(0, cart.subtotal * (rule.value / 100))
    );

    return applied(rule.id, amount);
  }

  if (rule.type === "fixed") {
    return applied(rule.id, Math.min(cart.subtotal, Math.max(0, rule.value)));
  }

  const buyQuantity = Math.max(1, rule.buyQuantity ?? 1);
  const getQuantity = Math.max(1, rule.getQuantity ?? 1);
  const sets = Math.floor(quantity / (buyQuantity + getQuantity));
  const freeUnits = sets * getQuantity;

  if (freeUnits < 1) {
    return notApplied(
      "Cart does not contain enough qualifying items for this promotion."
    );
  }

  const eligiblePrices = matchingItems
    .flatMap((item) =>
      Array.from({ length: item.quantity }, () => item.unitPrice)
    )
    .sort((a, b) => a - b);

  const percent = Math.min(
    100,
    Math.max(0, rule.getDiscountPercent ?? 100)
  );

  const amount = eligiblePrices
    .slice(0, freeUnits)
    .reduce((sum, price) => sum + price, 0) * (percent / 100);

  return applied(rule.id, amount);
}

function applied(ruleId: string, amount: number): DiscountResult {
  return {
    discountAmount: amount,
    shippingDiscount: 0,
    totalDiscount: amount,
    appliedRuleId: ruleId,
  };
}

function notApplied(reason: string): DiscountResult {
  return {
    discountAmount: 0,
    shippingDiscount: 0,
    totalDiscount: 0,
    appliedRuleId: null,
    reason,
  };
}
