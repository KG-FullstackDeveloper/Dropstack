import { Check, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { useState } from "react";

import type { Product } from "../../types/product";

interface StoreProductPurchasePanelProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function StoreProductPurchasePanel({
  product,
  onAddToCart,
}: StoreProductPurchasePanelProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => Math.min(99, current + 1));
  }

  function handleAddToCart() {
    onAddToCart(product, quantity);
    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1800);
  }

  const currency = product.currency || "USD";

  const price = Number(product.price) || 0;

  const formattedPrice = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(price);

  const delivery =
    product.delivery_time || "Delivery estimate shown at checkout";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-3xl font-bold tracking-tight text-slate-950">
          {formattedPrice}
        </p>

        {product.category && (
          <p className="mt-2 text-sm text-slate-500">{product.category}</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <Truck size={20} className="mt-0.5 shrink-0 text-slate-700" />

          <div>
            <p className="text-sm font-semibold text-slate-950">Delivery</p>

            <p className="mt-1 text-sm leading-6 text-slate-600">{delivery}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-950">Quantity</p>

        <div className="flex w-fit items-center rounded-xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={decreaseQuantity}
            disabled={quantity <= 1}
            className="flex h-11 w-11 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus size={17} />
          </button>

          <span
            className="flex h-11 min-w-12 items-center justify-center border-x border-slate-200 px-3 text-sm font-semibold text-slate-950"
            aria-live="polite"
          >
            {quantity}
          </span>

          <button
            type="button"
            onClick={increaseQuantity}
            disabled={quantity >= 99}
            className="flex h-11 w-11 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus size={17} />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-semibold text-white shadow-sm transition ${
          added ? "bg-emerald-600" : "bg-slate-950 hover:bg-slate-800"
        }`}
      >
        {added ? (
          <>
            <Check size={19} />
            Added to cart
          </>
        ) : (
          <>
            <ShoppingBag size={19} />
            Add to cart
          </>
        )}
      </button>

      <div className="grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-3">
        <Benefit title="Secure checkout" description="Protected payment flow" />

        <Benefit title="Order support" description="Help when you need it" />

        <Benefit
          title="Delivery updates"
          description="Tracking when available"
        />
      </div>
    </div>
  );
}

function Benefit({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-950">{title}</p>

      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}
